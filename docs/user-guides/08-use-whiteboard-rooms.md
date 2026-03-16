# Use Whiteboard Rooms

This page explains how to create whiteboards, reopen existing boards, draw together in real time, and use AI diagram generation.

---

## Table Of Contents

1. [Start A New Whiteboard](#start-a-new-whiteboard)
2. [Find Open Or Delete Whiteboards](#find-open-or-delete-whiteboards)
3. [Draw And Collaborate On The Canvas](#draw-and-collaborate-on-the-canvas)
4. [Use AI Diagram Generation](#use-ai-diagram-generation)
5. [Understand Save Status](#understand-save-status)
6. [Common Issues](#common-issues)
7. [Related Guides](#related-guides)

---

## Start A New Whiteboard

Inside a whiteboard room, the top section helps you begin new work quickly.

To create a board:

1. Open the whiteboard room.
2. Find `Start a new whiteboard`.
3. Select `Blank`.

If the room has no boards yet, you may also see:

1. `No whiteboards yet`
2. `Create Whiteboard`

Both flows create a new board and open it for editing.

![Whiteboard room list showing the Start a new whiteboard section and Blank card.](../media/screenshots/whiteboard-01-start-new-whiteboard.png)
Caption: Use the Blank card to create a new whiteboard quickly.

![Creating and opening a new whiteboard from the room list.](../media/gifs/whiteboard-flow-01-create-and-open.gif)
Caption: Start from the room list, create a whiteboard, and open it on the canvas.

Placeholder media to capture during docs QA.

---

## Find Open Or Delete Whiteboards

The room also includes a `Recent whiteboards` section.

Use it to:

1. Browse existing boards
2. Search with `Search whiteboards...`
3. Sort between `Recent` and `Name`
4. Switch between grid and list layouts

To open a board:

1. Find it in the recent list.
2. Select the card or list row.

To delete a board:

1. Use the trash button on the board card or row.
2. Confirm the browser prompt that asks `Delete "<whiteboard name>"?`

Deleting removes the whiteboard from the room, so capture important content before removing it.

![Whiteboard room list showing search, sort, open, and delete actions.](../media/screenshots/whiteboard-02-search-sort-and-delete.png)
Caption: Search and sort help you find a board quickly, and the delete action is available directly on each board entry.

Placeholder media to capture during docs QA.

---

## Draw And Collaborate On The Canvas

When a whiteboard opens, the full canvas becomes your working area.

Use the canvas to:

1. Draw shapes and connectors
2. Add text and annotations
3. Move and resize items
4. Collaborate live with other people in the same board

Other users can appear as live collaborators with cursor indicators on the board.

If the board is still loading, you may briefly see `Loading whiteboard...`.

![Open whiteboard canvas showing drawing tools and live collaboration.](../media/screenshots/whiteboard-03-canvas-collaboration.png)
Caption: Whiteboards are full-canvas workspaces designed for real-time collaboration.

Placeholder media to capture during docs QA.

---

## Use AI Diagram Generation

Whiteboards include a floating AI action with the tooltip `Generate diagram with AI`.

To generate a diagram:

1. Open a whiteboard.
2. Select the sparkles button near the bottom-right corner.
3. In the `Generate Diagram` panel, describe the diagram you want.
4. Select `Generate` or press Enter.

The prompt box currently suggests examples like:

1. `user login flow`
2. `CI/CD pipeline`
3. `REST API lifecycle`

During generation, the action changes to `Drawing...`.

You can also use:

1. `Cancel`
2. The close button on the panel

After a successful request, the board shows the generated shapes directly on the canvas.

The panel note says: `Shapes appear live on canvas · Enter to generate`.

![Whiteboard AI panel showing Generate Diagram prompt and action buttons.](../media/screenshots/whiteboard-04-ai-diagram-panel.png)
Caption: Describe the process or system you want, then generate it directly onto the whiteboard.

![Generating a whiteboard diagram with AI.](../media/gifs/whiteboard-flow-02-generate-diagram.gif)
Caption: Open the AI panel, enter a prompt, and watch the diagram appear on the canvas.

Placeholder media to capture during docs QA.

---

## Understand Save Status

Whiteboards save automatically.

The bottom-left cloud indicator shows the current save state. Its tooltip can show:

1. `Auto-save enabled`
2. `Saving...`
3. `Saved`
4. `Save failed`

Use this indicator to confirm whether your latest changes have been stored.

If the board briefly shows `Saving...`, wait a moment before closing the page.

![Whiteboard canvas showing the save-status cloud indicator.](../media/screenshots/whiteboard-05-save-status-indicator.png)
Caption: The cloud status helps you confirm whether the whiteboard is currently saving or already saved.

Placeholder media to capture during docs QA.

---

## Common Issues

### I do not see my generated diagram immediately

Wait for the `Drawing...` state to finish. The generated shapes appear directly on the live canvas rather than in a separate preview.

### I am not sure whether my whiteboard was saved

Check the bottom-left cloud indicator and wait until it shows `Saved`.

### I cannot find an older board

Use `Search whiteboards...` and switch the sort between `Recent` and `Name`.

### I deleted the wrong whiteboard

Deletion is immediate after confirmation, so review the browser prompt carefully before accepting it.

---

## Related Guides

- [VBase User Guide](./README.md)
- [Create and Open Rooms](./04-create-and-open-rooms.md)
- [Use Workspace Chat](./05-use-workspace-chat.md)
