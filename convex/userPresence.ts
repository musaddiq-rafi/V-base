import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Upsert the current user's presence (location) within a workspace.
 * Called on navigation events (mount, location change, tab re-focus).
 * No periodic heartbeat — purely event-driven.
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
 * Excludes the requesting user.
 *
 * With event-driven presence, records are created/updated on navigation
 * and deleted on unmount/tab-close. Orphaned records (e.g. browser crash)
 * are cleaned up by the cron job, so no time-based filtering is needed here.
 * This keeps the query purely data-dependent — Convex only re-evaluates it
 * when the userPresence table actually changes.
 */
export const getWorkspacePresence = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const clerkId = identity.subject;

    const allPresence = await ctx.db
      .query("userPresence")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Exclude the current user — stale cleanup is handled by cron
    return allPresence.filter((p) => p.clerkId !== clerkId);
  },
});

/**
 * Internal mutation to clean up orphaned presence records.
 * Called by a cron job every 5 minutes.
 * Deletes any record whose lastHeartbeat is older than 10 minutes.
 */
export const cleanupStalePresence = internalMutation({
  args: {},
  handler: async (ctx) => {
    const staleThreshold = Date.now() - 10 * 60_000; // 10 minutes

    // Scan all presence records and delete stale ones
    const allPresence = await ctx.db.query("userPresence").collect();
    let deleted = 0;

    for (const record of allPresence) {
      if (record.lastHeartbeat < staleThreshold) {
        await ctx.db.delete(record._id);
        deleted++;
      }
    }

    return { deleted };
  },
});
