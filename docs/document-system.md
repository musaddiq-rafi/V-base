# VBase Document System Documentation

A comprehensive guide to the real-time collaborative document editing system in VBase, covering architecture, data flow, synchronization, and implementation details.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Real-Time Collaboration (Liveblocks + Tiptap)](#real-time-collaboration-liveblocks--tiptap)
5. [Backend (Convex)](#backend-convex)
6. [Frontend Components](#frontend-components)
7. [Document Lifecycle](#document-lifecycle)
8. [Authentication & Authorization](#authentication--authorization)
9. [Feature Details](#feature-details)
10. [File References](#file-references)

---

## Overview

The VBase document system provides Google Docs-like collaborative editing capabilities within workspace rooms. Key features:

- **Real-time collaborative editing** with multiple users
- **Rich text formatting** (bold, italic, headings, lists, colors, fonts)
- **Live cursor tracking** - see where other users are editing
- **A4 page layout** with ruler and margins
- **Auto-save** to Liveblocks storage (Yjs-based CRDT)
- **Document metadata** stored in Convex (name, creator, timestamps)
- **Export options** (PDF, HTML, JSON, TXT)

### Document System Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    DocumentPage (RoomProvider)                      ││
│  │  ┌───────────────┐  ┌──────────────┐  ┌─────────────────────┐      ││
│  │  │ DocumentHeader│  │    Toolbar   │  │ CollaborativeEditor │      ││
│  │  │ (name, menu)  │  │ (formatting) │  │ (Tiptap + Liveblocks)│     ││
│  │  └───────────────┘  └──────────────┘  └─────────────────────┘      ││
│  │  ┌───────────────┐  ┌──────────────┐                               ││
│  │  │ ActiveUsers   │  │    Ruler     │                               ││
│  │  └───────────────┘  └──────────────┘                               ││
│  └─────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
              ▼                                     ▼
┌─────────────────────────────┐     ┌─────────────────────────────────────┐
│      Liveblocks             │     │           Convex                    │
│  ┌───────────────────────┐  │     │  ┌─────────────────────────────┐   │
│  │  Real-time Sync (Yjs) │  │     │  │      documents table        │   │
│  │  - Document content   │  │     │  │  - name, createdBy          │   │
│  │  - Cursor positions   │  │     │  │  - updatedAt, lastEditedBy  │   │
│  │  - User presence      │  │     │  └─────────────────────────────┘   │
│  └───────────────────────┘  │     │  ┌─────────────────────────────┐   │
│  ┌───────────────────────┐  │     │  │         users table         │   │
│  │   Room Storage        │  │     │  │  - clerkId, name, email     │   │
│  │  (Persistent CRDT)    │  │     │  └─────────────────────────────┘   │
│  └───────────────────────┘  │     └─────────────────────────────────────┘
└─────────────────────────────┘
```

---

## Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Editor | Tiptap (ProseMirror) | Rich text editing framework |
| Collaboration | Liveblocks + Yjs | Real-time sync via CRDT |
| Frontend | React + Next.js | UI components |
| Metadata Storage | Convex | Document metadata (name, timestamps) |
| Authentication | Clerk | User identity & session |
| Styling | Tailwind CSS | UI styling |

### Data Separation Pattern

| Data Type | Storage | Reason |
|-----------|---------|--------|
| Document content (rich text) | Liveblocks (Yjs) | Real-time sync, CRDT conflict resolution |
| Document metadata | Convex | Persistent, queryable, relational |
| Cursor positions | Liveblocks Presence | Ephemeral, real-time |
| User info in editor | Liveblocks UserMeta | Cached for collaboration UI |

### Why This Separation?

1. **Liveblocks for Content**: Handles complex CRDT synchronization for collaborative text editing. Yjs ensures conflict-free merging when multiple users edit simultaneously.

2. **Convex for Metadata**: Provides reliable persistence, indexing, and querying for document lists, search, and audit trails.

---

## Data Model

### Convex Schema (`convex/schema.ts`)

```typescript
documents: defineTable({
  roomId: v.id("rooms"),              // Parent document room
  workspaceId: v.id("workspaces"),    // Denormalized for faster queries
  name: v.string(),                   // Document name (e.g., "Project Proposal")
  createdBy: v.string(),              // Clerk User ID
  createdAt: v.number(),              // Timestamp
  updatedAt: v.number(),              // Last modification timestamp
  lastEditedBy: v.optional(v.string()), // Clerk User ID of last editor
})
  .index("by_room", ["roomId"])
  .index("by_workspace", ["workspaceId"])
```

### Liveblocks Room ID Pattern

Documents use a specific room ID pattern for Liveblocks:

```typescript
const liveblocksRoomId = `doc:${documentId}`;
// Example: "doc:jd7eknf9wxzm8t3hqvnp2bcr5h6ygmcs"
```

### Liveblocks Types (`liveblocks.config.ts`)

```typescript
declare global {
  interface Liveblocks {
    // Cursor presence for each user
    Presence: {
      cursor: { x: number; y: number } | null;
    };

    // Storage is empty - managed by @liveblocks/react-tiptap (Yjs)
    Storage: {};

    // User info attached to session
    UserMeta: {
      id: string;
      info: {
        name: string;
        email: string;
        avatar: string;
        color: string;  // Cursor color (unique per user)
      };
    };
  }
}
```

---

## Real-Time Collaboration (Liveblocks + Tiptap)

### How Synchronization Works

The document system uses **Yjs**, a CRDT (Conflict-free Replicated Data Type) library, integrated through `@liveblocks/react-tiptap`:

```
User A types "Hello"        User B types "World"
        │                           │
        ▼                           ▼
   Yjs Document               Yjs Document
   (local state)              (local state)
        │                           │
        └───────── WebSocket ───────┘
                     │
                     ▼
            Liveblocks Server
            (merges operations)
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   User A sees              User B sees
   "Hello World"            "Hello World"
```

### Key Integration: `useLiveblocksExtension`

The magic happens in `collaborative-editor.tsx`:

```typescript
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";

export function CollaborativeEditor({ documentId }: CollaborativeEditorProps) {
  // Liveblocks extension handles:
  // - Yjs document synchronization
  // - Cursor awareness
  // - Undo/redo history (collaborative)
  const liveblocks = useLiveblocksExtension();

  const editor = useEditor({
    extensions: [
      liveblocks,  // MUST be first extension
      StarterKit.configure({ /* ... */ }),
      // ... other extensions
    ],
  });
}
```

### Connection Status Monitoring

```typescript
import { useStatus, useSyncStatus, useErrorListener } from "@liveblocks/react/suspense";

// WebSocket connection status
const status = useStatus();  // "connecting" | "connected" | "disconnected"

// Storage sync status (for "saving..." indicator)
const syncStatus = useSyncStatus({ smooth: true });  // "synchronizing" | "synchronized"

// Error handling
useErrorListener((err) => {
  console.error("Liveblocks error:", err);
});
```

### RoomProvider Setup

Each document page wraps content in a `RoomProvider`:

```typescript
// app/workspace/[workspaceId]/room/[roomId]/document/[documentId]/page.tsx

<RoomProvider
  id={`doc:${documentId}`}
  initialPresence={{
    cursor: null,  // User's cursor starts as null
  }}
>
  <ClientSideSuspense fallback={<Loading />}>
    <CollaborativeEditor documentId={documentId} />
  </ClientSideSuspense>
</RoomProvider>
```

---

## Backend (Convex)

**File:** `convex/documents.ts`

### `createDocument`

Creates a new document record in Convex. Content is stored in Liveblocks.

```typescript
export const createDocument = mutation({
  args: {
    roomId: v.id("rooms"),
    workspaceId: v.id("workspaces"),
    name: v.string(),
    createdBy: v.string(),  // Clerk User ID
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const documentId = await ctx.db.insert("documents", {
      roomId: args.roomId,
      workspaceId: args.workspaceId,
      name: args.name,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return documentId;
  },
});
```

### `getDocumentsByRoom`

Fetches all documents in a room, enriched with creator/editor names.

```typescript
export const getDocumentsByRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Sort by updatedAt (most recent first)
    documents.sort((a, b) => b.updatedAt - a.updatedAt);

    // Enrich with user info
    const enrichedDocuments = await Promise.all(
      documents.map(async (doc) => {
        const creator = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", doc.createdBy))
          .first();

        let lastEditor = null;
        if (doc.lastEditedBy && doc.lastEditedBy !== doc.createdBy) {
          lastEditor = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", doc.lastEditedBy))
            .first();
        }

        return {
          ...doc,
          creatorName: creator?.name || "Unknown",
          lastEditorName: lastEditor?.name || null,
        };
      })
    );

    return enrichedDocuments;
  },
});
```

### `getDocumentById`

Fetches a single document with creator/editor info.

```typescript
export const getDocumentById = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) return null;

    // Enrich with user info...
    return {
      ...document,
      creatorName: creator?.name || "Unknown",
      lastEditorName: lastEditor?.name || null,
    };
  },
});
```

### `updateDocumentName`

Updates the document's display name.

```typescript
export const updateDocumentName = mutation({
  args: {
    documentId: v.id("documents"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      name: args.name,
      updatedAt: Date.now(),
    });
  },
});
```

### `updateLastEdited`

Called periodically (every 30 seconds) while a user is editing:

```typescript
export const updateLastEdited = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      lastEditedBy: args.userId,
      updatedAt: Date.now(),
    });
  },
});
```

**Frontend usage (in `document-header.tsx`):**

```typescript
useEffect(() => {
  if (!user) return;

  const interval = setInterval(() => {
    updateLastEdited({
      documentId,
      userId: user.id,
    });
  }, 30000);  // Every 30 seconds

  return () => clearInterval(interval);
}, [documentId, user, updateLastEdited]);
```

### `deleteDocument`

Removes document from Convex. Liveblocks room is deleted separately.

```typescript
export const deleteDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.documentId);
    return { success: true, deletedDocumentId: args.documentId };
  },
});
```

### `deleteAllDocumentsForRoom`

Used when deleting an entire room:

```typescript
export const deleteAllDocumentsForRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    for (const doc of documents) {
      await ctx.db.delete(doc._id);
    }

    return { success: true, deletedDocumentIds: documents.map(d => d._id) };
  },
});
```

---

## Frontend Components

### Component Hierarchy

```
DocumentPage (page.tsx)
├── RoomProvider (Liveblocks context)
│   └── ClientSideSuspense
│       └── CollaborativeEditor
│           ├── DocumentHeader
│           │   ├── Logo + Document Name (editable)
│           │   ├── Menubar (File, Edit, View, Format, Tools)
│           │   ├── ActiveUsersAvatars
│           │   └── Connection Status Indicator
│           ├── Toolbar (formatting buttons)
│           ├── Ruler (margin controls)
│           └── EditorContent (Tiptap/ProseMirror)
│               └── Page Backgrounds + Page Numbers

DocumentList (room overview)
├── Create Document Button
├── Search + Sort + View Toggle
└── DocumentCard[] (grid/list)
    └── CreateDocumentModal (on create)
```

### `DocumentPage` (`app/workspace/[workspaceId]/room/[roomId]/document/[documentId]/page.tsx`)

Entry point that sets up Liveblocks context:

```typescript
export default function DocumentPage() {
  const params = useParams();
  const documentId = params.documentId as Id<"documents">;

  const document = useQuery(api.documents.getDocumentById, { documentId });

  // Create unique Liveblocks room ID
  const liveblocksRoomId = `doc:${documentId}`;

  return (
    <RoomProvider
      id={liveblocksRoomId}
      initialPresence={{ cursor: null }}
    >
      <ClientSideSuspense fallback={<Loading />}>
        <CollaborativeEditor documentId={documentId} />
      </ClientSideSuspense>
    </RoomProvider>
  );
}
```

### `CollaborativeEditor` (`components/document/collaborative-editor.tsx`)

Main editor component with Tiptap + Liveblocks integration:

```typescript
export function CollaborativeEditor({ documentId }: CollaborativeEditorProps) {
  // State for margins, page count, zoom, etc.
  const [leftMargin, setLeftMargin] = useState(56);
  const [rightMargin, setRightMargin] = useState(56);
  const [pageCount, setPageCount] = useState(1);
  const [zoom, setZoom] = useState(1);

  // Liveblocks connection status
  const status = useStatus();
  const syncStatus = useSyncStatus({ smooth: true });

  // Collaborative extension
  const liveblocks = useLiveblocksExtension();

  // Initialize Tiptap editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      liveblocks,  // FIRST - handles collaboration
      StarterKit.configure({}),
      Placeholder.configure({ placeholder: "Start typing..." }),
      TextStyle.configure({}),
      FontSize,
      FontFamily.configure({ types: ['textStyle'] }),
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: true, autolink: true }),
      Image.configure({ inline: false, allowBase64: true }),
    ],
    editorProps: {
      attributes: {
        class: "focus:outline-none print:border-0",
        style: `padding-left: ${leftMargin}px; padding-right: ${rightMargin}px;`,
      },
    },
    onUpdate: () => calculatePageCount(),
  });

  return (
    <div className="min-h-screen bg-[#F9FBFD]">
      {/* Header with document name, menus, active users */}
      <DocumentHeader documentId={documentId} editor={editor} ... />

      {/* Formatting toolbar */}
      <Toolbar editor={editor} />

      {/* Ruler for margins */}
      {showRuler && <Ruler ... />}

      {/* A4 Page Layout */}
      <div className="flex flex-col items-center py-6">
        {/* Page backgrounds */}
        {Array.from({ length: pageCount }).map((_, i) => (
          <div key={i} className="bg-white shadow-lg" style={{
            width: 794,   // A4 width in px
            height: 1123, // A4 height in px
          }} />
        ))}

        {/* Editor overlay */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
```

### `DocumentHeader` (`components/document/document-header.tsx`)

Header with document name, menus, and collaboration status:

```typescript
export function DocumentHeader({ documentId, editor, ... }: DocumentHeaderProps) {
  const document = useQuery(api.documents.getDocumentById, { documentId });
  const updateDocumentName = useMutation(api.documents.updateDocumentName);
  const updateLastEdited = useMutation(api.documents.updateLastEdited);
  const { user } = useUser();
  const status = useStatus();  // WebSocket status

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");

  // Periodic "last edited" updates
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      updateLastEdited({ documentId, userId: user.id });
    }, 30000);
    return () => clearInterval(interval);
  }, [documentId, user]);

  return (
    <div className="flex items-center justify-between px-3 py-2">
      {/* Logo + Editable Name */}
      <div className="flex items-center gap-2">
        <FileText className="w-8 h-8 text-blue-600" />
        {isEditing ? (
          <input value={name} onChange={...} onKeyPress={...} />
        ) : (
          <span onClick={() => setIsEditing(true)}>{document?.name}</span>
        )}
      </div>

      {/* Menubar: File, Edit, View, Format, Tools */}
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={onSaveJson}>Save as JSON</MenubarItem>
            <MenubarItem onClick={onSaveHtml}>Save as HTML</MenubarItem>
            <MenubarItem onClick={onSavePdf}>Print/PDF</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        {/* ... Edit, View, Format, Tools menus */}
      </Menubar>

      {/* Active Users + Connection Status */}
      <div className="flex items-center gap-4">
        <ActiveUsersAvatars />
        {status === "connected" ? (
          <Cloud className="text-green-500" />
        ) : (
          <CloudOff className="text-red-500" />
        )}
      </div>
    </div>
  );
}
```

### `Toolbar` (`components/document/toolbar.tsx`)

Formatting toolbar with rich text controls:

```typescript
export function Toolbar({ editor }: ToolbarProps) {
  return (
    <div className="bg-[#F1F4F9] px-2.5 py-0.5 rounded-[24px] flex items-center gap-0.5">
      {/* Undo/Redo */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 />
      </ToolbarButton>

      {/* Heading Level Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger>{getCurrentHeading()}</DropdownMenuTrigger>
        <DropdownMenuContent>
          {HEADING_LEVELS.map((h) => (
            <DropdownMenuItem onClick={() =>
              h.value === 0
                ? editor.chain().focus().setParagraph().run()
                : editor.chain().focus().toggleHeading({ level: h.value }).run()
            }>
              {h.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Font Family, Font Size, Bold, Italic, Underline, etc. */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
      >
        <Bold />
      </ToolbarButton>
      {/* ... more formatting buttons */}
    </div>
  );
}
```

### `ActiveUsersAvatars` (`components/liveblocks/active-users.tsx`)

Shows who's currently viewing/editing the document:

```typescript
export function ActiveUsersAvatars({ variant = "light" }) {
  const others = useOthers();   // Other users in the room
  const self = useSelf();       // Current user

  const allUsers = [
    ...(self ? [{ id: self.id, name: self.info?.name, avatar: self.info?.avatar, isSelf: true }] : []),
    ...others.map((other) => ({
      id: other.id,
      name: other.info?.name || "Anonymous",
      avatar: other.info?.avatar,
      isSelf: false,
    })),
  ];

  return (
    <div className="flex items-center">
      {allUsers.slice(0, MAX_AVATARS).map((user) => (
        <Avatar key={user.id} name={user.name} src={user.avatar} isSelf={user.isSelf} />
      ))}
      {allUsers.length > MAX_AVATARS && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          +{allUsers.length - MAX_AVATARS}
        </div>
      )}
    </div>
  );
}
```

### `DocumentList` (`components/document/document-list.tsx`)

Room overview showing all documents:

```typescript
export function DocumentList({ roomId, workspaceId, convexWorkspaceId }) {
  const documents = useQuery(api.documents.getDocumentsByRoom, { roomId });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredDocs = documents
    ?.filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="h-full flex flex-col">
      {/* Create New Document Section */}
      <button onClick={() => setShowCreateModal(true)}>
        <Plus /> Blank Document
      </button>

      {/* Search + Sort + View Toggle */}
      <input placeholder="Search..." value={searchQuery} onChange={...} />

      {/* Document Cards */}
      <div className={viewMode === "grid" ? "grid grid-cols-4" : "flex flex-col"}>
        {filteredDocs?.map((doc) => (
          <DocumentCard
            key={doc._id}
            documentId={doc._id}
            name={doc.name}
            creatorName={doc.creatorName}
            lastEditorName={doc.lastEditorName}
            updatedAt={doc.updatedAt}
          />
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && <CreateDocumentModal ... />}
    </div>
  );
}
```

### `CreateDocumentModal` (`components/document/create-document-modal.tsx`)

Modal for creating new documents:

```typescript
export function CreateDocumentModal({ roomId, workspaceId, clerkOrgId, onClose }) {
  const [name, setName] = useState("");
  const createDocument = useMutation(api.documents.createDocument);
  const { user } = useUser();
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim() || !user) return;

    const documentId = await createDocument({
      roomId,
      workspaceId,
      name: name.trim(),
      createdBy: user.id,
    });

    // Navigate to the new document
    router.push(`/workspace/${clerkOrgId}/room/${roomId}/document/${documentId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Document name..."
        onKeyPress={(e) => e.key === "Enter" && handleCreate()}
      />
      <button onClick={handleCreate}>Create Document</button>
    </div>
  );
}
```

### `DocumentCard` (`components/document/document-card.tsx`)

Card component for document list items:

```typescript
export function DocumentCard({ documentId, name, creatorName, updatedAt, ... }) {
  const router = useRouter();
  const deleteDocument = useMutation(api.documents.deleteDocument);

  const handleClick = () => {
    router.push(`/workspace/${workspaceId}/room/${roomId}/document/${documentId}`);
  };

  const handleDelete = async () => {
    // 1. Delete from Convex
    await deleteDocument({ documentId: documentId as Id<"documents"> });

    // 2. Delete Liveblocks room
    await fetch("/api/liveblocks-delete-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomIds: [`doc:${documentId}`] }),
    });
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <FileText className="text-blue-600" />
      <h3>{name}</h3>
      <span>{formatDate(updatedAt)}</span>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
```

---

## Document Lifecycle

### 1. Creating a Document

```
User clicks "Create Document" in DocumentList
         │
         ▼
CreateDocumentModal opens
         │
         ▼
User enters name, clicks "Create"
         │
         ▼
createDocument mutation (Convex)
┌─────────────────────────────────┐
│  Insert into documents table:   │
│  - roomId, workspaceId          │
│  - name, createdBy              │
│  - createdAt, updatedAt         │
└─────────────────────────────────┘
         │
         ▼
Returns documentId
         │
         ▼
router.push(`/workspace/.../document/${documentId}`)
         │
         ▼
DocumentPage loads with RoomProvider
         │
         ▼
Liveblocks room `doc:${documentId}` created automatically
(empty Yjs document initialized)
         │
         ▼
CollaborativeEditor renders with blank document
```

### 2. Loading a Document

```
User navigates to /workspace/.../document/[documentId]
         │
         ▼
DocumentPage component mounts
         │
         ▼
useQuery(api.documents.getDocumentById) fetches metadata
         │
         ▼
RoomProvider initializes Liveblocks room
┌────────────────────────────────────────┐
│  1. POST /api/liveblocks-auth          │
│  2. Returns token with user info       │
│  3. WebSocket connection established   │
│  4. Yjs document synced from server    │
└────────────────────────────────────────┘
         │
         ▼
ClientSideSuspense shows loading state
         │
         ▼
CollaborativeEditor renders with content
         │
         ▼
useLiveblocksExtension provides Yjs doc to Tiptap
         │
         ▼
Editor displays document content + cursors
```

### 3. Editing in Real-Time

```
User A types "Hello"              User B types "World"
        │                                 │
        ▼                                 ▼
Tiptap captures input             Tiptap captures input
        │                                 │
        ▼                                 ▼
Yjs applies operation             Yjs applies operation
(CRDT update)                     (CRDT update)
        │                                 │
        └──────── WebSocket ──────────────┘
                     │
                     ▼
           Liveblocks Server
        (merges CRDT operations)
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   User A's editor            User B's editor
   shows merged result        shows merged result
   "Hello World"              "Hello World"
```

### 4. Cursor Synchronization

```
User A moves cursor to position X
         │
         ▼
Presence update: { cursor: { x, y } }
         │
         ▼
Liveblocks broadcasts presence
         │
         ▼
User B receives presence via useOthers()
         │
         ▼
Cursor rendered at User A's position
with User A's name and color
```

### 5. Deleting a Document

```
User clicks "Delete" on DocumentCard
         │
         ▼
Confirmation dialog shown
         │
         ▼
deleteDocument mutation (Convex)
┌─────────────────────────────────┐
│  Delete from documents table    │
└─────────────────────────────────┘
         │
         ▼
POST /api/liveblocks-delete-room
┌─────────────────────────────────┐
│  liveblocks.deleteRoom(roomId)  │
│  (deletes Yjs document storage) │
└─────────────────────────────────┘
         │
         ▼
DocumentList re-renders without document
```

---

## Authentication & Authorization

### Liveblocks Auth Endpoint (`app/api/liveblocks-auth/route.ts`)

Authenticates users for Liveblocks rooms:

```typescript
export async function POST(request: Request) {
  // 1. Get current Clerk user
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Get requested room
  const { room } = await request.json();

  // 3. Create Liveblocks session with user info
  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: user.firstName ? `${user.firstName} ${user.lastName}`.trim() : user.emailAddresses[0]?.emailAddress,
      email: user.emailAddresses[0]?.emailAddress || "",
      avatar: user.imageUrl || "",
      color: getCursorColorForUserId(user.id),  // Unique cursor color
    },
  });

  // 4. Grant access to the room
  session.allow(room, session.FULL_ACCESS);

  // 5. Return authorization token
  const { status, body } = await session.authorize();
  return new NextResponse(body, { status });
}
```

### Cursor Color Assignment

Each user gets a unique cursor color based on their ID:

```typescript
const CURSOR_COLOR_HUES = [0, 25, 45, 140, 185, 215, 265, 310];

function getCursorColorForUserId(userId: string): string {
  const index = hashStringToIndex(userId, CURSOR_COLOR_HUES.length);
  const hue = CURSOR_COLOR_HUES[index];
  return `hsl(${hue} 85% 45%)`;
}
```

### Liveblocks Room Deletion (`app/api/liveblocks-delete-room/route.ts`)

Deletes rooms when documents are removed:

```typescript
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomIds } = await request.json();

  const results = await Promise.allSettled(
    roomIds.map(async (roomId: string) => {
      await liveblocks.deleteRoom(roomId);
      return { roomId, success: true };
    })
  );

  return NextResponse.json({ success: true, results });
}
```

---

## Feature Details

### A4 Page Layout

Documents render with A4 paper dimensions:

```typescript
// A4 dimensions in pixels at 96 DPI
const PAGE_WIDTH = 794;   // 210mm
const PAGE_HEIGHT = 1123; // 297mm
const PAGE_PADDING_TOP = 96;    // ~1 inch
const PAGE_PADDING_BOTTOM = 96;
const CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM;
```

Page count is calculated dynamically based on content height:

```typescript
const calculatePageCount = useCallback(() => {
  if (editorContainerRef.current) {
    const contentHeight = editorContainerRef.current.scrollHeight;
    const pages = Math.max(1, Math.ceil(contentHeight / CONTENT_HEIGHT));
    setPageCount(pages);
  }
}, []);
```

### Ruler & Margins

Interactive ruler component for adjusting margins:

```typescript
<Ruler
  leftMargin={leftMargin}
  rightMargin={rightMargin}
  onLeftMarginChange={setLeftMargin}
  onRightMarginChange={setRightMargin}
  pageWidth={PAGE_WIDTH}
/>
```

Margins are applied to editor content:

```typescript
editor.setOptions({
  editorProps: {
    attributes: {
      style: `padding-left: ${leftMargin}px; padding-right: ${rightMargin}px;`,
    },
  },
});
```

### Export Options

Documents can be exported in multiple formats:

```typescript
// JSON (Tiptap document structure)
const onSaveJson = () => {
  const json = editor.getJSON();
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
  download(blob, "document.json");
};

// HTML
const onSaveHtml = () => {
  const html = editor.getHTML();
  const blob = new Blob([html], { type: "text/html" });
  download(blob, "document.html");
};

// Plain Text
const onSaveText = () => {
  const text = editor.getText();
  const blob = new Blob([text], { type: "text/plain" });
  download(blob, "document.txt");
};

// PDF (via print dialog)
const onSavePdf = () => window.print();
```

### Zoom Control

Document view can be zoomed:

```typescript
<div
  className="editor-zoom-wrapper"
  style={{
    width: `${PAGE_WIDTH}px`,
    ...(zoom !== 1 ? ({ zoom } as any) : {}),
  }}
>
  {/* Page content */}
</div>
```

### Print Styling

Print-specific CSS for proper output:

```css
@page {
  size: A4;
  margin: 25.4mm;
}

@media print {
  body { background: white !important; }
  .editor-zoom-wrapper { zoom: 1 !important; }
  .print\\:hidden { display: none !important; }
}
```

---

## File References

| File | Purpose |
|------|---------|
| [convex/schema.ts](../convex/schema.ts) | Database schema (documents table) |
| [convex/documents.ts](../convex/documents.ts) | Document CRUD mutations/queries |
| [components/document/collaborative-editor.tsx](../components/document/collaborative-editor.tsx) | Main editor with Liveblocks+Tiptap |
| [components/document/document-header.tsx](../components/document/document-header.tsx) | Header with menus and status |
| [components/document/toolbar.tsx](../components/document/toolbar.tsx) | Formatting toolbar |
| [components/document/ruler.tsx](../components/document/ruler.tsx) | Margin ruler |
| [components/document/document-list.tsx](../components/document/document-list.tsx) | Document list view |
| [components/document/document-card.tsx](../components/document/document-card.tsx) | Individual document card |
| [components/document/create-document-modal.tsx](../components/document/create-document-modal.tsx) | Create document modal |
| [components/liveblocks/active-users.tsx](../components/liveblocks/active-users.tsx) | Active users avatars |
| [app/api/liveblocks-auth/route.ts](../app/api/liveblocks-auth/route.ts) | Liveblocks authentication |
| [app/api/liveblocks-delete-room/route.ts](../app/api/liveblocks-delete-room/route.ts) | Room deletion API |
| [app/workspace/[workspaceId]/room/[roomId]/document/[documentId]/page.tsx](../app/workspace/[workspaceId]/room/[roomId]/document/[documentId]/page.tsx) | Document page |
| [liveblocks.config.ts](../liveblocks.config.ts) | Liveblocks type definitions |
| [providers/liveblocks-provider.tsx](../providers/liveblocks-provider.tsx) | Liveblocks provider wrapper |

---

## Summary

The VBase document system provides a Google Docs-like collaborative editing experience:

1. **Dual Storage Architecture**: Document content in Liveblocks (Yjs CRDT), metadata in Convex
2. **Real-time Collaboration**: Automatic sync via `@liveblocks/react-tiptap`
3. **Rich Text Editing**: Tiptap (ProseMirror) with extensive formatting options
4. **Live Presence**: See other users' cursors and who's editing
5. **A4 Page Layout**: Professional document layout with ruler and margins
6. **Auto-save**: Changes sync automatically to Liveblocks storage
7. **Export Options**: JSON, HTML, TXT, PDF

### Key Technologies

- **Tiptap**: ProseMirror-based rich text editor
- **Yjs**: CRDT library for conflict-free editing
- **Liveblocks**: Real-time infrastructure (WebSocket, storage, presence)
- **Convex**: Serverless backend for metadata

### Room ID Convention

Documents use the pattern `doc:${documentId}` for Liveblocks room identification, ensuring unique rooms per document and enabling proper cleanup on deletion.
