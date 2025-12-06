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
});
