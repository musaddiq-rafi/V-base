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
    await ctx.db.delete(args.documentId);
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
