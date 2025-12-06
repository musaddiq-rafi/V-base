import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * JWT Token Fields from Clerk (as configured in JWT template):
 * - subject: Clerk User ID
 * - name: user.full_name
 * - email: user.primary_email_address
 * - org_id: org.id (current organization)
 * - org_role: org.role (admin/member)
 * - org_slug: org.slug
 */

// Called from client-side after Clerk auth
export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Extract fields from Clerk JWT
    const clerkId = identity.subject;
    const name = identity.name || "Anonymous";
    const email = identity.email || "";

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existingUser) {
      // Update user info if it has changed
      await ctx.db.patch(existingUser._id, {
        name,
        email,
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId,
      name,
      email,
    });

    return userId;
  },
});

// Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const clerkId = identity.subject;

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Internal mutation for webhook - create or update user
export const upsertUser = internalMutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
      });
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
    });
  },
});

// Internal mutation for webhook - delete user
export const deleteUser = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

/**
 * Get current user's organization context from JWT
 * Returns org_id, org_role, and org_slug from the Clerk JWT token
 */
export const getCurrentOrgContext = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // These custom claims come from your Clerk JWT template
    // They're available on the identity object
    const customClaims = identity as {
      subject: string;
      org_id?: string;
      org_role?: string;
      org_slug?: string;
    };

    return {
      userId: identity.subject,
      orgId: customClaims.org_id || null,
      orgRole: customClaims.org_role || null,
      orgSlug: customClaims.org_slug || null,
    };
  },
});
