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
    reactionType: v.union(v.literal("like"), v.literal("dislike"), v.literal("haha")),
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
 * Get latest message for a channel (useful for showing previews)
 */
export const getLatestMessage = query({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(1);

    return messages[0] || null;
  },
});

/**
 * Mark a message as seen by the current user
 */
export const markMessageAsSeen = mutation({
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

    // Don't mark your own messages as seen
    if (message.authorId === currentUserId) {
      return { success: true, alreadySeen: true };
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

    // Check if already seen by this user
    const seenBy = message.seenBy || [];
    const alreadySeen = seenBy.some((seen) => seen.userId === currentUserId);

    if (alreadySeen) {
      return { success: true, alreadySeen: true };
    }

    // Add user to seenBy list
    await ctx.db.patch(args.messageId, {
      seenBy: [...seenBy, { userId: currentUserId, seenAt: Date.now() }],
    });

    return { success: true, alreadySeen: false };
  },
});

/**
 * Mark all messages in a channel as seen (useful when opening a channel)
 */
export const markChannelMessagesAsSeen = mutation({
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

    // Get all messages in channel that user hasn't seen yet
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();

    let markedCount = 0;

    // Mark each unseen message
    for (const message of messages) {
      // Skip own messages
      if (message.authorId === currentUserId) {
        continue;
      }

      // Check if already seen
      const seenBy = message.seenBy || [];
      const alreadySeen = seenBy.some((seen) => seen.userId === currentUserId);

      if (!alreadySeen) {
        await ctx.db.patch(message._id, {
          seenBy: [...seenBy, { userId: currentUserId, seenAt: Date.now() }],
        });
        markedCount++;
      }
    }

    return { success: true, markedCount };
  },
});

/**
 * Get users who have seen a specific message (with their details)
 */
export const getMessageSeenBy = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get message
    const message = await ctx.db.get(args.messageId);
    if (!message || !message.seenBy) {
      return [];
    }

    // Get user details for each person who saw the message
    const seenByDetails = await Promise.all(
      message.seenBy.map(async (seen) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", seen.userId))
          .first();

        return {
          userId: seen.userId,
          userName: user?.name || "Unknown User",
          userEmail: user?.email || "",
          seenAt: seen.seenAt,
        };
      })
    );

    return seenByDetails;
  },
});
