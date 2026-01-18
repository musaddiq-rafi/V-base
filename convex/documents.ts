import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new document in a room
export const createDocument = mutation({
  args: {
    roomId: v.id("rooms"),
    workspaceId: v.id("workspaces"),
    name: v.string(),
    createdBy: v.string(), // Clerk User ID
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const documentId = await ctx.db.insert("documents", {
      roomId: args.roomId,
      workspaceId: args.workspaceId,
      name: args.name,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    const existingChannel = await ctx.db
      .query("channels")
      .withIndex("by_file", (q) =>
        q
          .eq("roomId", args.roomId)
          .eq("fileId", documentId)
          .eq("fileType", "document")
      )
      .first();

    if (!existingChannel) {
      await ctx.db.insert("channels", {
        workspaceId: args.workspaceId,
        name: `document-${documentId}`,
        type: "file",
        roomId: args.roomId,
        fileId: documentId,
        fileType: "document",
        createdAt: Date.now(),
        createdBy: args.createdBy,
      });
    }

    return documentId;
  },
});

// Get all documents for a room
export const getDocumentsByRoom = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Sort by updatedAt (most recent first)
    documents.sort((a, b) => b.updatedAt - a.updatedAt);

    // Enrich with user info
    const enrichedDocuments = await Promise.all(
      documents.map(async (doc) => {
        const creator = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", doc.createdBy))
          .first();

        let lastEditor = null;
        if (doc.lastEditedBy && doc.lastEditedBy !== doc.createdBy) {
          const lastEditedById = doc.lastEditedBy;
          lastEditor = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", lastEditedById))
            .first();
        }

        return {
          ...doc,
          creatorName: creator?.name || "Unknown",
          lastEditorName: lastEditor?.name || null,
        };
      })
    );

    return enrichedDocuments;
  },
});

// Get a specific document by ID
export const getDocumentById = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);

    if (!document) {
      return null;
    }

    // Enrich with user info
    const creator = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", document.createdBy))
      .first();

    let lastEditor = null;
    if (document.lastEditedBy && document.lastEditedBy !== document.createdBy) {
      const lastEditedById = document.lastEditedBy;
      lastEditor = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", lastEditedById))
        .first();
    }

    return {
      ...document,
      creatorName: creator?.name || "Unknown",
      lastEditorName: lastEditor?.name || null,
    };
  },
});

// Update document name
export const updateDocumentName = mutation({
  args: {
    documentId: v.id("documents"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      name: args.name,
      updatedAt: Date.now(),
    });
  },
});

// Delete a document
export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (document) {
      const channel = await ctx.db
        .query("channels")
        .withIndex("by_file", (q) =>
          q
            .eq("roomId", document.roomId)
            .eq("fileId", document._id)
            .eq("fileType", "document")
        )
        .first();

      if (channel) {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
          .collect();

        for (const message of messages) {
          await ctx.db.delete(message._id);
        }

        const lastRead = await ctx.db
          .query("lastRead")
          .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
          .collect();

        for (const entry of lastRead) {
          await ctx.db.delete(entry._id);
        }

        await ctx.db.delete(channel._id);
      }
    }

    await ctx.db.delete(args.documentId);
    return { success: true, deletedDocumentId: args.documentId };
  },
});

// Delete all documents for a room (used when deleting a room)
export const deleteAllDocumentsForRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get all documents in this room
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const deletedDocumentIds: string[] = [];

    // Delete all documents
    for (const doc of documents) {
      deletedDocumentIds.push(doc._id);
      const channel = await ctx.db
        .query("channels")
        .withIndex("by_file", (q) =>
          q.eq("roomId", doc.roomId).eq("fileId", doc._id).eq("fileType", "document")
        )
        .first();

      if (channel) {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
          .collect();

        for (const message of messages) {
          await ctx.db.delete(message._id);
        }

        const lastRead = await ctx.db
          .query("lastRead")
          .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
          .collect();

        for (const entry of lastRead) {
          await ctx.db.delete(entry._id);
        }

        await ctx.db.delete(channel._id);
      }
      await ctx.db.delete(doc._id);
    }

    return { success: true, deletedDocumentIds };
  },
});

// Update last edited info (called periodically while editing)
export const updateLastEdited = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(), // Clerk User ID
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      lastEditedBy: args.userId,
      updatedAt: Date.now(),
    });
  },
});
