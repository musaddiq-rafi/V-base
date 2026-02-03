import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new kanban board in a room
export const createKanbanBoard = mutation({
  args: {
    roomId: v.id("rooms"),
    workspaceId: v.id("workspaces"),
    name: v.string(),
    createdBy: v.string(), // Clerk User ID
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const boardId = await ctx.db.insert("kanbanBoards", {
      roomId: args.roomId,
      workspaceId: args.workspaceId,
      name: args.name,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return boardId;
  },
});

// Get all kanban boards for a room
export const getKanbanBoardsByRoom = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const boards = await ctx.db
      .query("kanbanBoards")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Sort by updatedAt (most recent first)
    boards.sort((a, b) => b.updatedAt - a.updatedAt);

    // Enrich with user info
    const enrichedBoards = await Promise.all(
      boards.map(async (board) => {
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

    return enrichedBoards;
  },
});

// Get a specific kanban board by ID
export const getKanbanBoardById = query({
  args: {
    boardId: v.id("kanbanBoards"),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);

    if (!board) {
      return null;
    }

    // Enrich with user info
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
  },
});

// Update kanban board metadata (name, lastEditedBy, etc.)
export const updateKanbanBoard = mutation({
  args: {
    boardId: v.id("kanbanBoards"),
    name: v.optional(v.string()),
    lastEditedBy: v.optional(v.string()), // Clerk User ID
  },
  handler: async (ctx, args) => {
    const { boardId, ...updates } = args;

    await ctx.db.patch(boardId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a kanban board
export const deleteKanbanBoard = mutation({
  args: {
    boardId: v.id("kanbanBoards"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.boardId);
  },
});

// Record that a user edited a kanban board (for tracking last editor)
export const recordKanbanBoardEdit = mutation({
  args: {
    boardId: v.id("kanbanBoards"),
    userId: v.string(), // Clerk User ID
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.boardId, {
      lastEditedBy: args.userId,
      updatedAt: Date.now(),
    });
  },
});
