import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get all AI chat messages for a specific code file, ordered by timestamp
 */
export const getMessages = query({
  args: {
    fileId: v.id("codeFiles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("aiChatMessages")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .collect();
  },
});

/**
 * Save a new AI chat message (user or assistant)
 */
export const saveMessage = mutation({
  args: {
    fileId: v.id("codeFiles"),
    roomId: v.id("rooms"),
    workspaceId: v.id("workspaces"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    mode: v.union(v.literal("ask"), v.literal("agent")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("aiChatMessages", {
      fileId: args.fileId,
      roomId: args.roomId,
      workspaceId: args.workspaceId,
      role: args.role,
      content: args.content,
      mode: args.mode,
      timestamp: Date.now(),
    });
  },
});

/**
 * Clear all AI chat messages for a specific code file
 */
export const clearMessages = mutation({
  args: {
    fileId: v.id("codeFiles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const messages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    return { success: true, deleted: messages.length };
  },
});

/**
 * Delete all AI chat messages for a specific code file
 * (Used internally during cascading deletes)
 */
export const deleteMessagesForFile = mutation({
  args: {
    fileId: v.id("codeFiles"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    return { deleted: messages.length };
  },
});

/**
 * Delete all AI chat messages for a room (used when deleting a code room)
 */
export const deleteMessagesForRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    return { deleted: messages.length };
  },
});

/**
 * Delete all AI chat messages for a workspace (used when deleting a workspace)
 */
export const deleteMessagesForWorkspace = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    return { deleted: messages.length };
  },
});
