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
  }).index("by_clerk_org", ["clerkOrgId"]),

  // Rooms within workspaces
  rooms: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    type: v.union(
      v.literal("document"),
      v.literal("code"),
      v.literal("whiteboard"),
      v.literal("conference")
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
    timestamp: v.number(),
    // Reactions: map of reaction type to array of user IDs who reacted
    reactions: v.optional(
      v.object({
        like: v.optional(v.array(v.string())), // Array of Clerk User IDs
        dislike: v.optional(v.array(v.string())),
        haha: v.optional(v.array(v.string())),
      })
    ),
    // Optional: for future features
    attachments: v.optional(
      v.array(
        v.object({
          url: v.string(),
          type: v.string(),
          name: v.string(),
        })
      )
    ),
    // For threaded replies (future)
    parentMessageId: v.optional(v.id("messages")),
  })
    .index("by_channel", ["channelId", "timestamp"])
    .index("by_workspace", ["workspaceId"]),

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
});
