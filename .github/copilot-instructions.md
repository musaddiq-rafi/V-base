# VBase Copilot Instructions

A real-time collaborative virtual workspace built with Next.js 14+, Convex, Clerk, Liveblocks, and LiveKit.

---

## Architecture Overview

### Data Separation (Critical Pattern)
- **Ephemeral data → Liveblocks**: Cursor positions, typing indicators, real-time editor state (Yjs), whiteboard shapes
- **Persistent data → Convex**: User profiles, workspaces, rooms, chat history, saved documents/code files

### Provider Hierarchy (`app/layout.tsx`)
```
ClerkProvider → ConvexProviderWithClerk → LiveblocksProvider → {children}
```
LiveKit provider wraps individual meeting components, not the entire app.

### Authentication Flow
- Clerk manages users/orgs via webhooks → `convex/http.ts` routes to `convex/clerk.ts` → upserts to `convex/users.ts`/`convex/workspaces.ts`
- Liveblocks auth: `/api/liveblocks-auth/route.ts` validates Clerk session, returns Liveblocks token
- LiveKit auth: `/api/livekit/route.ts` generates room tokens for video/audio

---

## Room Types & Components

| Room Type | List Component | Editor Component | Status |
|-----------|---------------|------------------|--------|
| `document` | `DocumentList` | `CollaborativeEditor` (Tiptap + Liveblocks) | ✅ Implemented |
| `code` | `FileExplorer` | `CodeEditor` (CodeMirror + Yjs) | ✅ Implemented |
| `whiteboard` | `WhiteboardList` | `Whiteboard` (Excalidraw) | ✅ Implemented |
| `conference` | `MeetingSelector` | `MeetingRoom` (LiveKit) | ⚠️ Partial (See Bug Report) |
| `kanban` | — | — | 🔮 Planned |

Room routing: `app/workspace/[workspaceId]/room/[roomId]/page.tsx`

---

## Workspace Constraints (Hard Limits)

| Constraint | Limit |
|------------|-------|
| Rooms per Workspace | **10 max** |
| Conference/Meeting Rooms per Workspace | **1 max** |
| Concurrent Meetings per Conference Room | **3 max** |
| Members per Workspace | **10 max** |

---

## Chat System Architecture

### Overview
The chat system uses a 3-tier architecture with different scopes and lifecycles. **All tiers use the unified `channels` + `messages` system.**

### Tier 1: Workspace Global Chat (✅ Implemented)
- **Channel Type:** `general`
- **Channel:** `#general` - automatically created when a workspace is created
- **Scope:** All workspace members have access
- **Location:** Floating bubble UI accessible from workspace pages
- **Component:** `components/chat/chat-system.tsx`
- **Data Flow:** Messages stored in Convex `messages` table, linked via `channels` table

### Tier 2: Direct Messages (✅ Implemented)
- **Channel Type:** `direct`
- **Channel:** Private 1:1 messaging between workspace members
- **Creation:** Via "New Message" button in chat bubble UI
- **Component:** `NewDmModal` in `components/chat/chat-system.tsx`
- **Data Flow:** Creates/retrieves DM channel via `api.channels.createOrGetDirectChannel`

### Tier 3: Context-Aware File Chat (🔮 Planned - Implementation Guide Below)

> **IMPORTANT:** This feature is NOT yet implemented. The following is the approved implementation approach.

#### Design Decision: Channel-Based Architecture

**DO NOT** create a separate messaging system for file chats. Instead, treat file chats as another channel type. This approach:
- Reuses all existing `messages.ts` mutations/queries (sendMessage, toggleReaction, markChannelAsRead)
- Allows the existing `ChatWindow` component to work with zero modifications
- Automatically includes file chats in `getUnreadCounts` aggregation
- Follows the DRY principle

#### Step 1: Update Schema (`convex/schema.ts`)

Add `"file"` to channel types and add context fields:

```typescript
// convex/schema.ts
channels: defineTable({
  workspaceId: v.id("workspaces"),
  name: v.string(),
  type: v.union(
    v.literal("general"),
    v.literal("direct"),
    v.literal("group"),
    v.literal("file")      // <-- ADD THIS
  ),
  participantIds: v.optional(v.array(v.string())),

  // NEW: Context binding for file-based chat channels
  contextType: v.optional(v.union(
    v.literal("document"),
    v.literal("codeFile"),
    v.literal("whiteboard")
  )),
  contextId: v.optional(v.string()), // The _id of the linked entity (as string)

  createdAt: v.number(),
  createdBy: v.string(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_participants", ["participantIds"])
  .index("by_context", ["contextType", "contextId"]), // <-- ADD THIS INDEX
```

#### Step 2: Auto-Create Channel on File Creation

When creating a document/codeFile/whiteboard, automatically create its linked chat channel.

**For Documents (`convex/documents.ts`):**
```typescript
// Inside createDocument mutation, after inserting the document:
const documentId = await ctx.db.insert("documents", { ... });

// Auto-create linked chat channel
await ctx.db.insert("channels", {
  workspaceId: args.workspaceId,
  name: `doc-chat-${args.name}`,
  type: "file",
  contextType: "document",
  contextId: documentId, // Link to the document
  createdAt: Date.now(),
  createdBy: args.createdBy,
});

return documentId;
```

**For Code Files (`convex/codeFiles.ts`):**
```typescript
// Inside createFile mutation (NOT createFolder), after inserting the file:
const fileId = await ctx.db.insert("codeFiles", { ... });

// Auto-create linked chat channel
await ctx.db.insert("channels", {
  workspaceId: args.workspaceId,
  name: `code-chat-${args.name}`,
  type: "file",
  contextType: "codeFile",
  contextId: fileId,
  createdAt: Date.now(),
  createdBy: identity.subject,
});

return fileId;
```

**For Whiteboards (`convex/whiteboards.ts`):**
```typescript
// Inside createWhiteboard mutation, after inserting:
const whiteboardId = await ctx.db.insert("whiteboards", { ... });

// Auto-create linked chat channel
await ctx.db.insert("channels", {
  workspaceId: args.workspaceId,
  name: `wb-chat-${args.name}`,
  type: "file",
  contextType: "whiteboard",
  contextId: whiteboardId,
  createdAt: Date.now(),
  createdBy: args.createdBy,
});

return whiteboardId;
```

#### Step 3: Add Query to Get Channel by Context (`convex/channels.ts`)

```typescript
// convex/channels.ts

/**
 * Get the chat channel linked to a specific file/document/whiteboard
 */
export const getChannelByContext = query({
  args: {
    contextType: v.union(
      v.literal("document"),
      v.literal("codeFile"),
      v.literal("whiteboard")
    ),
    contextId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("channels")
      .withIndex("by_context", (q) =>
        q.eq("contextType", args.contextType).eq("contextId", args.contextId)
      )
      .unique();
  },
});
```

#### Step 4: Cascading Delete (Lifecycle Management)

When deleting a file, also delete its linked channel and messages.

**Update `convex/documents.ts` - deleteDocument:**
```typescript
export const deleteDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    // 1. Find and delete the linked channel
    const linkedChannel = await ctx.db
      .query("channels")
      .withIndex("by_context", (q) =>
        q.eq("contextType", "document").eq("contextId", args.documentId)
      )
      .unique();

    if (linkedChannel) {
      // Delete all messages in this channel
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", linkedChannel._id))
        .collect();

      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }

      // Delete lastRead records for this channel
      const readReceipts = await ctx.db
        .query("lastRead")
        .withIndex("by_channel", (q) => q.eq("channelId", linkedChannel._id))
        .collect();

      for (const receipt of readReceipts) {
        await ctx.db.delete(receipt._id);
      }

      // Delete the channel
      await ctx.db.delete(linkedChannel._id);
    }

    // 2. Delete the document itself
    await ctx.db.delete(args.documentId);

    return { success: true, deletedDocumentId: args.documentId };
  },
});
```

> Apply the same pattern to `codeFiles.ts` (deleteNode) and `whiteboards.ts` (deleteWhiteboard).

#### Step 5: Frontend Component (`components/chat/context-chat-sidebar.tsx`)

```typescript
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// Reuse the existing ChatWindow internals or extract to shared component

interface ContextChatSidebarProps {
  contextType: "document" | "codeFile" | "whiteboard";
  contextId: string;
  workspaceId: Id<"workspaces">;
}

export function ContextChatSidebar({
  contextType,
  contextId,
  workspaceId
}: ContextChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get the linked channel
  const channel = useQuery(api.channels.getChannelByContext, {
    contextType,
    contextId,
  });

  if (!channel) return null; // Channel not yet created (edge case)

  return (
    <>
      {/* Floating trigger button - bottom right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>

      {/* Collapsible right sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed top-0 right-0 h-full w-80 bg-white border-l shadow-xl z-30"
          >
            {/* Reuse ChatWindow logic here, passing channel._id */}
            <ContextChatPanel
              channelId={channel._id}
              channelName={channel.name}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

#### Step 6: Integration Points

Add `<ContextChatSidebar />` to editor pages:

**`app/workspace/[workspaceId]/room/[roomId]/document/[documentId]/page.tsx`:**
```typescript
// Inside the RoomProvider, add:
<ContextChatSidebar
  contextType="document"
  contextId={documentId}
  workspaceId={workspace._id}
/>
```

**`app/workspace/[workspaceId]/room/[roomId]/code/[fileId]/page.tsx`:**
```typescript
<ContextChatSidebar
  contextType="codeFile"
  contextId={fileId}
  workspaceId={workspace._id}
/>
```

---

## Meeting Room System

### Architecture
- **Constraint:** 1 Meeting Room (Conference type) allowed per workspace
- **Concurrency:** Up to 3 concurrent meetings can run simultaneously within that single room

### User Flow
1. User navigates to Conference Room → sees `MeetingSelector`
2. `MeetingSelector` displays list of active meetings (0-3)
3. User can:
   - Join an existing meeting
   - Create a new meeting (if < 3 active)
4. Before joining → `MeetingLobby` for camera/mic preview
5. After joining → `MeetingStageWithLiveKit` for the actual call

### Component Hierarchy
```
MeetingRoom (state machine)
├── MeetingSelector (selecting state)
├── MeetingLobby (lobby state)
└── LiveKitProvider
    └── MeetingStageWithLiveKit (in-meeting state)
```

### ⚠️ BUG REPORT: Peer Connection Issue

> **Status:** REQUIRES REPAIR
> **Severity:** Critical
> **Component:** `components/meeting/meeting-room.tsx`, `providers/livekit-provider.tsx`

**Symptoms:**
- Local media capture (Camera/Audio) works correctly
- Users A and B can both join the same meeting
- Users A and B **cannot see or hear each other**

**Suspected Causes:**
1. **Signaling Issue:** LiveKit room tokens may not be correctly associating users to the same room
2. **WebRTC Connection:** ICE candidate exchange may be failing
3. **Room Name Mismatch:** The `livekitRoomName` generated may differ between users

**Debugging Checklist:**
- [ ] Verify `livekitRoomName` is identical for all participants joining the same meeting
- [ ] Check LiveKit server logs for connection attempts
- [ ] Verify `/api/livekit/route.ts` returns correct room tokens
- [ ] Test if participants appear in `useParticipants()` hook
- [ ] Check browser console for WebRTC errors

**Key Code Path:**
1. Meeting created in [`convex/meetings.ts`](convex/meetings.ts) → generates `livekitRoomName: ${args.roomId}_${Date.now()}`
2. User joins → frontend calls `/api/livekit/route.ts` with room name
3. Token returned → passed to `LiveKitRoom` component
4. **Potential Issue:** If `Date.now()` differs between create/join, room names won't match

**Related Files:**
- `providers/livekit-provider.tsx` - LiveKit room connection
- `app/api/livekit/route.ts` - Token generation
- `convex/meetings.ts` - Meeting creation/joining logic
- `components/meeting/meeting-stage.tsx` - Participant rendering

---

## Convex Patterns

### Schema Location
`convex/schema.ts` — all tables use Clerk IDs (`clerkId`, `clerkOrgId`) as foreign keys

### Type Conventions
- `v.id("tableName")` for Convex document IDs
- `v.string()` for Clerk IDs (users, organizations)

### Index Naming
Pattern: `by_<field>` (e.g., `by_workspace`, `by_clerk_org`)

### Auth Pattern
```typescript
// Always validate auth in mutations
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Not authenticated");
```

### Internal Mutations
Use `internalMutation` for webhook handlers in `convex/users.ts`, `convex/workspaces.ts`

---

## Liveblocks Room ID Patterns

| Context | Room ID Pattern |
|---------|-----------------|
| Document | `doc:${documentId}` |
| Code file | `code:${fileId}` |
| Whiteboard | `whiteboard:${whiteboardId}` |
| Room presence | `room:${roomId}` |

---

## Code Execution (Dual RCE)

Two engines available in `lib/`:
- `piston.ts` - Public Piston API
- `vbase-rce.ts` - Custom Azure-hosted RCE

### Supported Languages
JavaScript, Python, Java, C, C++ (**No TypeScript support**)

### Engine Selection
Dropdown in `components/code/code-editor.tsx`

---

## Key Conventions

### Component Patterns
- Use `"use client"` only when using hooks (Convex, Liveblocks, Clerk)
- Server Components by default

### Styling Stack
- **CSS:** Tailwind CSS
- **Components:** Radix UI primitives in `components/ui/`
- **Icons:** `lucide-react`
- **Animations:** `framer-motion`

### File Organization
Features organized by domain:
```
components/
├── chat/       # Chat system components
├── code/       # Code editor, file explorer
├── document/   # Document editor, lists
├── meeting/    # Video conferencing
├── rooms/      # Room management
├── whiteboard/ # Whiteboard components
└── ui/         # Shared UI primitives
```

---

## Development Commands

```bash
npm run dev          # Next.js dev server (port 3000)
npx convex dev       # Convex dev (run in parallel terminal)
```

> **Both must run simultaneously for the app to work.**

---

## Environment Variables

Required in `.env.local`:

```env
# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Liveblocks
LIVEBLOCKS_SECRET_KEY=
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=

# LiveKit
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_URL=

# Custom RCE (optional)
NEXT_PUBLIC_VBASE_RCE_BASE_URL=
NEXT_PUBLIC_VBASE_RCE_API_SECRET=
```

---

## Future Roadmap

### 🔮 2D Spatial Dashboard (The "VBase" Vision)

We are transitioning from a standard dashboard to a "Gather.town" inspired 2D spatial interface.

#### Navigation System
- **Movement:** Arrow Keys to move user avatar
- **Interaction:** Join rooms by moving avatar "into" room grid cells
- **Visual:** Rooms displayed as interactive grids on a 2D map

#### UI Components Needed
- `SpatialCanvas` - Main 2D rendering surface
- `AvatarController` - Keyboard-controlled avatar movement
- `RoomGrid` - Visual room representation on map
- `UserAvatarStack` - Clerk-style component showing active users in a room

#### Technical Considerations
- Canvas rendering (HTML5 Canvas or PixiJS)
- Collision detection for room boundaries
- Real-time position sync via Liveblocks Presence

### 🔮 New Room Type: Kanban Room
- Trello-style task management
- Drag-and-drop columns
- Real-time collaboration via Liveblocks

### 🔮 RBAC (Role-Based Access Control)
Granular room access control:
- **Owner/Admin:** Full control, can delete rooms, manage access
- **Member:** Can view/edit based on room settings
- **Viewer:** Read-only access (future)

---

## Project Constraints

> This is a **university project**, not enterprise SaaS.

- Focus on MVP (Minimum Viable Product) functionality
- Do not suggest paid services or complex scaling solutions (AWS/Kubernetes)
- Prioritize readability and ease of integration for a team of 3 students
- Keep implementations simple and debuggable