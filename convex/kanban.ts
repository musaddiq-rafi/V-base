import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createKanbanBoard = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const boardId = await ctx.db.insert("kanbanBoards", {
      workspaceId: args.workspaceId,
      name: args.name,
      createdBy: identity.subject,
      createdAt: Date.now(),
    });
    return boardId;
  },
});
