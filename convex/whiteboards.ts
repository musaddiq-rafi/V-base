import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new whiteboard in a room
export const createWhiteboard = mutation({
  args: {
    roomId: v.id("rooms"),
    workspaceId: v.id("workspaces"),
    name: v.string(),
    createdBy: v.string(), // Clerk User ID
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const whiteboardId = await ctx.db.insert("whiteboards", {
      roomId: args.roomId,
      workspaceId: args.workspaceId,
      name: args.name,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    const existingChannel = await ctx.db
      .query("channels")
      .withIndex("by_file", (q) =>
        q
          .eq("roomId", args.roomId)
          .eq("fileId", whiteboardId)
          .eq("fileType", "whiteboard")
      )
      .first();

    if (!existingChannel) {
      await ctx.db.insert("channels", {
        workspaceId: args.workspaceId,
        name: `whiteboard-${whiteboardId}`,
        type: "file",
        roomId: args.roomId,
        fileId: whiteboardId,
        fileType: "whiteboard",
        createdAt: Date.now(),
        createdBy: args.createdBy,
      });
    }

    return whiteboardId;
  },
});

// Get all whiteboards for a room
export const getWhiteboardsByRoom = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const whiteboards = await ctx.db
      .query("whiteboards")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Sort by updatedAt (most recent first)
    whiteboards.sort((a, b) => b.updatedAt - a.updatedAt);

    // Enrich with user info
    const enrichedWhiteboards = await Promise.all(
      whiteboards.map(async (board) => {
        const creator = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", board.createdBy))
          .first();

        let lastEditor = null;
        if (board.lastEditedBy && board.lastEditedBy !== board.createdBy) {
          const lastEditedById = board.lastEditedBy;
          lastEditor = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", lastEditedById))
            .first();
        }

        return {
          ...board,
          creatorName: creator?.name || "Unknown",
          lastEditorName: lastEditor?.name || null,
        };
      })
    );

    return enrichedWhiteboards;
  },
});

// Get a specific whiteboard by ID
export const getWhiteboardById = query({
  args: {
    whiteboardId: v.id("whiteboards"),
  },
  handler: async (ctx, args) => {
    const whiteboard = await ctx.db.get(args.whiteboardId);

    if (!whiteboard) {
      return null;
    }

    // Enrich with user info
    const creator = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", whiteboard.createdBy))
      .first();

    let lastEditor = null;
    if (whiteboard.lastEditedBy && whiteboard.lastEditedBy !== whiteboard.createdBy) {
      const lastEditedById = whiteboard.lastEditedBy;
      lastEditor = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", lastEditedById))
        .first();
    }

    return {
      ...whiteboard,
      creatorName: creator?.name || "Unknown",
      lastEditorName: lastEditor?.name || null,
    };
  },
});

// Update whiteboard metadata (name, lastEditedBy, etc.)
export const updateWhiteboard = mutation({
  args: {
    whiteboardId: v.id("whiteboards"),
    name: v.optional(v.string()),
    lastEditedBy: v.optional(v.string()), // Clerk User ID
  },
  handler: async (ctx, args) => {
    const { whiteboardId, ...updates } = args;

    await ctx.db.patch(whiteboardId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Save whiteboard content (Excalidraw elements)
export const saveWhiteboardContent = mutation({
  args: {
    whiteboardId: v.id("whiteboards"),
    content: v.string(), // JSON stringified Excalidraw elements
    userId: v.string(), // Clerk User ID
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.whiteboardId, {
      content: args.content,
      lastEditedBy: args.userId,
      updatedAt: Date.now(),
    });
  },
});

// Delete a whiteboard
export const deleteWhiteboard = mutation({
  args: {
    whiteboardId: v.id("whiteboards"),
  },
  handler: async (ctx, args) => {
    const whiteboard = await ctx.db.get(args.whiteboardId);
    if (whiteboard) {
      const channel = await ctx.db
        .query("channels")
        .withIndex("by_file", (q) =>
          q
            .eq("roomId", whiteboard.roomId)
            .eq("fileId", whiteboard._id)
            .eq("fileType", "whiteboard")
        )
        .first();

      if (channel) {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
          .collect();

        for (const message of messages) {
          await ctx.db.delete(message._id);
        }

        const lastRead = await ctx.db
          .query("lastRead")
          .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
          .collect();

        for (const entry of lastRead) {
          await ctx.db.delete(entry._id);
        }

        await ctx.db.delete(channel._id);
      }
    }

    await ctx.db.delete(args.whiteboardId);
  },
});

// Record that a user edited a whiteboard (for tracking last editor)
export const recordWhiteboardEdit = mutation({
  args: {
    whiteboardId: v.id("whiteboards"),
    userId: v.string(), // Clerk User ID
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.whiteboardId, {
      lastEditedBy: args.userId,
      updatedAt: Date.now(),
    });
  },
});
