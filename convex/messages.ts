import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Send a message to a channel
 */
export const sendMessage = mutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;

    // Get channel to verify access and get workspaceId
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    // Check permission for DM channels
    if (
      channel.type === "direct" &&
      !channel.participantIds?.includes(currentUserId)
    ) {
      throw new Error("You don't have access to this channel");
    }

    // Get user info for cached name
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", currentUserId))
      .first();

    const authorName = user?.name || "Unknown User";

    // Create message
    const messageId = await ctx.db.insert("messages", {
      channelId: args.channelId,
      workspaceId: channel.workspaceId,
      authorId: currentUserId,
      authorName: authorName,
      content: args.content,
      timestamp: Date.now(),
    });

    return messageId;
  },
});

/**
 * Get messages for a channel with pagination
 */
export const getChannelMessages = query({
  args: {
    channelId: v.id("channels"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUserId = identity.subject;

    // Get channel to verify access
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      return [];
    }

    // Check permission for DM channels
    if (
      channel.type === "direct" &&
      !channel.participantIds?.includes(currentUserId)
    ) {
      throw new Error("You don't have access to this channel");
    }

    // Get messages with optional limit
    const limit = args.limit || 100;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc") // Most recent first
      .take(limit);

    // Return in chronological order (oldest first)
    return messages.reverse();
  },
});

/**
 * Toggle a reaction on a message
 */
export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    reactionType: v.union(
      v.literal("like"),
      v.literal("dislike"),
      v.literal("haha")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;

    // Get message
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Get channel to verify access
    const channel = await ctx.db.get(message.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    // Check permission for DM channels
    if (
      channel.type === "direct" &&
      !channel.participantIds?.includes(currentUserId)
    ) {
      throw new Error("You don't have access to this message");
    }

    // Get current reactions
    const reactions = message.reactions || {};
    const reactionArray = reactions[args.reactionType] || [];

    // Toggle: remove if present, add if not
    const userIndex = reactionArray.indexOf(currentUserId);
    let updatedReactionArray: string[];

    if (userIndex > -1) {
      // Remove reaction
      updatedReactionArray = reactionArray.filter((id) => id !== currentUserId);
    } else {
      // Add reaction
      updatedReactionArray = [...reactionArray, currentUserId];
    }

    // Update message with new reactions
    await ctx.db.patch(args.messageId, {
      reactions: {
        ...reactions,
        [args.reactionType]: updatedReactionArray,
      },
    });

    return { added: userIndex === -1 };
  },
});

/**
 * Delete a message (only author can delete)
 */
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;

    // Get message
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Only author can delete
    if (message.authorId !== currentUserId) {
      throw new Error("You can only delete your own messages");
    }

    // Delete the message
    await ctx.db.delete(args.messageId);

    return { success: true };
  },
});

/**
 * Edit a message (only author can edit)
 */
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    newContent: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;

    // Get message
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Only author can edit
    if (message.authorId !== currentUserId) {
      throw new Error("You can only edit your own messages");
    }

    // Update the message
    await ctx.db.patch(args.messageId, {
      content: args.newContent,
    });

    return { success: true };
  },
});

/**
 * Mark a channel as read (cursor-based - single DB write)
 */
export const markChannelAsRead = mutation({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;

    // Get channel to verify access
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    // Check permission for DM channels
    if (
      channel.type === "direct" &&
      !channel.participantIds?.includes(currentUserId)
    ) {
      throw new Error("You don't have access to this channel");
    }

    const now = Date.now();

    // Check if lastRead record exists
    const existingLastRead = await ctx.db
      .query("lastRead")
      .withIndex("by_user_channel", (q) =>
        q.eq("userId", currentUserId).eq("channelId", args.channelId)
      )
      .first();

    if (existingLastRead) {
      // Update existing record - single DB write!
      await ctx.db.patch(existingLastRead._id, { lastReadAt: now });
    } else {
      // Create new record - single DB write!
      await ctx.db.insert("lastRead", {
        userId: currentUserId,
        channelId: args.channelId,
        lastReadAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Get channel states (unread counts + message previews) for all channels
 * This replaces N subscriptions with a single query using parallel execution
 */
export const getUnreadCounts = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { channels: {}, total: 0, previews: {} };
    }

    const currentUserId = identity.subject;

    // 1. Get all channels in the workspace
    const allChannels = await ctx.db
      .query("channels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Filter channels user has access to
    const accessibleChannels = allChannels.filter((channel) => {
      if (channel.type === "direct") {
        return channel.participantIds?.includes(currentUserId);
      }
      return true; // General channels are accessible to all
    });

    // 2. Get all lastRead records for this user
    const lastReadRecords = await ctx.db
      .query("lastRead")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .collect();

    const lastReadMap = new Map<string, number>();
    lastReadRecords.forEach((record) => {
      lastReadMap.set(record.channelId, record.lastReadAt);
    });

    // 3. OPTIMIZATION: Run all channel queries in parallel
    const countPromises = accessibleChannels.map(async (channel) => {
      const lastReadAt = lastReadMap.get(channel._id) || 0;

      // Count unread messages (parallel execution)
      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
        .filter((q) =>
          q.and(
            q.gt(q.field("timestamp"), lastReadAt),
            q.neq(q.field("authorId"), currentUserId)
          )
        )
        .collect();

      // Get latest message for preview (parallel execution)
      const latestMsg = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
        .order("desc")
        .first();

      return {
        id: channel._id,
        count: unreadMessages.length,
        preview: latestMsg ? latestMsg.content.substring(0, 50) : "",
      };
    });

    const results = await Promise.all(countPromises);

    // 4. Aggregate results
    const channels: Record<string, number> = {};
    const previews: Record<string, string> = {};
    let total = 0;

    for (const res of results) {
      if (res.count > 0) {
        channels[res.id] = res.count;
        total += res.count;
      }
      if (res.preview) {
        previews[res.id] = res.preview;
      }
    }

    return { channels, total, previews };
  },
});

/**
 * Get messages with author info resolved at query time
 * This ensures author names are always up-to-date
 */
export const getMessagesWithAuthors = query({
  args: {
    channelId: v.id("channels"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUserId = identity.subject;

    // Get channel to verify access
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      return [];
    }

    // Check permission for DM channels
    if (
      channel.type === "direct" &&
      !channel.participantIds?.includes(currentUserId)
    ) {
      throw new Error("You don't have access to this channel");
    }

    // Get messages
    const limit = args.limit || 100;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(limit);

    // Get unique author IDs
    const authorIds = [...new Set(messages.map((m) => m.authorId))];

    // Batch fetch authors
    const authors = await Promise.all(
      authorIds.map(async (authorId) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", authorId))
          .first();
        return { authorId, name: user?.name || "Unknown User" };
      })
    );

    const authorMap = new Map(authors.map((a) => [a.authorId, a.name]));

    // Return messages with resolved author names (in chronological order)
    return messages.reverse().map((msg) => ({
      ...msg,
      authorName:
        authorMap.get(msg.authorId) || msg.authorName || "Unknown User",
    }));
  },
});
