import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createWorkspace = mutation({
  args: {
    name: v.string(),
    roomData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the current user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found in database");
    }

    // Create workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      ownerId: user._id,
      memberIds: [user._id], // Owner is automatically a member
      roomData: args.roomData,
    });

    return workspaceId;
  },
});

export const getWorkspacesByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return [];
    }

    // Get all workspaces where user is a member
    const allWorkspaces = await ctx.db.query("workspaces").collect();
    const userWorkspaces = allWorkspaces.filter((workspace) =>
      workspace.memberIds.includes(user._id)
    );

    return userWorkspaces;
  },
});

export const getWorkspaceById = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workspaceId);
  },
});
