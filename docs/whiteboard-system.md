# Whiteboard System - Data & Storage Flow Documentation

This document provides a comprehensive analysis of the whiteboard module's architecture, data flow, storage mechanisms, and integration with external services (Convex, Liveblocks, LiveKit).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Models & Schema](#data-models--schema)
3. [Storage Strategy](#storage-strategy)
4. [Component Hierarchy](#component-hierarchy)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Liveblocks Integration](#liveblocks-integration)
7. [Convex Integration](#convex-integration)
8. [Real-Time Collaboration Flow](#real-time-collaboration-flow)
9. [Known Issues & Bug Report](#known-issues--bug-report)
10. [File Reference](#file-reference)

---

## Architecture Overview

The whiteboard module implements a **dual-storage hybrid architecture**:

| Data Type | Storage Layer | Lifecycle |
|-----------|--------------|-----------|
| **Whiteboard metadata** | Convex (persistent) | Permanent |
| **Drawing content (Excalidraw elements)** | Convex (persistent) | Permanent |
| **Real-time cursor positions** | Liveblocks Presence (ephemeral) | Session-only |
| **Real-time drawing broadcasts** | Liveblocks Events (ephemeral) | Instant, not persisted |

### Key Architectural Decisions

1. **Excalidraw** is used as the drawing engine (dynamically imported to avoid SSR issues)
2. **Liveblocks** handles real-time presence (cursors) and broadcasting (live drawing sync)
3. **Convex** handles persistent storage of whiteboard metadata and content
4. **Content is JSON-stringified** Excalidraw elements stored in Convex

---

## Data Models & Schema

### Convex Schema (`convex/schema.ts`)

```typescript
whiteboards: defineTable({
  roomId: v.id("rooms"),           // Parent whiteboard room
  workspaceId: v.id("workspaces"), // Denormalized for faster queries
  name: v.string(),                // Whiteboard name
  content: v.optional(v.string()), // Serialized Excalidraw elements (JSON string)
  createdBy: v.string(),           // Clerk User ID
  createdAt: v.number(),           // Unix timestamp
  updatedAt: v.number(),           // Unix timestamp
  lastEditedBy: v.optional(v.string()), // Clerk User ID of last editor
})
  .index("by_room", ["roomId"])
  .index("by_workspace", ["workspaceId"])
```

### Liveblocks Type Definitions (`liveblocks.config.ts`)

```typescript
declare global {
  interface Liveblocks {
    // Cursor presence for real-time cursor tracking
    Presence: {
      cursor: { x: number; y: number } | null;
    };

    // Storage is EMPTY for whiteboards (not using Liveblocks storage)
    Storage: {};

    // User info from Clerk
    UserMeta: {
      id: string;
      info: {
        name: string;
        email: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events for broadcasting drawing updates
    RoomEvent: {
      type: "DRAW";
      elements: any[];  // Excalidraw elements array
    };
  }
}
```

---

## Storage Strategy

### What Gets Stored Where

```
┌─────────────────────────────────────────────────────────────────┐
│                       WHITEBOARD DATA                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    CONVEX (Persistent)                    │  │
│  │                                                           │  │
│  │  • Whiteboard record (name, roomId, workspaceId)         │  │
│  │  • Drawing content (JSON stringified Excalidraw elements)│  │
│  │  • Metadata (createdBy, updatedAt, lastEditedBy)         │  │
│  │                                                           │  │
│  │  ✅ Survives page refresh, user logout, server restart   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  LIVEBLOCKS (Ephemeral)                   │  │
│  │                                                           │  │
│  │  • Presence: User cursor positions (x, y)                │  │
│  │  • Events: DRAW broadcasts with elements array           │  │
│  │                                                           │  │
│  │  ⚠️ Lost on page refresh, disconnect, or session end     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Content Storage Format

The `content` field in Convex stores a **JSON-stringified array** of Excalidraw elements:

```json
[
  {
    "id": "abc123",
    "type": "rectangle",
    "x": 100,
    "y": 200,
    "width": 150,
    "height": 100,
    "strokeColor": "#000000",
    "backgroundColor": "#ffffff",
    "fillStyle": "solid",
    ...
  },
  {
    "id": "def456",
    "type": "text",
    "x": 300,
    "y": 150,
    "text": "Hello World",
    ...
  }
]
```

---

## Component Hierarchy

```
WhiteboardPage (app/workspace/[workspaceId]/room/[roomId]/whiteboard/[whiteboardId]/page.tsx)
│
├── RoomProvider (Liveblocks) - id: `whiteboard:${whiteboardId}`
│   │
│   └── Whiteboard (components/whiteboard/excalidraw-board.tsx)
│       │
│       ├── ExcalidrawWrapper (dynamic import from @excalidraw/excalidraw)
│       │
│       ├── Liveblocks Hooks:
│       │   ├── useBroadcastEvent() - sends DRAW events
│       │   ├── useEventListener() - receives DRAW events
│       │   ├── useUpdateMyPresence() - updates cursor position
│       │   └── useOthers() - gets other users' presence
│       │
│       └── Convex Hooks:
│           ├── useQuery(api.whiteboards.getWhiteboardById) - loads content
│           └── useMutation(api.whiteboards.saveWhiteboardContent) - saves content

WhiteboardList (components/whiteboard/whiteboard-list.tsx)
│
├── useQuery(api.whiteboards.getWhiteboardsByRoom) - lists whiteboards
│
└── WhiteboardCard (components/whiteboard/whiteboard-card.tsx)
    └── Link to whiteboard page
```

---

## Data Flow Diagrams

### 1. Initial Load Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │    │  Next.js    │    │  Liveblocks │    │   Convex    │
│   Client    │    │  Server     │    │   Server    │    │   Server    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │ 1. Navigate to   │                  │                  │
       │    whiteboard    │                  │                  │
       │─────────────────>│                  │                  │
       │                  │                  │                  │
       │<─────────────────│ 2. Return page   │                  │
       │                  │    component     │                  │
       │                  │                  │                  │
       │ 3. RoomProvider  │                  │                  │
       │    mounts        │                  │                  │
       │──────────────────────────────────>│                  │
       │                  │   POST /api/liveblocks-auth        │
       │                  │                  │                  │
       │<──────────────────────────────────│ 4. Auth token    │
       │                  │                  │                  │
       │                  │                  │                  │
       │ 5. useQuery      │                  │                  │
       │    getWhiteboardById               │                  │
       │────────────────────────────────────────────────────>│
       │                  │                  │                  │
       │<────────────────────────────────────────────────────│
       │                  │  6. Whiteboard data + content     │
       │                  │                  │                  │
       │ 7. Parse JSON    │                  │                  │
       │    content       │                  │                  │
       │                  │                  │                  │
       │ 8. updateScene() │                  │                  │
       │    with elements │                  │                  │
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
```

### 2. Real-Time Collaboration Flow (Drawing)

```
┌─────────────┐                              ┌─────────────┐
│   User A    │                              │   User B    │
│  (Drawing)  │                              │ (Watching)  │
└──────┬──────┘                              └──────┬──────┘
       │                                            │
       │ 1. User draws                              │
       │    (onChange fires)                        │
       │                                            │
       │ 2. Store elements                          │
       │    in currentElementsRef                   │
       │                                            │
       │ 3. broadcast({                             │
       │      type: "DRAW",                         │
       │      elements: [...]                       │
       │    })                                      │
       │─────────────────┐                          │
       │                 │                          │
       │                 ▼                          │
       │         ┌─────────────┐                    │
       │         │  Liveblocks │                    │
       │         │   Server    │                    │
       │         └──────┬──────┘                    │
       │                │                          │
       │                │ 4. Broadcast to           │
       │                │    room participants     │
       │                │─────────────────────────>│
       │                │                          │
       │                │                          │ 5. useEventListener
       │                │                          │    receives event
       │                │                          │
       │                │                          │ 6. Merge elements
       │                │                          │    into scene
       │                │                          │
       │ 7. After 1.5s  │                          │
       │    debounce,   │                          │
       │    auto-save   │                          │
       │────────────────────────────────────┐      │
       │                │                   │      │
       │                │                   ▼      │
       │                │           ┌─────────────┐│
       │                │           │   Convex    ││
       │                │           │   Server    ││
       │                │           └─────────────┘│
       │                │                          │
       ▼                ▼                          ▼
```

### 3. Auto-Save Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUTO-SAVE MECHANISM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   User draws  ──▶  onChange() fires                            │
│                         │                                       │
│                         ▼                                       │
│               Store in currentElementsRef                       │
│                         │                                       │
│                         ▼                                       │
│               Check if content changed                          │
│               (compare with lastSavedContentRef)                │
│                         │                                       │
│            ┌────────────┴────────────┐                         │
│            │                         │                         │
│       No change                  Changed                        │
│            │                         │                         │
│         (skip)                       ▼                         │
│                        Clear existing timeout                   │
│                                      │                         │
│                                      ▼                         │
│                        Set new 1.5s timeout                    │
│                                      │                         │
│                              (user keeps drawing)              │
│                              (timeout resets)                  │
│                                      │                         │
│                         ◀────────────┘                         │
│                                      │                         │
│                              (user stops)                      │
│                                      │                         │
│                                      ▼                         │
│                        1.5 seconds pass                        │
│                                      │                         │
│                                      ▼                         │
│                        performSave() executes                  │
│                                      │                         │
│                                      ▼                         │
│                        saveContentMutation({                   │
│                          whiteboardId,                         │
│                          content: JSON.stringify(elements),    │
│                          userId                                │
│                        })                                      │
│                                      │                         │
│                                      ▼                         │
│                        Update lastSavedContentRef              │
│                                      │                         │
│                                      ▼                         │
│                        Show "Saved" indicator                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Liveblocks Integration

### Room ID Pattern

```
whiteboard:${whiteboardId}
```

Example: `whiteboard:abc123xyz`

### Authentication Flow

1. **Client** mounts `<RoomProvider id="whiteboard:{id}">`
2. **Liveblocks SDK** calls `POST /api/liveblocks-auth`
3. **Auth endpoint** validates Clerk session
4. **Auth endpoint** creates Liveblocks session with user info
5. **Auth endpoint** grants `FULL_ACCESS` to the requested room
6. **Token returned** to client for WebSocket connection

### Hooks Used in Whiteboard Component

| Hook | Purpose |
|------|---------|
| `useBroadcastEvent()` | Send drawing updates to other users |
| `useEventListener()` | Receive drawing updates from others |
| `useUpdateMyPresence()` | Update cursor position |
| `useOthers()` | Get other users' cursors for rendering |

### Presence Data Structure

```typescript
{
  cursor: { x: number; y: number } | null
}
```

### Broadcast Event Structure

```typescript
{
  type: "DRAW",
  elements: ExcalidrawElement[]  // Full elements array
}
```

---

## Convex Integration

### Mutations

| Mutation | Purpose |
|----------|---------|
| `createWhiteboard` | Create new whiteboard record |
| `saveWhiteboardContent` | Save drawing content (JSON string) |
| `updateWhiteboard` | Update metadata (name, lastEditedBy) |
| `deleteWhiteboard` | Remove whiteboard |
| `recordWhiteboardEdit` | Track user activity |

### Queries

| Query | Purpose |
|-------|---------|
| `getWhiteboardById` | Load single whiteboard with content |
| `getWhiteboardsByRoom` | List all whiteboards in a room |

### Data Persistence Flow

```
Excalidraw Elements (Array)
         │
         ▼
JSON.stringify(elements)
         │
         ▼
saveWhiteboardContent({
  whiteboardId,
  content: jsonString,
  userId
})
         │
         ▼
ctx.db.patch(whiteboardId, {
  content: jsonString,
  lastEditedBy: userId,
  updatedAt: Date.now()
})
```

---

## Real-Time Collaboration Flow

### Element Merging Strategy

When receiving broadcast events, elements are merged using an **ID-based map**:

```typescript
// In useEventListener callback
const currentElements = excalidrawAPI.getSceneElements();
const newElements = event.elements;

// Merge using element IDs
const elementMap = new Map(currentElements.map((el) => [el.id, el]));
newElements.forEach((el) => {
  elementMap.set(el.id, el);  // Overwrites existing or adds new
});

excalidrawAPI.updateScene({
  elements: Array.from(elementMap.values()),
});
```

### Cursor Rendering

Other users' cursors are rendered using Excalidraw's **collaborators** feature:

```typescript
const collaborators = new Map(
  others.map((other) => [
    other.id,
    {
      username: other.info?.name || "User",
      color: { background: color, stroke: color },
      pointer: other.presence?.cursor || undefined,
    },
  ])
);

excalidrawAPI.updateScene({ collaborators });
```

---

## Known Issues & Bug Report

### ✅ RESOLVED: Whiteboard Persistence Issue

> **Status:** FIXED  
> **Severity:** N/A (Resolved)  
> **Component:** `components/whiteboard/excalidraw-board.tsx`

#### Previous Symptoms (Now Fixed)

- ~~User A draws on whiteboard → drawings appear correctly~~
- ~~User B sees User A's drawings in real-time (collaboration works)~~
- ~~When any user leaves the room and rejoins → **all drawings are gone**~~

#### Resolution

The persistence issue has been resolved. Whiteboard content now properly:
- Loads from Convex on initial page load
- Persists across page refreshes and user rejoins
- Syncs in real-time between collaborators
- Auto-saves reliably with the debounced save mechanism

---

## File Reference

| File | Purpose |
|------|---------|
| [excalidraw-board.tsx](../components/whiteboard/excalidraw-board.tsx) | Main whiteboard canvas component |
| [whiteboard-list.tsx](../components/whiteboard/whiteboard-list.tsx) | List view of whiteboards |
| [whiteboard-card.tsx](../components/whiteboard/whiteboard-card.tsx) | Individual whiteboard card |
| [create-whiteboard-modal.tsx](../components/whiteboard/create-whiteboard-modal.tsx) | Create whiteboard dialog |
| [whiteboards.ts](../convex/whiteboards.ts) | Convex mutations/queries |
| [schema.ts](../convex/schema.ts) | Database schema |
| [liveblocks.config.ts](../liveblocks.config.ts) | Liveblocks type definitions |
| [liveblocks-provider.tsx](../providers/liveblocks-provider.tsx) | Global Liveblocks provider |
| [liveblocks-auth/route.ts](../app/api/liveblocks-auth/route.ts) | Auth endpoint |
| [whiteboard page](../app/workspace/[workspaceId]/room/[roomId]/whiteboard/[whiteboardId]/page.tsx) | Page component |

---

## Summary

### What Works ✅

- Creating whiteboards (metadata stored in Convex)
- Real-time cursor sharing (Liveblocks Presence)
- Real-time drawing sync (Liveblocks Events / Broadcast)
- Auto-save mechanism (debounced, saves to Convex)
- Loading existing content on initial page load
- **Persistence on rejoin**: Content properly restored when users leave and return ✅

### Not Used

- **Liveblocks Storage**: Storage is empty (`{}`), not used for persistent whiteboard state
- **LiveKit**: Not involved in whiteboard module (only used for video conferencing)
