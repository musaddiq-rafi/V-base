import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Upsert the current user's presence (location) within a workspace.
 * Called on navigation and periodically via heartbeat.
 */
export const heartbeat = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userName: v.string(),
    userAvatar: v.optional(v.string()),
    location: v.union(
      v.literal("workspace"),
      v.literal("room"),
      v.literal("file"),
      v.literal("meeting"),
    ),
    roomId: v.optional(v.id("rooms")),
    roomName: v.optional(v.string()),
    roomType: v.optional(v.string()),
    fileId: v.optional(v.string()),
    fileName: v.optional(v.string()),
    meetingName: v.optional(v.string()),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const clerkId = identity.subject;

    // Check if presence record already exists for this user + workspace
    const existing = await ctx.db
      .query("userPresence")
      .withIndex("by_user_workspace", (q) =>
        q.eq("clerkId", clerkId).eq("workspaceId", args.workspaceId),
      )
      .unique();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        userName: args.userName,
        userAvatar: args.userAvatar,
        location: args.location,
        roomId: args.roomId,
        roomName: args.roomName,
        roomType: args.roomType,
        fileId: args.fileId,
        fileName: args.fileName,
        meetingName: args.meetingName,
        path: args.path,
        lastHeartbeat: Date.now(),
      });
    } else {
      // Insert new record
      await ctx.db.insert("userPresence", {
        workspaceId: args.workspaceId,
        clerkId,
        userName: args.userName,
        userAvatar: args.userAvatar,
        location: args.location,
        roomId: args.roomId,
        roomName: args.roomName,
        roomType: args.roomType,
        fileId: args.fileId,
        fileName: args.fileName,
        meetingName: args.meetingName,
        path: args.path,
        lastHeartbeat: Date.now(),
      });
    }
  },
});

/**
 * Remove the current user's presence record from a workspace.
 * Called when the user navigates away or closes the tab.
 */
export const clearPresence = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const clerkId = identity.subject;

    const existing = await ctx.db
      .query("userPresence")
      .withIndex("by_user_workspace", (q) =>
        q.eq("clerkId", clerkId).eq("workspaceId", args.workspaceId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/**
 * Get all active presence records for a workspace.
 * Filters out stale entries (>30 seconds without heartbeat)
 * and excludes the requesting user.
 */
export const getWorkspacePresence = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const clerkId = identity.subject;
    const staleThreshold = Date.now() - 30_000; // 30 seconds

    const allPresence = await ctx.db
      .query("userPresence")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Filter out stale entries and the current user
    return allPresence.filter(
      (p) => p.lastHeartbeat > staleThreshold && p.clerkId !== clerkId,
    );
  },
});
