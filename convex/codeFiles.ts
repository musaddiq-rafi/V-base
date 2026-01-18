import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Maximum number of files allowed per room (applies to all file-producing rooms)
const MAX_FILES_PER_ROOM = 10;

/**
 * Create a new code file in a room
 * Enforces the 10-file limit per room
 */
export const createFile = mutation({
  args: {
    roomId: v.id("rooms"),
    workspaceId: v.id("workspaces"),
    name: v.string(),
    language: v.string(),
    parentId: v.optional(v.id("codeFiles")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check file limit (only count files, not folders)
    const existingFiles = await ctx.db
      .query("codeFiles")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const fileCount = existingFiles.filter((f) => f.type === "file").length;
    if (fileCount >= MAX_FILES_PER_ROOM) {
      throw new Error(
        `File limit reached (Max ${MAX_FILES_PER_ROOM} files per room)`
      );
    }

    // Verify parent folder exists if provided
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent || parent.type !== "folder") {
        throw new Error("Parent folder not found");
      }
    }

    const now = Date.now();
    const fileId = await ctx.db.insert("codeFiles", {
      roomId: args.roomId,
      workspaceId: args.workspaceId,
      name: args.name,
      type: "file",
      parentId: args.parentId,
      language: args.language,
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
    });

    const existingChannel = await ctx.db
      .query("channels")
      .withIndex("by_file", (q) =>
        q.eq("roomId", args.roomId).eq("fileId", fileId).eq("fileType", "code")
      )
      .first();

    if (!existingChannel) {
      await ctx.db.insert("channels", {
        workspaceId: args.workspaceId,
        name: `code-${fileId}`,
        type: "file",
        roomId: args.roomId,
        fileId: fileId,
        fileType: "code",
        createdAt: Date.now(),
        createdBy: identity.subject,
      });
    }

    return fileId;
  },
});

/**
 * Create a new folder in a room
 * No limit on folders
 */
export const createFolder = mutation({
  args: {
    roomId: v.id("rooms"),
    workspaceId: v.id("workspaces"),
    name: v.string(),
    parentId: v.optional(v.id("codeFiles")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify parent folder exists if provided
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent || parent.type !== "folder") {
        throw new Error("Parent folder not found");
      }
    }

    const now = Date.now();
    const folderId = await ctx.db.insert("codeFiles", {
      roomId: args.roomId,
      workspaceId: args.workspaceId,
      name: args.name,
      type: "folder",
      parentId: args.parentId,
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
    });

    return folderId;
  },
});

/**
 * Get files and folders for a specific parent (or root if parentId is undefined)
 * Returns folders first, then files, sorted alphabetically
 */
export const getFiles = query({
  args: {
    roomId: v.id("rooms"),
    parentId: v.optional(v.id("codeFiles")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get items at this level
    const items = await ctx.db
      .query("codeFiles")
      .withIndex("by_room_parent", (q) => {
        const query = q.eq("roomId", args.roomId);
        return args.parentId
          ? query.eq("parentId", args.parentId)
          : query.eq("parentId", undefined);
      })
      .collect();

    // Enrich with creator info
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const creator = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", item.createdBy))
          .first();

        return {
          ...item,
          creatorName: creator?.name || "Unknown",
        };
      })
    );

    // Sort: folders first, then files, alphabetically within each group
    return enrichedItems.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  },
});

/**
 * Get a specific file by ID
 */
export const getFileById = query({
  args: {
    fileId: v.id("codeFiles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      return null;
    }

    // Enrich with creator info
    const creator = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", file.createdBy))
      .first();

    let lastEditor = null;
    if (file.lastEditedBy && file.lastEditedBy !== file.createdBy) {
      lastEditor = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", file.lastEditedBy!))
        .first();
    }

    return {
      ...file,
      creatorName: creator?.name || "Unknown",
      lastEditorName: lastEditor?.name || null,
    };
  },
});

/**
 * Get file count for a room (used to show remaining quota)
 */
export const getFileCount = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("codeFiles")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const fileCount = items.filter((f) => f.type === "file").length;
    return {
      count: fileCount,
      limit: MAX_FILES_PER_ROOM,
      remaining: MAX_FILES_PER_ROOM - fileCount,
    };
  },
});

/**
 * Get breadcrumb path for a folder/file
 */
export const getBreadcrumbs = query({
  args: {
    itemId: v.optional(v.id("codeFiles")),
  },
  handler: async (ctx, args): Promise<Array<{ id: string; name: string }>> => {
    if (!args.itemId) {
      return [];
    }

    const breadcrumbs: Array<{ id: string; name: string }> = [];

    // First, get the initial item
    const firstItem = await ctx.db.get(args.itemId);
    if (!firstItem) return [];

    breadcrumbs.unshift({ id: firstItem._id, name: firstItem.name });
    let parentId = firstItem.parentId;

    // Walk up the tree (max 10 levels to prevent infinite loops)
    let depth = 0;
    while (parentId && depth < 10) {
      const parentItem = await ctx.db.get(parentId);
      if (!parentItem) break;

      breadcrumbs.unshift({ id: parentItem._id, name: parentItem.name });
      parentId = parentItem.parentId;
      depth++;
    }

    return breadcrumbs;
  },
});

/**
 * Rename a file or folder
 */
export const rename = mutation({
  args: {
    id: v.id("codeFiles"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new Error("Item not found");
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a file or folder
 * For folders: recursively deletes all contents
 * Returns list of file IDs that were deleted (for Liveblocks cleanup)
 */
export const deleteNode = mutation({
  args: {
    id: v.id("codeFiles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new Error("Item not found");
    }

    const deletedFileIds: string[] = [];

    // Helper function to recursively collect and delete items
    const deleteRecursively = async (itemId: Id<"codeFiles">) => {
      const currentItem = await ctx.db.get(itemId);
      if (!currentItem) return;

      // If it's a folder, first delete all children
      if (currentItem.type === "folder") {
        const children = await ctx.db
          .query("codeFiles")
          .withIndex("by_room_parent", (q) =>
            q.eq("roomId", currentItem.roomId).eq("parentId", itemId)
          )
          .collect();

        for (const child of children) {
          await deleteRecursively(child._id);
        }
      }

      // If it's a file, add to the list for Liveblocks cleanup
      if (currentItem.type === "file") {
        deletedFileIds.push(currentItem._id);
      }

      // Delete the item itself
      await ctx.db.delete(itemId);
    };

    await deleteRecursively(args.id);

    return { success: true, deletedFileIds };
  },
});

/**
 * Delete all code files for a room (used when deleting a room)
 * Returns list of file IDs that were deleted (for Liveblocks cleanup)
 */
export const deleteAllFilesForRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get all files in this room
    const allItems = await ctx.db
      .query("codeFiles")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const deletedFileIds: string[] = [];

    // Collect file IDs for Liveblocks cleanup
    for (const item of allItems) {
      if (item.type === "file") {
        deletedFileIds.push(item._id);
      }
    }

    // Delete all items
    for (const item of allItems) {
      await ctx.db.delete(item._id);
    }

    return { success: true, deletedFileIds };
  },
});

/**
 * Update last edited info (called periodically while editing)
 */
export const updateLastEdited = mutation({
  args: {
    fileId: v.id("codeFiles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.fileId, {
      lastEditedBy: identity.subject,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
