# Use Kanban Rooms

This page explains how to create boards, switch between board and list views, add and organize tasks, edit task details, and manage columns.

---

## Table Of Contents

1. [Start A New Board](#start-a-new-board)
2. [Find Open Or Delete Boards](#find-open-or-delete-boards)
3. [Understand Board And List Views](#understand-board-and-list-views)
4. [Add Edit Or Delete Tasks](#add-edit-or-delete-tasks)
5. [Create Rename Or Delete Columns](#create-rename-or-delete-columns)
6. [Move Tasks Between Columns](#move-tasks-between-columns)
7. [Common Issues](#common-issues)
8. [Related Guides](#related-guides)

---

## Start A New Board

Inside a kanban room, the top section helps you create a board quickly.

To create a board:

1. Open the kanban room.
2. Find `Start a new board`.
3. Select the `Blank` card.

If the room is empty, you may also see:

1. `No boards yet`
2. `Create Board`

Both paths create a new kanban board and open it immediately.

![Kanban room list showing the Start a new board section and Blank card.](../media/screenshots/kanban-01-start-new-board.png)
Caption: Use the Blank card to create a new kanban board from the room home page.

![Creating and opening a kanban board from the board list.](../media/gifs/kanban-flow-01-create-and-open.gif)
Caption: Create a board from the room list and open it into the kanban workspace.

Placeholder media to capture during docs QA.

---

## Find Open Or Delete Boards

The room also includes a `Recent boards` section.

Use it to:

1. Browse existing boards
2. Search with `Search boards...`
3. Sort between `Recent` and `Name`
4. Switch between grid and list layouts

To open a board:

1. Select the board card or row.

To delete a board:

1. Use the trash action on the board item.
2. Confirm the browser prompt `Delete "<board name>"?`

![Kanban room list showing search, sort, view toggle, and board delete actions.](../media/screenshots/kanban-02-search-sort-and-delete.png)
Caption: Search and sort make it easier to locate the right board before you open it.

Placeholder media to capture during docs QA.

---

## Understand Board And List Views

When a board opens, you can switch between two working views at the top:

1. `Board`
2. `List`

The default kanban columns are:

1. `To do`
2. `In progress`
3. `Done`

Use `Board` when you want the classic kanban layout with columns and draggable cards.

Use `List` when you want a table-style overview of all tasks.

The list view table includes these columns:

1. `Task`
2. `Description`
3. `Column`
4. `Actions`

![Open kanban board showing the Board and List view toggle.](../media/screenshots/kanban-03-board-and-list-toggle.png)
Caption: Switch between the classic kanban layout and a compact table view depending on how you want to work.

Placeholder media to capture during docs QA.

---

## Add Edit Or Delete Tasks

You can add tasks in both views.

In board view:

1. Find a column.
2. Type into `Add a card`.
3. Select `Add Card`.

In list view:

1. Use the `Add New Task` section.
2. Enter `Task title`.
3. Choose a target column.
4. Select `Add Task`.

To edit a task:

1. Select the edit action with the `Edit card` tooltip.
2. Change `Title` or `Description`.
3. Select `Save`.

To delete a task:

1. Use the delete action with the `Delete card` tooltip.
2. Confirm the browser prompt `Delete this card?`

If a board has no tasks yet, list view shows: `No tasks yet. Use the form above to add your first task.`

![Kanban board showing Add a card in column view and the edit card dialog.](../media/screenshots/kanban-04-add-edit-delete-task.png)
Caption: Add tasks inline, then open the edit dialog when you need to change titles or descriptions.

![Adding a task and editing its details in a kanban board.](../media/gifs/kanban-flow-02-add-and-edit-task.gif)
Caption: Add a task, open the edit dialog, and save task details back into the board.

Placeholder media to capture during docs QA.

---

## Create Rename Or Delete Columns

Board view also supports custom columns.

To create a new column:

1. Find the `New column` panel.
2. Enter a `Column title`.
3. Select `Add Column`.

To rename a column:

1. Select the column title input.
2. Type the new name.
3. Click away to apply the change.

To delete a column:

1. Use the `Delete column` action.
2. Confirm the browser prompt `Delete this column and its cards?`

Deleting a column also deletes the cards inside it, so treat that action as destructive.

![Kanban board showing the New column panel and column header actions.](../media/screenshots/kanban-05-column-management.png)
Caption: Use the New column panel for expansion and the column header tools for maintenance.

Placeholder media to capture during docs QA.

---

## Move Tasks Between Columns

In board view, cards can be dragged between columns.

Use the drag handle with the `Drag` tooltip on a card to move it.

You can:

1. Reorder cards within a column
2. Move cards into a different column

Drag-and-drop is the main task-status workflow in the kanban board.

![Kanban board showing card drag handles and cross-column movement.](../media/screenshots/kanban-06-drag-and-drop-cards.png)
Caption: Drag cards within a column or across columns to reflect task progress.

![Dragging a task from To do to In progress.](../media/gifs/kanban-flow-03-drag-task-between-columns.gif)
Caption: Move tasks visually between columns to update their working state.

Placeholder media to capture during docs QA.

---

## Common Issues

### I added a task but it went to the wrong place

In list view, check the selected column before using `Add Task`. In board view, confirm which column you are typing into.

### I deleted a column and lost several tasks

Column deletion also removes the cards inside that column.

### I cannot find task descriptions from board view

Open the edit dialog with `Edit card`, or switch to `List` for a table overview that includes descriptions.

### I want to reorganize tasks quickly

Switch to `Board` view and use drag-and-drop between columns.

---

## Related Guides

- [VBase User Guide](./README.md)
- [Create and Open Rooms](./04-create-and-open-rooms.md)
- [Use Workspace Chat](./05-use-workspace-chat.md)
