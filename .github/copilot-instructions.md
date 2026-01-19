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
The chat system uses a 3-tier architecture with different scopes and lifecycles.

### Tier 1: Workspace Global Chat (✅ Implemented)
- **Channel:** `#general` - automatically created when a workspace is created
- **Scope:** All workspace members have access
- **Location:** Floating bubble UI accessible from workspace pages
- **Component:** `components/chat/chat-system.tsx`
- **Data Flow:** Messages stored in Convex `messages` table, linked via `channels` table

### Tier 2: Direct Messages (✅ Implemented)
- **Channel:** Private 1:1 messaging between workspace members
- **Creation:** Via "New Message" button in chat bubble UI
- **Component:** `NewDmModal` in `components/chat/chat-system.tsx`
- **Data Flow:** Creates/retrieves DM channel via `api.channels.createOrGetDirectChannel`

### Tier 3: Context-Aware Room Chat (🔮 Planned - Spec Only)

> **IMPORTANT:** This feature is NOT yet implemented. The following is the specification for future development.

#### Component Design Requirements
- **Type:** Reusable, pluggable React component
- **UI Pattern:** Collapsible Right Sidebar
- **Default State:** Collapsed
- **Trigger:** Bottom-right floating icon (consistent with existing chat bubble pattern)

#### Context Binding Logic
Chat context is bound to specific **files** or **entities** within a room, NOT the room itself.

**Example Flow (Document Room):**
1. User A creates "doc-A" in a Document Room
2. System automatically creates a chat channel specifically for "doc-A"
3. When Users B and C open "doc-A", they automatically join that specific channel
4. Messages in this channel are contextually relevant to "doc-A" only

**Example Flow (Code Room):**
1. User A creates "main.py" in a Code Room
2. System creates chat channel bound to "main.py"
3. Collaborators editing "main.py" see the same chat context

#### Lifecycle Management (Cascading Delete)
- The chat channel shares the lifecycle of its parent entity
- **Delete Parent → Delete Channel:** If "doc-A" is deleted, its associated chat channel and all messages are destroyed
- Implementation should use Convex's cascading delete pattern or explicit cleanup in delete mutations

#### Proposed Schema Extension
```typescript
// Add to convex/schema.ts
channels: defineTable({
  // ... existing fields ...

  // NEW: Context binding for Tier 3
  contextType: v.optional(v.union(
    v.literal("document"),
    v.literal("codeFile"),
    v.literal("whiteboard")
  )),
  contextId: v.optional(v.string()), // ID of the bound entity
})
  .index("by_context", ["contextType", "contextId"])
```

#### Proposed Component Structure
```
components/
  chat/
    chat-system.tsx          # Existing - Tier 1 & 2
    context-chat-sidebar.tsx # NEW - Tier 3 sidebar wrapper
    context-chat-panel.tsx   # NEW - Tier 3 chat panel
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
| Document | `document:${documentId}` |
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