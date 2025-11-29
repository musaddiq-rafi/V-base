import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(), // Will store Clerk ID / Token Identifier
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  workspaces: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    memberIds: v.array(v.id("users")),
    // We can store room-specific config here later
    roomData: v.optional(v.any()),
  }),

  invitations: defineTable({
    senderId: v.id("users"),
    receiverEmail: v.string(),
    workspaceId: v.id("workspaces"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
  }).index("by_email", ["receiverEmail"]),

  workspaceChat: defineTable({
    body: v.string(),
    senderId: v.id("users"),
    workspaceId: v.id("workspaces"),
  }).index("by_workspace", ["workspaceId"]),

  roomChat: defineTable({
    body: v.string(),
    senderId: v.id("users"),
    workspaceId: v.id("workspaces"),
    roomId: v.union(
      v.literal("hr"),
      v.literal("document"),
      v.literal("coding"),
      v.literal("whiteboard"),
      v.literal("conference")
    ),
  }).index("by_workspace_room", ["workspaceId", "roomId"]),
});
