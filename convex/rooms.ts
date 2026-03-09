import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new room in a workspace
export const createRoom = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    type: v.union(
      v.literal("document"),
      v.literal("code"),
      v.literal("whiteboard"),
      v.literal("conference"),
      v.literal("kanban"),
      v.literal("spreadsheet"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if workspace has reached the maximum room limit (10)
    const existingRooms = await ctx.db
      .query("rooms")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    if (existingRooms.length >= 10) {
      throw new Error(
        "This workspace has reached the maximum limit of 10 rooms. Please delete an existing room to create a new one.",
      );
    }

    // Check if trying to create a conference room when one already exists
    if (args.type === "conference") {
      const existingConferenceRoom = existingRooms.find(
        (room) => room.type === "conference",
      );
      if (existingConferenceRoom) {
        throw new Error(
          "This workspace already has a meeting room. Only one meeting room is allowed per workspace.",
        );
      }
    }

    // Kanban room: no special constraints, just create

    // Create the room
    const roomId = await ctx.db.insert("rooms", {
      workspaceId: args.workspaceId,
      name: args.name,
      type: args.type,
    });

    // If it's a kanban room, create a default kanban board
    if (args.type === "kanban") {
      const now = Date.now();
      await ctx.db.insert("kanbans", {
        roomId,
        workspaceId: args.workspaceId,
        name: `${args.name} Board`,
        createdBy: identity.subject,
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
    }

    if (args.type === "kanban") {
      // find the kanban we just created
      const kanban = await ctx.db
        .query("kanbans")
        .withIndex("by_room", (q) => q.eq("roomId", roomId))
        .first();

      return { roomId, kanbanId: kanban?._id || null };
    }

    return { roomId };
  },
});

// Get all rooms for a workspace
export const getRoomsByWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return rooms;
  },
});

// Get a specific room by ID
export const getRoomById = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    return room;
  },
});

// Delete a room and all its contents
// Delete a room and all its contents (full cascade)
// Returns information about what was deleted for Liveblocks cleanup
export const deleteRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const liveblocksRoomIdsToDelete: string[] = [];

    // --- Helper: cascade-delete a channel and its messages + read receipts ---
    const deleteChannelCascade = async (channelId: Id<"channels">) => {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", channelId))
        .collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }
      const readReceipts = await ctx.db
        .query("lastRead")
        .withIndex("by_channel", (q) => q.eq("channelId", channelId))
        .collect();
      for (const receipt of readReceipts) {
        await ctx.db.delete(receipt._id);
      }
      await ctx.db.delete(channelId);
    };

    // --- Helper: find & delete a context-linked channel ---
    const deleteContextChannel = async (
      contextType: string,
      contextId: string,
    ) => {
      const channel = await ctx.db
        .query("channels")
        .withIndex("by_context", (q) =>
          q.eq("contextType", contextType as any).eq("contextId", contextId),
        )
        .unique();
      if (channel) {
        await deleteChannelCascade(channel._id);
      }
    };

    // Handle different room types
    if (room.type === "code") {
      // 1. Delete all AI chat messages for this room
      const aiMessages = await ctx.db
        .query("aiChatMessages")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();
      for (const msg of aiMessages) {
        await ctx.db.delete(msg._id);
      }

      // 2. Delete all code files + their linked channels
      const codeFiles = await ctx.db
        .query("codeFiles")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();

      for (const file of codeFiles) {
        if (file.type === "file") {
          liveblocksRoomIdsToDelete.push(`code:${file._id}`);
          await deleteContextChannel("codeFile", file._id);
        }
        await ctx.db.delete(file._id);
      }
    } else if (room.type === "document") {
      // Delete all documents + their linked channels
      const documents = await ctx.db
        .query("documents")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();

      for (const doc of documents) {
        liveblocksRoomIdsToDelete.push(`doc:${doc._id}`);
        await deleteContextChannel("document", doc._id);
        await ctx.db.delete(doc._id);
      }
    } else if (room.type === "whiteboard") {
      // Delete all whiteboards + their linked channels
      const whiteboards = await ctx.db
        .query("whiteboards")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();

      for (const wb of whiteboards) {
        liveblocksRoomIdsToDelete.push(`whiteboard:${wb._id}`);
        await deleteContextChannel("whiteboard", wb._id);
        await ctx.db.delete(wb._id);
      }
    } else if (room.type === "conference") {
      // Delete all meetings + their linked channels
      const meetings = await ctx.db
        .query("meetings")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();

      for (const meeting of meetings) {
        await deleteContextChannel("meeting", meeting._id);
        await ctx.db.delete(meeting._id);
      }
    } else if (room.type === "kanban") {
      // Delete kanban boards + their linked channels
      const kanbans = await ctx.db
        .query("kanbans")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();

      for (const kb of kanbans) {
        await deleteContextChannel("kanbanBoard", kb._id);
        await ctx.db.delete(kb._id);
      }
    } else if (room.type === "spreadsheet") {
      // Delete all spreadsheets + their linked channels
      const spreadsheets = await ctx.db
        .query("spreadsheets")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();

      for (const sheet of spreadsheets) {
        liveblocksRoomIdsToDelete.push(`spreadsheet:${sheet._id}`);
        await deleteContextChannel("spreadsheet", sheet._id);
        await ctx.db.delete(sheet._id);
      }
    }

    // Clean up room-level presence Liveblocks room
    liveblocksRoomIdsToDelete.push(`room:${args.roomId}`);

    // Clean up userPresence records for this room
    const presenceRecords = await ctx.db
      .query("userPresence")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", room.workspaceId))
      .collect();
    for (const record of presenceRecords) {
      if (record.roomId === args.roomId) {
        await ctx.db.delete(record._id);
      }
    }

    // Delete the room itself
    await ctx.db.delete(args.roomId);

    return {
      success: true,
      roomType: room.type,
      liveblocksRoomIdsToDelete,
    };
  },
});

// Get room count stats for a workspace
export const getRoomStats = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const hasMeetingRoom = rooms.some((room) => room.type === "conference");

    return { count: rooms.length, maxLimit: 10, hasMeetingRoom };
  },
});
