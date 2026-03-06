# Create and Open Rooms

This page explains how to create rooms, choose the right room type, open existing rooms, and safely remove rooms you no longer need.

---

## Table Of Contents

1. [What A Room Is](#what-a-room-is)
2. [Room Types In VBase](#room-types-in-vbase)
3. [Create A New Room](#create-a-new-room)
4. [Open An Existing Room](#open-an-existing-room)
5. [Understand Room Limits And Constraints](#understand-room-limits-and-constraints)
6. [Delete Or Clean Up A Room](#delete-or-clean-up-a-room)
7. [Common Issues](#common-issues)
8. [Related Guides](#related-guides)

---

## What A Room Is

A room is a workspace area built for a specific kind of collaboration.

Rooms help your team separate work by activity, such as:

1. Writing and editing documents.
2. Coding together.
3. Brainstorming on whiteboards.
4. Running meetings.
5. Tracking tasks or spreadsheet-style data.

On the workspace page, rooms appear in the `Rooms` section.

![Workspace room list overview showing the Rooms section and used room count.](../media/screenshots/rooms-01-room-list-overview.png)
Caption: The workspace page shows all available rooms in one place.

![Workspace page with the Create Room button highlighted.](../media/screenshots/rooms-02-create-room-button.png)
Caption: Use Create Room to add a new collaboration space.

Placeholder media to capture during docs QA.

---

## Room Types In VBase

When you open the `Create New Room` modal, VBase shows the available room types:

1. `Whiteboard`
2. `Document`
3. `Code`
4. `Spreadsheet`
5. `Meeting`
6. `Kanban`

Choose the room type based on the work you need to do:

1. Use `Whiteboard` for diagrams, sketches, and brainstorming.
2. Use `Document` for rich-text writing and collaborative notes.
3. Use `Code` for file-based coding and code execution.
4. Use `Spreadsheet` for structured data and formulas.
5. Use `Meeting` for video sessions.
6. Use `Kanban` for task tracking with cards and columns.

![Create New Room modal showing the room name field and room type grid.](../media/screenshots/rooms-03-create-room-modal.png)
Caption: The room modal lets you name the room and choose its type.

![Room type options showing Whiteboard, Document, Code, Spreadsheet, Meeting, and Kanban.](../media/screenshots/rooms-04-room-type-options.png)
Caption: Pick the room type that matches the task your team wants to do.

Placeholder media to capture during docs QA.

---

## Create A New Room

To create a room:

1. Open your workspace.
2. Go to the `Rooms` section.
3. Select `Create Room`.
4. In the `Create New Room` modal, enter a value in `Room Name`.
5. Select a room type.
6. Select `Create Room`.

If the workspace has no rooms yet, you can also use `Create First Room` from the empty state.

![Workspace empty state showing No rooms yet and the Create First Room button.](../media/screenshots/rooms-05-room-empty-state.png)
Caption: If no rooms exist yet, the empty state gives you a direct way to create the first one.

![Creating a new room from the workspace page.](../media/gifs/rooms-flow-01-create-room.gif)
Caption: Open the room modal, name the room, choose a type, and create it.

Placeholder media to capture during docs QA.

---

## Open An Existing Room

To open a room:

1. Go to the workspace page.
2. Find the room card in the `Rooms` section.
3. Select the room card.

Each room card shows:

1. The room name.
2. The room type.
3. A type icon.

Use room names that are easy for your team to recognize, such as project names, course names, or work areas.

---

## Understand Room Limits And Constraints

VBase applies a few room-level limits:

1. A workspace can have up to 10 rooms.
2. The `Rooms` header shows the current usage, such as `3/10 rooms used`.
3. When the workspace reaches the limit, the create button changes to `Limit Reached`.
4. Only 1 `Meeting` room is allowed per workspace.

If you select `Meeting` in the room modal, VBase shows a note explaining the meeting-room rule. If a meeting room already exists, the modal warns you and blocks creating another one.

---

## Delete Or Clean Up A Room

To remove a room:

1. Hover over the room card.
2. Open the menu from the three-dot button.
3. Choose `Delete`.
4. Review the `Delete Room` confirmation dialog.
5. Select `Delete` to confirm, or `Cancel` to stop.

Important: deleting a room removes the files, documents, and data inside it. The confirmation dialog also warns that this action cannot be undone.

![Delete Room confirmation dialog showing the warning message and actions.](../media/screenshots/rooms-06-delete-room-confirmation.png)
Caption: Always confirm the room name and warning before deleting a room.

![Deleting a room from the room card menu.](../media/gifs/rooms-flow-02-delete-room.gif)
Caption: Open the room menu, review the warning, and confirm the deletion only if you are sure.

Placeholder media to capture during docs QA.

---

## Common Issues

### I cannot create another room

The workspace may already be at the 10-room limit.

### The button says Limit Reached

That means the current limit is blocking the action. Check how many rooms already exist.

### I cannot create another meeting room

Each workspace can have only one `Meeting` room.

### I deleted the wrong room

Room deletion cannot be undone. Double-check the room name before confirming.

---

## Related Guides

- [VBase User Guide](./README.md)
- [Create and Manage Workspaces](./02-create-and-manage-workspaces.md)
- [Use Workspace Chat](./05-use-workspace-chat.md)
- [Use Document Rooms](./06-use-document-rooms.md)
- [Use Code Rooms](./07-use-code-rooms.md)
- [Use Whiteboard Rooms](./08-use-whiteboard-rooms.md)
- [Use Meeting Rooms](./09-use-meeting-rooms.md)
- [Use Spreadsheet Rooms](./10-use-spreadsheet-rooms.md)
- [Use Kanban Rooms](./11-use-kanban-rooms.md)