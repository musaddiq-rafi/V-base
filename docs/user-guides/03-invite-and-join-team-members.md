# Invite and Join Team Members

This page covers both sides of team onboarding: how an admin invites members, and how invited users accept those invitations.

---

## Table Of Contents

1. [Who Can Invite Members](#who-can-invite-members)
2. [Invite A Teammate By Email](#invite-a-teammate-by-email)
3. [Manage Pending Invitations](#manage-pending-invitations)
4. [Open The Invitations Page](#open-the-invitations-page)
5. [Accept Or Decline An Invitation](#accept-or-decline-an-invitation)
6. [What Happens After Joining A Workspace](#what-happens-after-joining-a-workspace)
7. [Member And Invitation Limits](#member-and-invitation-limits)
8. [Common Issues](#common-issues)

---

## Who Can Invite Members

Workspace invitation access depends on your role.

In the current interface:

1. Admin users can open the invite page and send invitations.
2. Non-admin users may see an access-denied message instead of the invite form.

---

## Invite A Teammate By Email

If you are an admin:

1. Open your workspace.
2. Go to the workspace invite page.
3. Enter the teammate email address.
4. Choose a role such as `Member` or `Admin`.
5. Select `Send Invitation`.

![Workspace header with the Settings button used to access member management.](../media/screenshots/invites-01-workspace-settings-entry.png)
Caption: Start from the workspace header to manage members and invitations.

![Invite Members page with email input, role options, and Send Invitation button.](../media/screenshots/invites-02-invite-members-page.png)
Caption: Enter a teammate email, choose a role, and send the invitation.

![Invite Members page showing the invitation sent successfully message.](../media/screenshots/invites-03-invite-success-message.png)
Caption: After sending, a success message confirms that the invitation was created.

![Sending a workspace invitation from the Invite Members page.](../media/gifs/invites-flow-01-send-invitation.gif)
Caption: Workspace admins can invite a teammate in a few steps.

Placeholder media to capture during docs QA.

---

## Manage Pending Invitations

Pending invitations count toward workspace member capacity.

As an admin, keep these points in mind:

1. Pending invites still use space in the workspace member limit.
2. If the workspace is full, new invitations cannot be sent.
3. Review membership counts before inviting a large group.

---

## Open The Invitations Page

If someone invited you to a workspace:

1. Sign in to VBase.
2. Open the dashboard sidebar.
3. Select `Invitations`.

![Dashboard sidebar with the Invitations navigation link.](../media/screenshots/invites-04-invitations-sidebar-nav.png)
Caption: Invited users can open the Invitations page from the dashboard sidebar.

Placeholder media to capture during docs QA.

---

## Accept Or Decline An Invitation

On the Invitations page:

1. Review the workspace name.
2. Check the role shown in the invitation.
3. Select `Accept` to join the workspace.
4. If you do not want to join, use the decline option if appropriate in your workflow.

![Invitations page listing pending workspace invitations with Accept and Decline actions.](../media/screenshots/invites-05-invitations-page-list.png)
Caption: Each invitation shows the workspace name, role, date, and response actions.

![Accepting a workspace invitation from the Invitations page.](../media/gifs/invites-flow-02-accept-invitation.gif)
Caption: Invited users can review the invite and accept it from the dashboard.

Placeholder media to capture during docs QA.

---

## What Happens After Joining A Workspace

After you accept an invitation:

1. The invitation should disappear from the pending list.
2. The workspace becomes available from the dashboard.
3. You can open the workspace and start using its rooms based on your role.

---

## Member And Invitation Limits

Important limits to mention when onboarding a team:

1. A workspace can contain up to 10 members.
2. Pending invitations also count toward that limit.
3. Admin users can invite others and manage access.

---

## Common Issues

### I do not see an invitation

Check that you signed in with the same email address that received the invitation.

### I cannot send another invite

The workspace may have reached its member limit, including pending invites.

### I do not have permission to invite members

You may not be an admin in that workspace.

### There are no pending invitations

The Invitations page may show an empty state if no one has invited you.

![Invitations page showing no pending invitations.](../media/screenshots/invites-06-invitation-empty-state.png)
Caption: If no invitations are waiting, the page will show an empty state instead of a list.

Placeholder media to capture during docs QA.

---

## Related Guides

- [VBase User Guide](./README.md)
- [Getting Started with VBase](./01-getting-started.md)
- [Create and Manage Workspaces](./02-create-and-manage-workspaces.md)