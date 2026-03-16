import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new spreadsheet in a room
export const createSpreadsheet = mutation({
    args: {
        roomId: v.id("rooms"),
        workspaceId: v.id("workspaces"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const spreadsheetId = await ctx.db.insert("spreadsheets", {
            roomId: args.roomId,
            workspaceId: args.workspaceId,
            name: args.name,
            createdBy: identity.subject,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastEditedBy: identity.subject,
        });

        return spreadsheetId;
    },
});

// Get all spreadsheets in a room
export const getSpreadsheetsByRoom = query({
    args: {
        roomId: v.id("rooms"),
    },
    handler: async (ctx, args) => {
        const spreadsheets = await ctx.db
            .query("spreadsheets")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .collect();

        // Enrich with creator name (optional, but good for UI)
        const spreadsheetsWithDetails = await Promise.all(
            spreadsheets.map(async (sheet) => {
                const creator = await ctx.db
                    .query("users")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", sheet.createdBy))
                    .unique();

                // Fetch last editor if different
                let lastEditor = null;
                if (sheet.lastEditedBy && sheet.lastEditedBy !== sheet.createdBy) {
                    const lastEditedById = sheet.lastEditedBy;
                    lastEditor = await ctx.db
                        .query("users")
                        .withIndex("by_clerk_id", (q) => q.eq("clerkId", lastEditedById))
                        .unique();
                }

                return {
                    ...sheet,
                    creatorName: creator?.name || "Unknown",
                    lastEditorName: lastEditor?.name || creator?.name || "Unknown",
                };
            })
        );

        return spreadsheetsWithDetails;
    },
});

// Get a single spreadsheet by ID
export const getSpreadsheetById = query({
    args: {
        spreadsheetId: v.id("spreadsheets"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.spreadsheetId);
    },
});

// Create a spreadsheet instantly with a generated default name (Google Docs style)
export const createSpreadsheetQuick = mutation({
    args: {
        roomId: v.id("rooms"),
        workspaceId: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Count existing untitled spreadsheets in this room
        const existingSheets = await ctx.db
            .query("spreadsheets")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .collect();

        const existingUntitled = existingSheets.filter((s) =>
            s.name.startsWith("Untitled spreadsheet"),
        );

        const defaultName =
            existingUntitled.length === 0
                ? "Untitled spreadsheet"
                : `Untitled spreadsheet ${existingUntitled.length + 1}`;

        const now = Date.now();
        const spreadsheetId = await ctx.db.insert("spreadsheets", {
            roomId: args.roomId,
            workspaceId: args.workspaceId,
            name: defaultName,
            createdBy: identity.subject,
            createdAt: now,
            updatedAt: now,
            lastEditedBy: identity.subject,
        });

        return spreadsheetId;
    },
});

// Rename a spreadsheet
export const renameSpreadsheet = mutation({
    args: {
        spreadsheetId: v.id("spreadsheets"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        await ctx.db.patch(args.spreadsheetId, {
            name: args.name,
            updatedAt: Date.now(),
        });
    },
});

// Delete a spreadsheet
export const deleteSpreadsheet = mutation({
    args: {
        spreadsheetId: v.id("spreadsheets"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // 1. Find and delete the linked channel
        const linkedChannel = await ctx.db
            .query("channels")
            .withIndex("by_context", (q) =>
                q.eq("contextType", "spreadsheet").eq("contextId", args.spreadsheetId)
            )
            .unique();

        if (linkedChannel) {
            // Delete all messages
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_channel", (q) => q.eq("channelId", linkedChannel._id))
                .collect();

            for (const msg of messages) {
                await ctx.db.delete(msg._id);
            }

            // Delete lastRead records
            const readReceipts = await ctx.db
                .query("lastRead")
                .withIndex("by_channel", (q) => q.eq("channelId", linkedChannel._id))
                .collect();

            for (const receipt of readReceipts) {
                await ctx.db.delete(receipt._id);
            }

            await ctx.db.delete(linkedChannel._id);
        }

        // 2. Delete the spreadsheet
        await ctx.db.delete(args.spreadsheetId);

        return args.spreadsheetId;
    },
});
