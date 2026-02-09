import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new kanban board in a room
export const createKanban = mutation({
  args: {
    roomId: v.id("rooms"),
    workspaceId: v.id("workspaces"),
    name: v.string(),
    createdBy: v.string(), // Clerk User ID
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const kanbanId = await ctx.db.insert("kanbans", {
      roomId: args.roomId,
      workspaceId: args.workspaceId,
      name: args.name,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
      content: JSON.stringify({
        version: 1,
        columns: [
          { id: "todo", title: "To do", cardIds: [] },
          { id: "in-progress", title: "In progress", cardIds: [] },
          { id: "done", title: "Done", cardIds: [] },
        ],
        cards: {},
      }),
    });

    return kanbanId;
  },
});

// Get all kanban boards for a room
export const getKanbansByRoom = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const kanbans = await ctx.db
      .query("kanbans")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Sort by updatedAt (most recent first)
    kanbans.sort((a, b) => b.updatedAt - a.updatedAt);

    const enriched = await Promise.all(
      kanbans.map(async (board) => {
        const creator = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", board.createdBy))
          .first();

        let lastEditor = null;
        if (board.lastEditedBy && board.lastEditedBy !== board.createdBy) {
          lastEditor = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) =>
              q.eq("clerkId", board.lastEditedBy as string),
            )
            .first();
        }

        return {
          ...board,
          creatorName: creator?.name || "Unknown",
          lastEditorName: lastEditor?.name || null,
        };
      }),
    );

    return enriched;
  },
});

// Get a specific kanban board by ID
export const getKanbanById = query({
  args: {
    kanbanId: v.id("kanbans"),
  },
  handler: async (ctx, args) => {
    const kanban = await ctx.db.get(args.kanbanId);
    if (!kanban) return null;

    const creator = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", kanban.createdBy))
      .first();

    let lastEditor = null;
    if (kanban.lastEditedBy && kanban.lastEditedBy !== kanban.createdBy) {
      lastEditor = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) =>
          q.eq("clerkId", kanban.lastEditedBy as string),
        )
        .first();
    }

    return {
      ...kanban,
      creatorName: creator?.name || "Unknown",
      lastEditorName: lastEditor?.name || null,
    };
  },
});

// Update kanban metadata (name, lastEditedBy, etc.)
export const updateKanban = mutation({
  args: {
    kanbanId: v.id("kanbans"),
    name: v.optional(v.string()),
    lastEditedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { kanbanId, ...updates } = args;
    await ctx.db.patch(kanbanId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Save kanban content (JSON string)
export const saveKanbanContent = mutation({
  args: {
    kanbanId: v.id("kanbans"),
    content: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.kanbanId, {
      content: args.content,
      lastEditedBy: args.userId,
      updatedAt: Date.now(),
    });
  },
});

// Delete a kanban board
export const deleteKanban = mutation({
  args: {
    kanbanId: v.id("kanbans"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.kanbanId);
  },
});

// Record that a user edited a kanban board
export const recordKanbanEdit = mutation({
  args: {
    kanbanId: v.id("kanbans"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.kanbanId, {
      lastEditedBy: args.userId,
      updatedAt: Date.now(),
    });
  },
});
