import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Helper to get organization context from JWT
 * Your Clerk JWT template includes: org_id, org_role, org_slug
 */
async function getOrgContext(ctx: {
  auth: { getUserIdentity: () => Promise<any> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return {
    userId: identity.subject as string,
    orgId: (identity as any).org_id as string | undefined,
    orgRole: (identity as any).org_role as string | undefined,
    orgSlug: (identity as any).org_slug as string | undefined,
  };
}

// Create a new workspace linked to a Clerk Organization
export const createWorkspace = mutation({
  args: {
    name: v.string(),
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkId = identity.subject;

    // Check if workspace already exists for this Clerk Org
    const existingWorkspace = await ctx.db
      .query("workspaces")
      .withIndex("by_clerk_org", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();

    if (existingWorkspace) {
      return existingWorkspace._id;
    }

    // Check if user has reached the maximum workspace limit (5)
    const userWorkspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", clerkId))
      .collect();

    if (userWorkspaces.length >= 5) {
      throw new Error(
        "You have reached the maximum limit of 5 workspaces. Please delete an existing workspace to create a new one.",
      );
    }

    // Create workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      clerkOrgId: args.clerkOrgId,
      ownerId: clerkId,
    });

    // Automatically create a general channel for the workspace
    await ctx.db.insert("channels", {
      workspaceId: workspaceId,
      name: "general",
      type: "general",
      createdAt: Date.now(),
      createdBy: clerkId,
    });

    return workspaceId;
  },
});

// Get workspace by Clerk Organization ID
export const getWorkspaceByClerkOrgId = query({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workspaces")
      .withIndex("by_clerk_org", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();
  },
});

// Get count of workspaces owned by the current user
export const getOwnedWorkspaceCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { count: 0, maxLimit: 5 };
    }

    const clerkId = identity.subject;
    const userWorkspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", clerkId))
      .collect();

    return { count: userWorkspaces.length, maxLimit: 5 };
  },
});

// Get workspace by ID
export const getWorkspaceById = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workspaceId);
  },
});

// Update workspace name
export const updateWorkspace = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Only owner can update
    if (workspace.ownerId !== identity.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.workspaceId, {
      name: args.name,
    });

    return args.workspaceId;
  },
});

// Delete workspace
export const deleteWorkspace = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Only owner can delete
    if (workspace.ownerId !== identity.subject) {
      throw new Error("Not authorized");
    }

    // Delete all rooms in the workspace first
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    for (const room of rooms) {
      await ctx.db.delete(room._id);
    }

    await ctx.db.delete(args.workspaceId);
  },
});

/**
 * Check if current user has access to a workspace
 * Uses the org_id from JWT to verify membership
 */
export const checkWorkspaceAccess = query({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, args) => {
    const orgContext = await getOrgContext(ctx);
    if (!orgContext) {
      return { hasAccess: false, isAdmin: false };
    }

    // User has access if their current org matches the workspace org
    const hasAccess = orgContext.orgId === args.clerkOrgId;
    const isAdmin = hasAccess && orgContext.orgRole === "org:admin";

    return { hasAccess, isAdmin, orgRole: orgContext.orgRole };
  },
});

/**
 * Get current workspace based on user's active organization from JWT
 */
export const getCurrentWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const orgContext = await getOrgContext(ctx);
    if (!orgContext?.orgId) {
      return null;
    }

    return await ctx.db
      .query("workspaces")
      .withIndex("by_clerk_org", (q) => q.eq("clerkOrgId", orgContext.orgId!))
      .unique();
  },
});

// INTERNAL MUTATION: For the Webhook to create/update workspaces
export const upsertWorkspaceFromWebhook = internalMutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    ownerId: v.string(), // The clerkId of the creator
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_clerk_org", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { name: args.name });
      return existing._id;
    }

    return await ctx.db.insert("workspaces", {
      clerkOrgId: args.clerkOrgId,
      name: args.name,
      ownerId: args.ownerId,
    });
  },
});

// INTERNAL MUTATION: For the Webhook to delete workspaces (with cascading deletes)
// Returns Liveblocks room IDs that need to be deleted externally
export const deleteWorkspaceFromWebhook = internalMutation({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, args) => {
    console.log(
      `[Webhook] Deleting workspace data for Org: ${args.clerkOrgId}`,
    );

    // 1. Find the workspace
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_clerk_org", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();

    if (!workspace) {
      console.warn(`[Webhook] Workspace not found for Org: ${args.clerkOrgId}`);
      return { liveblocksRoomIds: [] };
    }

    const liveblocksRoomIds: string[] = [];

    // 2. Find and Delete All Channels & Related Data
    const channels = await ctx.db
      .query("channels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .collect();

    for (const channel of channels) {
      // A. Delete all messages in this channel
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
        .collect();

      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }

      // B. Delete read receipts (lastRead) for this channel
      const readReceipts = await ctx.db
        .query("lastRead")
        .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
        .collect();

      for (const receipt of readReceipts) {
        await ctx.db.delete(receipt._id);
      }

      // C. Delete the channel itself
      await ctx.db.delete(channel._id);
    }

    console.log(`[Webhook] Deleted ${channels.length} channels`);

    // 3. Find and Delete All Rooms and their contents
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .collect();

    for (const room of rooms) {
      // A. Delete all documents in document rooms
      const documents = await ctx.db
        .query("documents")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();

      for (const doc of documents) {
        // Collect Liveblocks room ID for documents
        liveblocksRoomIds.push(`doc:${doc._id}`);
        await ctx.db.delete(doc._id);
      }

      // B. Delete all code files in code rooms
      const codeFiles = await ctx.db
        .query("codeFiles")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();

      for (const file of codeFiles) {
        // Collect Liveblocks room ID for code files (only actual files, not folders)
        if (file.type === "file") {
          liveblocksRoomIds.push(`code:${file._id}`);
        }
        await ctx.db.delete(file._id);
      }

      // C. Delete all whiteboards in whiteboard rooms
      const whiteboards = await ctx.db
        .query("whiteboards")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();

      for (const whiteboard of whiteboards) {
        // Collect Liveblocks room ID for whiteboards
        liveblocksRoomIds.push(`whiteboard:${whiteboard._id}`);
        await ctx.db.delete(whiteboard._id);
      }

      // D. Delete all meetings in conference rooms
      const meetings = await ctx.db
        .query("meetings")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();

      for (const meeting of meetings) {
        await ctx.db.delete(meeting._id);
      }

      // E. Add the room itself to Liveblocks cleanup (for room presence)
      liveblocksRoomIds.push(`room:${room._id}`);

      // F. Delete the room itself
      await ctx.db.delete(room._id);
    }

    console.log(`[Webhook] Deleted ${rooms.length} rooms`);

    // 4. Finally, Delete the Workspace
    await ctx.db.delete(workspace._id);

    console.log(
      `[Webhook] Successfully deleted workspace and all children. Liveblocks rooms to delete: ${liveblocksRoomIds.length}`,
    );

    return { liveblocksRoomIds };
  },
});

// INTERNAL ACTION: Delete Liveblocks rooms (runs in Node.js environment)
// This is called after deleteWorkspaceFromWebhook to clean up Liveblocks
export const deleteLiveblocksRooms = internalAction({
  args: {
    roomIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.roomIds.length === 0) {
      console.log("[Liveblocks] No rooms to delete");
      return { deleted: 0, failed: 0 };
    }

    const LIVEBLOCKS_SECRET_KEY = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!LIVEBLOCKS_SECRET_KEY) {
      console.error("[Liveblocks] LIVEBLOCKS_SECRET_KEY not configured");
      return { deleted: 0, failed: args.roomIds.length, error: "No API key" };
    }

    console.log(`[Liveblocks] Deleting ${args.roomIds.length} rooms...`);

    let deleted = 0;
    let failed = 0;

    for (const roomId of args.roomIds) {
      try {
        const response = await fetch(
          `https://api.liveblocks.io/v2/rooms/${encodeURIComponent(roomId)}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${LIVEBLOCKS_SECRET_KEY}`,
            },
          },
        );

        if (response.ok || response.status === 404) {
          // 404 means room doesn't exist, which is fine
          deleted++;
          console.log(`[Liveblocks] Deleted room: ${roomId}`);
        } else {
          failed++;
          console.error(
            `[Liveblocks] Failed to delete room ${roomId}: ${response.status}`,
          );
        }
      } catch (error) {
        failed++;
        console.error(`[Liveblocks] Error deleting room ${roomId}:`, error);
      }
    }

    console.log(
      `[Liveblocks] Cleanup complete. Deleted: ${deleted}, Failed: ${failed}`,
    );
    return { deleted, failed };
  },
});

// INTERNAL ACTION: Complete workspace deletion with Liveblocks cleanup
// This is the main entry point called from http.ts webhook handler
export const deleteWorkspaceWithLiveblocks = internalAction({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, args) => {
    // Step 1: Delete all Convex data and get Liveblocks room IDs
    const result = await ctx.runMutation(
      internal.workspaces.deleteWorkspaceFromWebhook,
      {
        clerkOrgId: args.clerkOrgId,
      },
    );

    // Step 2: Delete Liveblocks rooms
    if (result.liveblocksRoomIds && result.liveblocksRoomIds.length > 0) {
      await ctx.runAction(internal.workspaces.deleteLiveblocksRooms, {
        roomIds: result.liveblocksRoomIds,
      });
    }

    return { success: true };
  },
});
