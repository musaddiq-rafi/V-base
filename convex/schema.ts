import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - synced with Clerk via webhook
  users: defineTable({
    clerkId: v.string(), // Clerk User ID
    name: v.string(),
    email: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  // Workspaces table - linked to Clerk Organizations
  workspaces: defineTable({
    clerkOrgId: v.string(), // Clerk Organization ID
    name: v.string(),
    ownerId: v.string(), // Clerk User ID of the owner
  })
    .index("by_clerk_org", ["clerkOrgId"])
    .index("by_owner", ["ownerId"]),

  // Rooms within workspaces
  rooms: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    type: v.union(
      v.literal("document"),
      v.literal("code"),
      v.literal("whiteboard"),
      v.literal("conference"),
      v.literal("kanban") 
    ),
    // Optional: Access control list (array of Clerk user IDs)
    // If empty, everyone in workspace can access
    allowedUserIds: v.optional(v.array(v.string())),
  }).index("by_workspace", ["workspaceId"]),

  // Chat channels - can be workspace-wide or private DM
  channels: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(), // "general" or "dm-userId1-userId2"
    type: v.union(
      v.literal("general"), // Workspace-wide channel
      v.literal("direct"), // 1-on-1 DM
      v.literal("group") // Future: custom group channels
    ),
    // For DM channels: the two participant user IDs (Clerk IDs)
    participantIds: v.optional(v.array(v.string())),
    createdAt: v.number(),
    createdBy: v.string(), // Clerk User ID
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_participants", ["participantIds"]),

  // Messages in channels
  messages: defineTable({
    channelId: v.id("channels"),
    workspaceId: v.id("workspaces"), // Denormalized for faster queries
    authorId: v.string(), // Clerk User ID
    authorName: v.string(), // Cached from users table (for backwards compat)
    content: v.string(),
  }),

  // Kanban boards (minimal)
  // (kanbans table defined later)

  // Last read timestamp per user per channel (cursor-based read tracking)
  lastRead: defineTable({
    userId: v.string(), // Clerk User ID
    channelId: v.id("channels"),
    lastReadAt: v.number(), // Timestamp of when user last read this channel
  })
    .index("by_user_channel", ["userId", "channelId"])
    .index("by_user", ["userId"])
    .index("by_channel", ["channelId"]),

  // Documents within document rooms
  documents: defineTable({
    roomId: v.id("rooms"), // Parent document room
    workspaceId: v.id("workspaces"), // Denormalized for faster queries
    name: v.string(), // Document name (e.g., "Project Proposal")
    createdBy: v.string(), // Clerk User ID
    createdAt: v.number(),
    updatedAt: v.number(),
    lastEditedBy: v.optional(v.string()), // Clerk User ID of last editor
  })
    .index("by_room", ["roomId"])
    .index("by_workspace", ["workspaceId"]),
  //Kanban boards within kanban rooms
  kanbans: defineTable({
    roomId: v.id("rooms"), // Parent kanban room
    workspaceId: v.id("workspaces"), // Denormalized for faster queries
    name: v.string(), // Kanban board name (e.g., "Sprint Tasks")
    createdBy: v.string(), // Clerk User ID
    createdAt: v.number(),
    updatedAt: v.number(),  
    lastEditedBy: v.optional(v.string()), // Clerk User ID of last editor
    // For simplicity, we'll store the entire kanban state as a JSON string
    content: v.optional(v.string()), // Serialized kanban data (JSON string)
  })
    .index("by_room", ["roomId"])
    .index("by_workspace", ["workspaceId"]),  

  // Code files and folders within code rooms
  codeFiles: defineTable({
    workspaceId: v.id("workspaces"),
    roomId: v.id("rooms"),
    name: v.string(), // File or folder name
    type: v.union(v.literal("file"), v.literal("folder")),
    parentId: v.optional(v.id("codeFiles")), // For nesting (undefined = root level)
    language: v.optional(v.string()), // Only for files (e.g., "javascript", "python")
    createdBy: v.string(), // Clerk User ID
    createdAt: v.number(),
    updatedAt: v.number(),
    lastEditedBy: v.optional(v.string()), // Clerk User ID of last editor
  })
    .index("by_room_parent", ["roomId", "parentId"]) // Efficient folder navigation
    .index("by_room", ["roomId"]), // For counting total files

  // Whiteboards within whiteboard rooms
  whiteboards: defineTable({
    roomId: v.id("rooms"), // Parent whiteboard room
    workspaceId: v.id("workspaces"), // Denormalized for faster queries
    name: v.string(), // Whiteboard name
    content: v.optional(v.string()), // Serialized Excalidraw elements (JSON string)
    createdBy: v.string(), // Clerk User ID
    createdAt: v.number(),
    updatedAt: v.number(),
    lastEditedBy: v.optional(v.string()), // Clerk User ID of last editor
  })
    .index("by_room", ["roomId"])
    .index("by_workspace", ["workspaceId"]),

  // Active meetings within conference rooms (max 3 per room)
  meetings: defineTable({
    roomId: v.id("rooms"), // Parent conference room
    name: v.string(), // Meeting name (e.g., "Code Base Updates")
    livekitRoomName: v.string(), // Unique LiveKit room identifier
    createdBy: v.string(), // Clerk User ID of creator
    createdByName: v.string(), // Name of creator (cached)
    createdAt: v.number(),
    status: v.union(v.literal("active"), v.literal("ended")),
    participantCount: v.number(), // Current number of participants
  })
    .index("by_room", ["roomId"])
    .index("by_room_status", ["roomId", "status"]),
});
