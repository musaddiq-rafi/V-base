# VBase Chat System Documentation

A comprehensive guide to the real-time chat system in VBase, covering architecture, data flow, and implementation details.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Backend (Convex)](#backend-convex)
   - [Channels](#channels)
   - [Messages](#messages)
   - [Read Tracking](#read-tracking)
5. [Frontend (React Components)](#frontend-react-components)
6. [Message Lifecycle](#message-lifecycle)
7. [Feature Details](#feature-details)
8. [Performance Optimizations](#performance-optimizations)
9. [File References](#file-references)

---

## Overview

The VBase chat system provides real-time messaging capabilities within workspaces. It supports:

- **Workspace-wide chat** (`#general` channel)
- **Direct Messages (DMs)** between two users
- **Message reactions** (like, dislike, haha)
- **Unread count tracking** with cursor-based read receipts
- **Real-time updates** via Convex subscriptions

### Chat System Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              ChatSystem Component                       ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     ││
│  │  │ Chat Bubble │  │ Chat Window │  │ NewDM Modal │     ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘     ││
│  └─────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────┘
                            │ Convex React Hooks
                            │ (useQuery, useMutation)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Convex)                         │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  channels.ts    │  │   messages.ts   │                  │
│  │  - createGeneral│  │  - sendMessage  │                  │
│  │  - createOrGetDM│  │  - getMessages  │                  │
│  │  - getChannels  │  │  - toggleReact  │                  │
│  └─────────────────┘  │  - markAsRead   │                  │
│                       │  - getUnread    │                  │
│                       └─────────────────┘                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Database Tables                      ││
│  │   channels  │  messages  │  lastRead  │  users         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React + Next.js | UI components |
| State Management | Convex React Hooks | Real-time subscriptions |
| Backend | Convex | Serverless functions + Database |
| Authentication | Clerk | User identity |
| Animation | Framer Motion | UI animations |

### Data Flow Pattern

1. **User initiates action** (send message, react, etc.)
2. **useMutation hook** calls Convex mutation
3. **Convex mutation** validates auth, writes to DB
4. **Convex subscriptions** automatically propagate changes
5. **useQuery hooks** receive updated data
6. **React re-renders** UI with new state

---

## Data Model

### Database Schema (from `convex/schema.ts`)

#### `channels` Table

Stores chat channels (general, direct, group).

```typescript
channels: defineTable({
  workspaceId: v.id("workspaces"),
  name: v.string(),                    // "general" or "dm-userId1-userId2"
  type: v.union(
    v.literal("general"),              // Workspace-wide channel
    v.literal("direct"),               // 1-on-1 DM
    v.literal("group")                 // Future: custom group channels
  ),
  participantIds: v.optional(v.array(v.string())), // For DM: [userId1, userId2]
  createdAt: v.number(),
  createdBy: v.string(),               // Clerk User ID
})
  .index("by_workspace", ["workspaceId"])
  .index("by_participants", ["participantIds"])
```

#### `messages` Table

Stores all chat messages.

```typescript
messages: defineTable({
  channelId: v.id("channels"),
  workspaceId: v.id("workspaces"),     // Denormalized for faster queries
  authorId: v.string(),                // Clerk User ID
  authorName: v.string(),              // Cached for backwards compatibility
  content: v.string(),
  timestamp: v.number(),
  reactions: v.optional(v.object({
    like: v.optional(v.array(v.string())),
    dislike: v.optional(v.array(v.string())),
    haha: v.optional(v.array(v.string())),
  })),
  attachments: v.optional(v.array(v.object({...}))),
  parentMessageId: v.optional(v.id("messages")), // For threaded replies (future)
})
  .index("by_channel", ["channelId", "timestamp"])
  .index("by_workspace", ["workspaceId"])
```

#### `lastRead` Table

Tracks when each user last read each channel (cursor-based unread tracking).

```typescript
lastRead: defineTable({
  userId: v.string(),                  // Clerk User ID
  channelId: v.id("channels"),
  lastReadAt: v.number(),              // Timestamp of last read
})
  .index("by_user_channel", ["userId", "channelId"])
  .index("by_user", ["userId"])
  .index("by_channel", ["channelId"])
```

---

## Backend (Convex)

### Channels

**File:** `convex/channels.ts`

#### `createGeneralChannel`

Creates the `#general` channel for a workspace. Called automatically when a workspace is created.

```typescript
export const createGeneralChannel = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // 2. Check if general channel already exists
    const existingGeneral = await ctx.db
      .query("channels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("type"), "general"))
      .first();

    if (existingGeneral) return existingGeneral._id;

    // 3. Create general channel
    return await ctx.db.insert("channels", {
      workspaceId: args.workspaceId,
      name: "general",
      type: "general",
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });
  },
});
```

#### `createOrGetDirectChannel`

Creates or retrieves an existing DM channel between two users.

```typescript
export const createOrGetDirectChannel = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    otherUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUserId = identity.subject;

    // Cannot DM yourself
    if (currentUserId === args.otherUserId) {
      throw new Error("Cannot create DM with yourself");
    }

    // Sort user IDs for consistent channel naming
    const participantIds = [currentUserId, args.otherUserId].sort();

    // Check if DM already exists
    const existingDM = await ctx.db
      .query("channels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("type"), "direct"))
      .collect();

    const matchingDM = existingDM.find((channel) => {
      const channelParticipants = channel.participantIds?.sort() || [];
      return (
        channelParticipants.length === 2 &&
        channelParticipants[0] === participantIds[0] &&
        channelParticipants[1] === participantIds[1]
      );
    });

    if (matchingDM) return matchingDM._id;

    // Create new DM channel
    return await ctx.db.insert("channels", {
      workspaceId: args.workspaceId,
      name: `dm-${participantIds[0]}-${participantIds[1]}`,
      type: "direct",
      participantIds,
      createdAt: Date.now(),
      createdBy: currentUserId,
    });
  },
});
```

#### `getWorkspaceChannels`

Returns all non-DM channels in a workspace.

```typescript
export const getWorkspaceChannels = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.neq(q.field("type"), "direct"))
      .order("asc")
      .collect();
  },
});
```

#### `getDirectChannels`

Returns all DM channels for the current user, enriched with other user's info.

```typescript
export const getDirectChannels = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const currentUserId = identity.subject;

    // Get all DMs in workspace
    const allDMs = await ctx.db
      .query("channels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("type"), "direct"))
      .collect();

    // Filter to user's DMs only
    const userDMs = allDMs.filter((channel) =>
      channel.participantIds?.includes(currentUserId)
    );

    // Enrich with other user's name
    return await Promise.all(
      userDMs.map(async (dm) => {
        const otherUserId = dm.participantIds?.find(id => id !== currentUserId);
        const otherUser = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", otherUserId))
          .first();
        
        return {
          ...dm,
          otherUserId,
          otherUserName: otherUser?.name || "Unknown User",
        };
      })
    );
  },
});
```

---

### Messages

**File:** `convex/messages.ts`

#### `sendMessage`

Creates a new message in a channel.

```typescript
export const sendMessage = mutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUserId = identity.subject;

    // Get channel to verify access
    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");

    // Check DM access
    if (channel.type === "direct" && !channel.participantIds?.includes(currentUserId)) {
      throw new Error("You don't have access to this channel");
    }

    // Get author name
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", currentUserId))
      .first();

    // Create message
    return await ctx.db.insert("messages", {
      channelId: args.channelId,
      workspaceId: channel.workspaceId,
      authorId: currentUserId,
      authorName: user?.name || "Unknown User",
      content: args.content,
      timestamp: Date.now(),
    });
  },
});
```

#### `getMessagesWithAuthors`

Fetches messages with author names resolved at query time (ensures names are always current).

```typescript
export const getMessagesWithAuthors = query({
  args: {
    channelId: v.id("channels"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify access...
    
    // Get messages (most recent first, then reverse)
    const limit = args.limit || 100;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(limit);

    // Batch fetch unique authors
    const authorIds = [...new Set(messages.map((m) => m.authorId))];
    const authors = await Promise.all(
      authorIds.map(async (authorId) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", authorId))
          .first();
        return { authorId, name: user?.name || "Unknown User" };
      })
    );

    const authorMap = new Map(authors.map((a) => [a.authorId, a.name]));

    // Return in chronological order
    return messages.reverse().map((msg) => ({
      ...msg,
      authorName: authorMap.get(msg.authorId) || msg.authorName,
    }));
  },
});
```

#### `toggleReaction`

Adds or removes a reaction from a message.

```typescript
export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    reactionType: v.union(v.literal("like"), v.literal("dislike"), v.literal("haha")),
  },
  handler: async (ctx, args) => {
    const currentUserId = identity.subject;
    const message = await ctx.db.get(args.messageId);

    // Verify channel access...

    const reactions = message.reactions || {};
    const reactionArray = reactions[args.reactionType] || [];

    // Toggle: remove if present, add if not
    const userIndex = reactionArray.indexOf(currentUserId);
    const updatedReactionArray = userIndex > -1
      ? reactionArray.filter((id) => id !== currentUserId)
      : [...reactionArray, currentUserId];

    await ctx.db.patch(args.messageId, {
      reactions: {
        ...reactions,
        [args.reactionType]: updatedReactionArray,
      },
    });

    return { added: userIndex === -1 };
  },
});
```

#### `deleteMessage` & `editMessage`

Only the message author can delete or edit their own messages.

```typescript
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (message.authorId !== currentUserId) {
      throw new Error("You can only delete your own messages");
    }
    await ctx.db.delete(args.messageId);
  },
});

export const editMessage = mutation({
  args: { messageId: v.id("messages"), newContent: v.string() },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (message.authorId !== currentUserId) {
      throw new Error("You can only edit your own messages");
    }
    await ctx.db.patch(args.messageId, { content: args.newContent });
  },
});
```

---

### Read Tracking

**File:** `convex/messages.ts`

#### `markChannelAsRead`

Updates the user's last read timestamp for a channel. Uses cursor-based tracking for efficiency.

```typescript
export const markChannelAsRead = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const currentUserId = identity.subject;
    const now = Date.now();

    // Check if lastRead record exists
    const existingLastRead = await ctx.db
      .query("lastRead")
      .withIndex("by_user_channel", (q) =>
        q.eq("userId", currentUserId).eq("channelId", args.channelId)
      )
      .first();

    if (existingLastRead) {
      // Update existing record (single DB write)
      await ctx.db.patch(existingLastRead._id, { lastReadAt: now });
    } else {
      // Create new record (single DB write)
      await ctx.db.insert("lastRead", {
        userId: currentUserId,
        channelId: args.channelId,
        lastReadAt: now,
      });
    }
  },
});
```

#### `getUnreadCounts`

Aggregates unread counts and message previews for all channels. **This is a key performance optimization** that replaces N individual subscriptions with a single query.

```typescript
export const getUnreadCounts = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const currentUserId = identity.subject;

    // 1. Get all accessible channels
    const allChannels = await ctx.db
      .query("channels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const accessibleChannels = allChannels.filter((channel) => {
      if (channel.type === "direct") {
        return channel.participantIds?.includes(currentUserId);
      }
      return true;
    });

    // 2. Get all lastRead records for user
    const lastReadRecords = await ctx.db
      .query("lastRead")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .collect();

    const lastReadMap = new Map(
      lastReadRecords.map((r) => [r.channelId, r.lastReadAt])
    );

    // 3. Run all channel queries in PARALLEL
    const countPromises = accessibleChannels.map(async (channel) => {
      const lastReadAt = lastReadMap.get(channel._id) || 0;

      // Count unread (messages after lastRead, not by current user)
      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
        .filter((q) =>
          q.and(
            q.gt(q.field("timestamp"), lastReadAt),
            q.neq(q.field("authorId"), currentUserId)
          )
        )
        .collect();

      // Get latest message for preview
      const latestMsg = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
        .order("desc")
        .first();

      return {
        id: channel._id,
        count: unreadMessages.length,
        preview: latestMsg ? latestMsg.content.substring(0, 50) : "",
      };
    });

    const results = await Promise.all(countPromises);

    // 4. Aggregate results
    const channels: Record<string, number> = {};
    const previews: Record<string, string> = {};
    let total = 0;

    for (const res of results) {
      if (res.count > 0) {
        channels[res.id] = res.count;
        total += res.count;
      }
      if (res.preview) {
        previews[res.id] = res.preview;
      }
    }

    return { channels, total, previews };
  },
});
```

---

## Frontend (React Components)

**File:** `components/chat/chat-system.tsx`

### Component Hierarchy

```
ChatSystem (main container)
├── Chat Bubbles
│   ├── ChatBubbleComponent (base bubble)
│   └── ChatBubbleWithPreview (enriched bubble)
├── ChatWindow (open conversation)
├── NewDmModal (create DM)
└── Message Preview Popup
```

### `ChatSystem` Component

Main container that manages chat state and renders all sub-components.

```tsx
export function ChatSystem({ workspaceId }: ChatSystemProps) {
  const { user } = useUser();
  const [chatBubbles, setChatBubbles] = useState<ChatBubble[]>([]);
  const [openChatWindow, setOpenChatWindow] = useState<Id<"channels"> | null>(null);
  const [showBubbles, setShowBubbles] = useState(false);

  // Convex queries (real-time subscriptions)
  const workspaceChannels = useQuery(api.channels.getWorkspaceChannels, { workspaceId });
  const directChannels = useQuery(api.channels.getDirectChannels, { workspaceId });
  const unreadCountsData = useQuery(api.messages.getUnreadCounts, { workspaceId });

  // Convert to Maps for efficient lookup
  const unreadCounts = new Map(/* ... */);
  const previews = new Map(/* ... */);
  const totalUnreadCount = unreadCountsData?.total || 0;

  // Auto-add general channel when bubbles open
  useEffect(() => {
    if (generalChannel && showBubbles && !hasInitializedGeneral.current) {
      setChatBubbles((prev) => [{
        channelId: generalChannel._id,
        name: "General",
        type: "general",
      }, ...prev]);
    }
  }, [generalChannel, showBubbles]);

  // Auto-add DM bubbles when new messages arrive
  useEffect(() => {
    directChannels?.forEach((dm) => {
      const hasUnread = (unreadCounts.get(dm._id) || 0) > 0;
      // Add bubble if not exists and has unread messages
      if (!exists && hasUnread) {
        setChatBubbles((prev) => [...prev, {
          channelId: dm._id,
          name: dm.otherUserName,
          type: "direct",
          otherUserId: dm.otherUserId,
        }]);
      }
    });
  }, [directChannels, unreadCounts]);

  return (
    <>
      {/* Chat Window */}
      {openChatWindow && <ChatWindow chat={currentChat} onClose={closeChat} />}

      {/* Chat Bubbles */}
      {showBubbles && (
        <div className="fixed bottom-24 right-6">
          <ChatBubbleComponent type="new-dm" onClick={handleNewDmClick} />
          {chatBubbles.map((bubble) => (
            <ChatBubbleWithPreview
              bubble={bubble}
              unreadCount={unreadCounts.get(bubble.channelId)}
              preview={previews.get(bubble.channelId)}
            />
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button onClick={toggleBubbles} className="fixed bottom-6 right-6">
        <MessageCircle />
        {totalUnreadCount > 0 && <Badge>{totalUnreadCount}</Badge>}
      </button>

      {/* New DM Modal */}
      {showNewDmModal && <NewDmModal onChatCreated={addDmBubble} />}
    </>
  );
}
```

### `ChatWindow` Component

Displays the conversation for an open channel.

```tsx
function ChatWindow({ chat, onClose, workspaceId }: ChatWindowProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");

  // Convex hooks
  const messages = useQuery(api.messages.getMessagesWithAuthors, {
    channelId: chat.channelId,
  });
  const sendMessage = useMutation(api.messages.sendMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);
  const markAsRead = useMutation(api.messages.markChannelAsRead);

  // Mark channel as read when window opens
  useEffect(() => {
    markAsRead({ channelId: chat.channelId });
  }, [chat.channelId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    await sendMessage({ channelId: chat.channelId, content: message.trim() });
    setMessage("");
  };

  return (
    <div className="fixed bottom-6 right-24 w-80 h-[500px]">
      {/* Header */}
      <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600">
        <span>{chat.name}</span>
        <button onClick={onClose}><X /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages?.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={msg.authorId === user?.id}
            onReaction={handleReaction}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button onClick={handleSendMessage}><Send /></button>
      </div>
    </div>
  );
}
```

### `NewDmModal` Component

Allows users to start a new direct message conversation.

```tsx
function NewDmModal({ workspaceId, onClose, onChatCreated }: NewDmModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { memberships } = useOrganization({ memberships: { pageSize: 50 } });
  const createOrGetDM = useMutation(api.channels.createOrGetDirectChannel);

  const handleSelectUser = async (userId: string, userName: string) => {
    // Create or get existing DM channel
    const channelId = await createOrGetDM({
      workspaceId,
      otherUserId: userId,
    });

    // Add chat bubble and open window
    onChatCreated({
      channelId,
      name: userName,
      type: "direct",
      otherUserId: userId,
    });
  };

  return (
    <div className="modal">
      <h2>New Direct Message</h2>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search members..."
      />
      <div className="member-list">
        {filteredMembers.map((member) => (
          <button onClick={() => handleSelectUser(member.userId, member.name)}>
            {member.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## Message Lifecycle

### 1. Sending a Message

```
User types message → clicks Send/presses Enter
         │
         ▼
handleSendMessage() called
         │
         ▼
sendMessage mutation invoked
         │
         ▼
┌─────────────────────────────┐
│     Convex Backend          │
│  1. Authenticate user       │
│  2. Verify channel access   │
│  3. Get author name         │
│  4. Insert into messages    │
│     table with timestamp    │
└─────────────────────────────┘
         │
         ▼
Convex subscription triggers
         │
         ▼
All connected clients receive update
         │
         ▼
UI re-renders with new message
```

### 2. Receiving a Message (Real-time)

```
New message inserted in DB
         │
         ▼
Convex detects change to messages table
         │
         ▼
All active useQuery subscriptions notified
         │
         ▼
getMessagesWithAuthors query re-runs
         │
         ▼
React component receives new messages array
         │
         ▼
UI re-renders, auto-scrolls to bottom
```

### 3. Unread Count Flow

```
Message sent by User A
         │
         ▼
User B's getUnreadCounts query re-runs
         │
         ▼
Query calculates: messages.timestamp > lastRead.lastReadAt
         │
         ▼
Unread count incremented
         │
         ▼
Badge updates on chat bubble
         │
         ▼
User B opens chat window
         │
         ▼
markChannelAsRead mutation called
         │
         ▼
lastRead.lastReadAt = Date.now()
         │
         ▼
getUnreadCounts re-runs, count = 0
         │
         ▼
Badge disappears
```

### 4. Creating a DM

```
User clicks "New Message" → searches for member
         │
         ▼
User selects member → handleSelectUser()
         │
         ▼
createOrGetDirectChannel mutation
         │
         ▼
┌─────────────────────────────────────┐
│  1. Get current user ID             │
│  2. Sort [currentUser, otherUser]   │
│  3. Check if DM already exists      │
│  4. If exists: return existing ID   │
│  5. If not: create new channel      │
└─────────────────────────────────────┘
         │
         ▼
Channel ID returned to frontend
         │
         ▼
Chat bubble added, window opens
```

---

## Feature Details

### Reactions System

Messages support three reaction types:
- 👍 Like
- 👎 Dislike
- 😂 Haha

**How it works:**

1. Reactions stored as object with arrays of user IDs:
   ```typescript
   reactions: {
     like: ["user_1", "user_3"],
     haha: ["user_2"],
   }
   ```

2. Toggle behavior: clicking a reaction adds/removes the user from the array

3. UI shows count and highlights if current user has reacted

### Read Receipts (Cursor-Based)

**Why cursor-based?**
- Only stores ONE timestamp per user per channel
- O(1) write on read (update single timestamp)
- Counts unread by comparing message.timestamp > lastReadAt
- Much more efficient than tracking individual message read status

**Alternative rejected:** Per-message read tracking would require N writes per message (one per recipient), which doesn't scale.

### Bubble Management

- **General channel**: Always appears when bubbles are shown, cannot be removed
- **DM bubbles**: Auto-appear when new messages arrive
- **Closed bubbles**: Tracked in `closedBubblesRef` to prevent re-appearing unless new messages arrive
- **Bubble removal**: Removes from state but not from database (channel still exists)

---

## Performance Optimizations

### 1. Single Unread Query

**Before:** N subscriptions (one per channel) for unread counts
**After:** Single `getUnreadCounts` query returns all counts + previews

```typescript
// One query replaces many:
const unreadCountsData = useQuery(api.messages.getUnreadCounts, { workspaceId });

// Returns:
{
  channels: { "channel_1": 5, "channel_2": 2 },
  total: 7,
  previews: { "channel_1": "Hey, are you...", "channel_2": "Meeting at..." }
}
```

### 2. Parallel Database Queries

In `getUnreadCounts`, all channel queries run in parallel using `Promise.all`:

```typescript
const countPromises = accessibleChannels.map(async (channel) => {
  // These run in parallel!
  const unread = await ctx.db.query("messages")...
  const latest = await ctx.db.query("messages")...
  return { count, preview };
});

const results = await Promise.all(countPromises);
```

### 3. Author Name Batching

`getMessagesWithAuthors` batches author lookups:

```typescript
// Get unique authors (deduplication)
const authorIds = [...new Set(messages.map((m) => m.authorId))];

// Single batch lookup instead of N queries
const authors = await Promise.all(authorIds.map(...));
```

### 4. Denormalized Data

- `workspaceId` is stored on `messages` for faster workspace-level queries
- `authorName` is cached on messages for backwards compatibility
- This trades storage for read performance

---

## File References

| File | Purpose |
|------|---------|
| [convex/schema.ts](../convex/schema.ts) | Database schema definitions |
| [convex/channels.ts](../convex/channels.ts) | Channel CRUD operations |
| [convex/messages.ts](../convex/messages.ts) | Message operations + unread tracking |
| [components/chat/chat-system.tsx](../components/chat/chat-system.tsx) | Main chat UI components |

---

## Summary

The VBase chat system is a real-time messaging solution built on Convex's reactive database. Key characteristics:

1. **Real-time by default**: All data uses Convex subscriptions (useQuery)
2. **Cursor-based read tracking**: Efficient unread count calculation
3. **Permission-aware**: DMs check participant access, general channels open to all
4. **Optimized queries**: Single aggregated query for unread counts
5. **Floating bubble UI**: Non-intrusive chat interface with message previews

The system is designed for collaborative workspaces and handles both group (general) and private (direct) messaging with support for reactions and future extensibility (threaded replies, attachments).
