import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a general channel for a workspace
 * This is typically called automatically when a workspace is created
 */
export const createGeneralChannel = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    createdBy: v.string(), // Clerk User ID
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if general channel already exists
    const existingGeneral = await ctx.db
      .query("channels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("type"), "general"))
      .first();

    if (existingGeneral) {
      return existingGeneral._id;
    }

    // Create general channel
    const channelId = await ctx.db.insert("channels", {
      workspaceId: args.workspaceId,
      name: "general",
      type: "general",
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });

    return channelId;
  },
});

/**
 * Create or get existing direct message channel between two users
 */
export const createOrGetDirectChannel = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    otherUserId: v.string(), // Clerk User ID of the other person
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;

    // Can't DM yourself
    if (currentUserId === args.otherUserId) {
      throw new Error("Cannot create DM with yourself");
    }

    // Sort user IDs to ensure consistent ordering
    const participantIds = [currentUserId, args.otherUserId].sort();

    // Check if DM channel already exists
    const existingDM = await ctx.db
      .query("channels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("type"), "direct"))
      .collect();

    // Find matching DM by comparing participant arrays
    const matchingDM = existingDM.find((channel) => {
      const channelParticipants = channel.participantIds?.sort() || [];
      return (
        channelParticipants.length === 2 &&
        channelParticipants[0] === participantIds[0] &&
        channelParticipants[1] === participantIds[1]
      );
    });

    if (matchingDM) {
      return matchingDM._id;
    }

    // Create new DM channel
    const channelId = await ctx.db.insert("channels", {
      workspaceId: args.workspaceId,
      name: `dm-${participantIds[0]}-${participantIds[1]}`,
      type: "direct",
      participantIds: participantIds,
      createdAt: Date.now(),
      createdBy: currentUserId,
    });

    return channelId;
  },
});

/**
 * Get all channels in a workspace (general + group channels, not DMs)
 */
export const getWorkspaceChannels = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const channels = await ctx.db
      .query("channels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.neq(q.field("type"), "direct"))
      .order("asc")
      .collect();

    return channels;
  },
});

/**
 * Get all direct message channels for the current user in a workspace
 */
export const getDirectChannels = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUserId = identity.subject;

    // Get all DM channels in workspace
    const allDMs = await ctx.db
      .query("channels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("type"), "direct"))
      .collect();

    // Filter to only DMs that include the current user
    const userDMs = allDMs.filter((channel) =>
      channel.participantIds?.includes(currentUserId),
    );

    // Enrich with other user's info
    const enrichedDMs = await Promise.all(
      userDMs.map(async (dm) => {
        const otherUserId = dm.participantIds?.find(
          (id) => id !== currentUserId,
        );

        // Get other user's info from users table
        let otherUserName = "Unknown User";
        if (otherUserId) {
          const otherUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", otherUserId))
            .first();
          if (otherUser) {
            otherUserName = otherUser.name;
          }
        }

        return {
          ...dm,
          otherUserId,
          otherUserName,
        };
      }),
    );

    return enrichedDMs;
  },
});

/**
 * Get a specific channel by ID (with permission check)
 */
export const getChannel = query({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const currentUserId = identity.subject;
    const channel = await ctx.db.get(args.channelId);

    if (!channel) {
      return null;
    }

    // Check permission for DM channels
    if (
      channel.type === "direct" &&
      !channel.participantIds?.includes(currentUserId)
    ) {
      throw new Error("You don't have access to this channel");
    }

    return channel;
  },
});

/**
 * Get channel by context
 */
export const getChannelByContext = query({
  args: {
    contextType: v.union(
      v.literal("document"),
      v.literal("codeFile"),
      v.literal("whiteboard"),
      v.literal("spreadsheet"),
      v.literal("meeting"),
    ),
    contextId: v.string(),
  },
  handler: async (ctx, args) => {
    const channel = await ctx.db
      .query("channels")
      .withIndex("by_context", (q) =>
        q.eq("contextType", args.contextType).eq("contextId", args.contextId),
      )
      .unique();
    return channel;
  },
});
