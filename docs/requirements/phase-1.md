# Phase 1 MVP

## 1. Project Overview & Context
**Goal:** Build the foundational infrastructure for VBase, a collaborative virtual workspace.
**Phase 1 Objective:** Deliver a functional authentication system, workspace management (creation/listing), and the basic Dashboard UI. No real-time rooms (editors/whiteboards) are included in this phase.

**Tech Stack:**
* **Frontend:** Next.js (App Router), Tailwind CSS.
* **Backend/DB:** Convex (Real-time database).
* **Auth:** Clerk (handling User Auth & Organizations).

---

## 2. Database Schema (Convex)
*File: `convex/schema.ts`*

The database must track users and link Workspaces to Clerk Organizations.

### Convex schema
```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Matches Clerk Organization ID
  workspaces: defineTable({
    clerkOrgId: v.string(),
    name: v.string(),
    ownerId: v.string(), // Clerk User ID
  }).index("by_clerk_org", ["clerkOrgId"]),

  // The dynamic rooms
  rooms: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    type: v.union(
      v.literal("document"),
      v.literal("code"),
      v.literal("whiteboard"),
      v.literal("conference")
    ),
    // Optional: Access control list (array of user IDs allowed in)
    // If empty, everyone in workspace can access
    allowedUserIds: v.optional(v.array(v.string())),
  }).index("by_workspace", ["workspaceId"]),

  // You might not need a separate users table if you rely purely on Clerk,
  // but it's usually good to sync them for app-specific data.
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
  }).index("by_clerk_id", ["clerkId"]),
});
```


---

## 3. Authentication & User Synchronization
**Requirement:** We must keep Clerk and Convex in sync.

1.  **Sign Up/Login:**
    * Use standard Clerk components (`<SignIn />`, `<SignUp />`).
    * Redirect to `/dashboard` upon success.
2.  **The Webhook (Crucial):**
    * **Trigger:** When a user is created in Clerk (`user.created`).
    * **Action:** A Clerk Webhook must trigger a Convex HTTP Action.
    * **Result:** Create a new entry in the Convex `users` table.
    * *Why:* We need the user in Convex to assign tasks and permissions later.

---

## 4. UI/UX Specifications

### A. Landing Page
* **Route:** `/`
* **Elements:**
    * **Hero Section:** App Name "VBase", Tagline, and a large "Get Started" button.
    * **Action:** "Get Started" button redirects to `/dashboard` (which triggers Clerk Login if not authenticated).
    * **Navbar:** Simple navbar with just the Logo and "Sign In" button.

### B. The Dashboard Layout (Shell)
* **Route:** `/dashboard` (Protected Route)
* **Layout Structure:**
    * **No** global Navbar or Footer.
    * **Left Sidebar (Fixed width):**
        * **Top:** VBase Logo (Clicking redirects to `/`).
        * **Middle:** Navigation Menu. Item 1: "Invitations" (Shows a badge if pending invites exist).
        * **Bottom:** (Optional) User Profile summary.
    * **Top Right (Floating or Header):**
        * Clerk `<UserButton />`.
    * **Main Content Area:** The remaining screen space.

### C. Dashboard Content ("My Workspaces")
* **Route:** `/dashboard/page.tsx`
* **Header:** Title "My Workspaces" + Button "Create Workspace".
* **Filter Toggle:** A simplified tab or toggle for `[All] | [Owned] | [Joined]`.
* **The Grid:**
    * Display a grid of Cards.
    * **Card UI:** Workspace Name, Role (Admin/Member), Member Count.
    * **Action:** Clicking a card redirects to `/workspace/[workspaceId]`.
* **Empty State:** If no workspaces exist, show a friendly illustration with a "Create your first workspace" button.

### D. The "Invitations" View
* **Route:** `/dashboard/invitations` (or a modal).
* **Logic:** Fetch pending Organization invitations from Clerk.
* **UI:** List of invites with "Accept" and "Reject" buttons.
* **Action:** Accepting an invite adds the user to the Clerk Org. The user should then immediately see that workspace in their Dashboard grid.

---

## 5. Functional Requirements (Backend Logic)

### A. Creating a Workspace
* **Trigger:** User clicks "Create Workspace" on Dashboard.
* **Flow:**
    1.  Open a Modal: Input "Workspace Name".
    2.  **Frontend:** Call Clerk API to create a new Organization using the name.
    3.  **Frontend:** Retrieve the new `orgId` from Clerk response.
    4.  **Convex:** Call a mutation `createWorkspace({ name, clerkOrgId })`.
    5.  **Redirect:** Auto-redirect to the new workspace page.

### B. The "HR Room" (Settings Page)
* **Route:** `/workspace/[workspaceId]/settings` (This is the default view for Phase 1 inside a workspace).
* **Content:**
    * **Members List:** Fetch list from Clerk (using `useOrganization` hook from Clerk).
    * **Invite Button:** Triggers Clerk's `<OrganizationProfile />` or a custom invite modal.
    * **Permissions:** Only Admins can see the "Invite" button.

---
