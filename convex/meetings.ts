import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MAX_MEETINGS_PER_ROOM = 3;

// Get all active meetings in a conference room
export const getActiveMeetings = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_room_status", (q) =>
        q.eq("roomId", args.roomId).eq("status", "active"),
      )
      .collect();

    return meetings;
  },
});

// Get a specific meeting by ID
export const getMeetingById = query({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.meetingId);
  },
});

// Create a new meeting in a conference room
export const createMeeting = mutation({
  args: {
    roomId: v.id("rooms"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if room exists and is a conference room
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    if (room.type !== "conference") {
      throw new Error("This room is not a conference room");
    }

    // Check active meetings count
    const activeMeetings = await ctx.db
      .query("meetings")
      .withIndex("by_room_status", (q) =>
        q.eq("roomId", args.roomId).eq("status", "active"),
      )
      .collect();

    if (activeMeetings.length >= MAX_MEETINGS_PER_ROOM) {
      throw new Error(
        `This room already has ${MAX_MEETINGS_PER_ROOM} active meetings. Please wait for one to end or join an existing meeting.`,
      );
    }

    // Create unique LiveKit room name
    // Use a stable identifier that won't change between create and join
    const livekitRoomName = `meeting_${args.roomId}_${Date.now()}`;

    const meetingId = await ctx.db.insert("meetings", {
      roomId: args.roomId,
      name: args.name.trim(),
      livekitRoomName,
      createdBy: identity.subject,
      createdByName: identity.name || "Unknown",
      createdAt: Date.now(),
      status: "active",
      participantCount: 0,
    });

    // Create a chat channel for this meeting
    await ctx.db.insert("channels", {
      workspaceId: room.workspaceId,
      name: `meeting-chat-${args.name.trim()}`,
      type: "meeting",
      contextType: "meeting",
      contextId: meetingId,
      createdAt: Date.now(),
      createdBy: identity.subject,
    });

    // Return both meetingId and livekitRoomName to avoid race condition
    return { meetingId, livekitRoomName };
  },
});

// Join a meeting (increment participant count)
export const joinMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }
    if (meeting.status !== "active") {
      throw new Error("This meeting has ended");
    }

    await ctx.db.patch(args.meetingId, {
      participantCount: meeting.participantCount + 1,
    });

    // Return the livekitRoomName so frontend always has the correct value
    return { livekitRoomName: meeting.livekitRoomName };
  },
});

// Leave a meeting (decrement participant count, end if 0)
export const leaveMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    const newCount = Math.max(0, meeting.participantCount - 1);

    if (newCount === 0) {
      // Delete the meeting chat channel and all messages first
      const linkedChannel = await ctx.db
        .query("channels")
        .withIndex("by_context", (q) =>
          q.eq("contextType", "meeting").eq("contextId", args.meetingId),
        )
        .unique();

      if (linkedChannel) {
        // Delete all messages in this channel
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_channel", (q) => q.eq("channelId", linkedChannel._id))
          .collect();
        for (const msg of messages) {
          await ctx.db.delete(msg._id);
        }

        // Delete lastRead records for this channel
        const readReceipts = await ctx.db
          .query("lastRead")
          .withIndex("by_channel", (q) => q.eq("channelId", linkedChannel._id))
          .collect();
        for (const receipt of readReceipts) {
          await ctx.db.delete(receipt._id);
        }

        // Delete the channel
        await ctx.db.delete(linkedChannel._id);
      }

      // Delete the meeting when last person leaves (keeps DB clean)
      await ctx.db.delete(args.meetingId);
    } else {
      await ctx.db.patch(args.meetingId, {
        participantCount: newCount,
      });
    }

    return { ended: newCount === 0 };
  },
});

// Manually end a meeting (for host/admin)
export const endMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    // Only the creator can end the meeting
    if (meeting.createdBy !== identity.subject) {
      throw new Error("Only the meeting creator can end this meeting");
    }

    // Delete the meeting chat channel and all messages first
    const linkedChannel = await ctx.db
      .query("channels")
      .withIndex("by_context", (q) =>
        q.eq("contextType", "meeting").eq("contextId", args.meetingId),
      )
      .unique();

    if (linkedChannel) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", linkedChannel._id))
        .collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }

      const readReceipts = await ctx.db
        .query("lastRead")
        .withIndex("by_channel", (q) => q.eq("channelId", linkedChannel._id))
        .collect();
      for (const receipt of readReceipts) {
        await ctx.db.delete(receipt._id);
      }

      await ctx.db.delete(linkedChannel._id);
    }

    // Delete the meeting record (keeps DB clean)
    await ctx.db.delete(args.meetingId);

    return { success: true };
  },
});

// Force end a meeting - anyone can use this for abandoned meetings
// This is useful when participant count gets out of sync
export const forceEndMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    // Allow force-ending if meeting has been active for more than 1 hour
    // or if participant count is 0 but status is still active
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const canForceEnd =
      meeting.participantCount === 0 ||
      meeting.createdAt < oneHourAgo ||
      meeting.createdBy === identity.subject;

    if (!canForceEnd) {
      throw new Error("Cannot force end this meeting");
    }

    // Delete the meeting chat channel and all messages first
    const linkedChannel = await ctx.db
      .query("channels")
      .withIndex("by_context", (q) =>
        q.eq("contextType", "meeting").eq("contextId", args.meetingId),
      )
      .unique();

    if (linkedChannel) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", linkedChannel._id))
        .collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }

      const readReceipts = await ctx.db
        .query("lastRead")
        .withIndex("by_channel", (q) => q.eq("channelId", linkedChannel._id))
        .collect();
      for (const receipt of readReceipts) {
        await ctx.db.delete(receipt._id);
      }

      await ctx.db.delete(linkedChannel._id);
    }

    // Delete the meeting record (keeps DB clean)
    await ctx.db.delete(args.meetingId);

    return { success: true };
  },
});

// Get meeting stats for a room
export const getMeetingStats = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const activeMeetings = await ctx.db
      .query("meetings")
      .withIndex("by_room_status", (q) =>
        q.eq("roomId", args.roomId).eq("status", "active"),
      )
      .collect();

    return {
      activeCount: activeMeetings.length,
      maxLimit: MAX_MEETINGS_PER_ROOM,
      canCreateMore: activeMeetings.length < MAX_MEETINGS_PER_ROOM,
    };
  },
});
