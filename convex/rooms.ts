import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
      v.literal("kanban")
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
        "This workspace has reached the maximum limit of 10 rooms. Please delete an existing room to create a new one."
      );
    }

    // Check if trying to create a conference room when one already exists
    if (args.type === "conference") {
      const existingConferenceRoom = existingRooms.find(
        (room) => room.type === "conference"
      );
      if (existingConferenceRoom) {
        throw new Error(
          "This workspace already has a meeting room. Only one meeting room is allowed per workspace."
        );
      }
    }

    // Create the room
    const roomId = await ctx.db.insert("rooms", {
      workspaceId: args.workspaceId,
      name: args.name,
      type: args.type,
    });

    return roomId;
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

    // Handle different room types
    if (room.type === "code") {
      // Delete all code files in this room and collect their IDs
      const codeFiles = await ctx.db
        .query("codeFiles")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();

      for (const file of codeFiles) {
        if (file.type === "file") {
          liveblocksRoomIdsToDelete.push(`code:${file._id}`);
        }
        await ctx.db.delete(file._id);
      }
    } else if (room.type === "document") {
      // Delete all documents in this room and collect their IDs
      const documents = await ctx.db
        .query("documents")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();

      for (const doc of documents) {
        liveblocksRoomIdsToDelete.push(`doc:${doc._id}`);
        await ctx.db.delete(doc._id);
      }
    } else if (room.type === "kanban") {
      // Delete all kanban boards in this room and collect their IDs
      const kanbanBoards = await ctx.db
        .query("kanbanBoards")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();

      for (const board of kanbanBoards) {
        liveblocksRoomIdsToDelete.push(`kanban:${board._id}`);
        await ctx.db.delete(board._id);
      }
    } else if (room.type === "whiteboard" || room.type === "conference") {
      // These room types have their own Liveblocks room
      liveblocksRoomIdsToDelete.push(`room:${args.roomId}`);
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
