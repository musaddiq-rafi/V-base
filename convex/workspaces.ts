import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internalMutation } from "./_generated/server";

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

    // Create workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      clerkOrgId: args.clerkOrgId,
      ownerId: clerkId,
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

// INTERNAL MUTATION: For the Webhook to delete workspaces
export const deleteWorkspaceFromWebhook = internalMutation({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_clerk_org", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();

    if (workspace) {
        // Optional: Delete related rooms here if you want strict cleanup
        await ctx.db.delete(workspace._id);
    }
  },
});
