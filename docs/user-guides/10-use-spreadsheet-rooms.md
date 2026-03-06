# Use Spreadsheet Rooms

This page explains how to create spreadsheets, navigate the sheet interface, format cells, use formulas, and work with rows, columns, and zoom controls.

---

## Table Of Contents

1. [Start A New Spreadsheet](#start-a-new-spreadsheet)
2. [Find Open Or Delete Spreadsheets](#find-open-or-delete-spreadsheets)
3. [Understand The Spreadsheet Layout](#understand-the-spreadsheet-layout)
4. [Enter Data And Use The Formula Bar](#enter-data-and-use-the-formula-bar)
5. [Format Cells And Adjust View](#format-cells-and-adjust-view)
6. [Insert Or Delete Rows And Columns](#insert-or-delete-rows-and-columns)
7. [Read Save And Selection Status](#read-save-and-selection-status)
8. [Common Issues](#common-issues)
9. [Related Guides](#related-guides)

---

## Start A New Spreadsheet

Inside a spreadsheet room, the top section helps you start new work.

To create a spreadsheet:

1. Open the spreadsheet room.
2. Find `Start a new spreadsheet`.
3. Select the `Blank` card.

If the room is empty, you may also see:

1. `No spreadsheets yet`
2. `Create Spreadsheet`

Both paths create a new spreadsheet and open it immediately.

![Spreadsheet room list showing the Start a new spreadsheet section and Blank card.](../media/screenshots/spreadsheet-01-start-new-spreadsheet.png)
Caption: Use the Blank card to create a spreadsheet quickly from the room home page.

![Creating and opening a spreadsheet from the spreadsheet room list.](../media/gifs/spreadsheet-flow-01-create-and-open.gif)
Caption: Start from the spreadsheet list, create a sheet, and open it in the editor.

Placeholder media to capture during docs QA.

---

## Find Open Or Delete Spreadsheets

The room also includes a `Recent spreadsheets` section.

Use it to:

1. Browse recent sheets
2. Search with `Search spreadsheets...`
3. Sort between `Recent` and `Name`
4. Switch between grid and list views

To open a spreadsheet:

1. Select a sheet card or list row.

To delete a spreadsheet:

1. Open the sheet menu.
2. Select `Delete`.
3. Confirm the browser prompt asking if you want to delete the spreadsheet.

![Spreadsheet room list showing search, sort, view toggle, and delete actions.](../media/screenshots/spreadsheet-02-search-sort-and-delete.png)
Caption: Search and sorting help you find the right sheet fast, and deletion is available from each item menu.

Placeholder media to capture during docs QA.

---

## Understand The Spreadsheet Layout

When a spreadsheet opens, the editor is organized into several areas:

1. A top header with the file name and menus
2. A formatting toolbar
3. A formula bar
4. The grid itself
5. A bottom status bar

The header currently includes these menus:

1. `File`
2. `Edit`
3. `View`
4. `Insert`
5. `Format`

The right side of the header also shows active collaborators and sync state.

![Open spreadsheet showing the header, toolbar, formula bar, grid, and status bar.](../media/screenshots/spreadsheet-03-editor-layout.png)
Caption: The spreadsheet editor combines document-style menus with a grid-based editing workspace.

Placeholder media to capture during docs QA.

---

## Enter Data And Use The Formula Bar

To start editing:

1. Select a cell in the grid.
2. Type directly into the cell or use the formula bar.

When a cell is selected, the formula bar shows its reference, such as `A1`.

The input placeholder says `Type something or start with =`.

Use plain text or numbers for regular values.

Use `=` at the start when entering a formula.

The formula bar is especially useful when:

1. Editing long values
2. Reviewing formulas
3. Building range-based calculations

If you select multiple numeric cells, the status bar can show:

1. `Count`
2. `Min`
3. `Max`
4. `Avg`
5. `Sum`

![Spreadsheet formula bar showing an active cell label and editable formula input.](../media/screenshots/spreadsheet-04-formula-bar-and-cell-entry.png)
Caption: Select a cell first, then edit its value or formula from the formula bar.

Placeholder media to capture during docs QA.

---

## Format Cells And Adjust View

The toolbar gives you the main formatting controls for selected cells.

Current formatting actions include:

1. `Bold`
2. `Italic`
3. `Underline`
4. `Strikethrough`
5. `Text Color`
6. `Fill Color`
7. `Format as Currency`
8. `Format as Percent`
9. `Format as Number`
10. `Align Left`
11. `Align Center`
12. `Align Right`

The `View` menu in the header includes:

1. `Zoom In`
2. `Zoom Out`
3. `Reset Zoom`

Use these controls when you need to make data easier to read or present.

![Spreadsheet toolbar showing formatting and alignment controls.](../media/screenshots/spreadsheet-05-formatting-toolbar.png)
Caption: Use the toolbar to style selected cells and improve readability.

Placeholder media to capture during docs QA.

---

## Insert Or Delete Rows And Columns

The spreadsheet header includes structure actions in the menus.

Use the `Insert` menu for:

1. `Row Above`
2. `Row Below`
3. `Column Left`
4. `Column Right`

Use the `Edit` menu for:

1. `Delete Row`
2. `Delete Column`

These actions operate relative to the currently active cell, so select the correct cell first.

The header also shows `Undo` and `Redo` in the `Edit` menu.

![Spreadsheet header menus showing insert and delete actions for rows and columns.](../media/screenshots/spreadsheet-06-insert-delete-row-column.png)
Caption: Row and column changes are driven from the header menus and depend on the currently selected cell.

Placeholder media to capture during docs QA.

---

## Read Save And Selection Status

The spreadsheet header shows the collaboration state.

Current status labels include:

1. `Saved`
2. `Connecting...`

The bottom status bar appears when a multi-cell numeric selection is active and can show live calculations for the selected range.

Use the status areas to confirm both collaboration state and quick numeric summaries.

Important note: some visible spreadsheet header actions are not reliable end-user workflows yet and should not be treated as completed features in the guide.

Do not document these as dependable actions right now:

1. Renaming the spreadsheet title
2. `New Spreadsheet`
3. `Make a copy`
4. `Move to trash`
5. `Delete Spreadsheet` from the overflow menu

Those controls are visible, but the safer documented workflow today is create, open, edit, and delete from the spreadsheet list.

![Spreadsheet header showing save state and active collaborators, with a visible status bar below the grid.](../media/screenshots/spreadsheet-07-save-status-and-selection-stats.png)
Caption: Use the top and bottom status areas to confirm sync state and multi-cell calculations.

Placeholder media to capture during docs QA.

---

## Common Issues

### I cannot type into the formula bar

Select a cell first. The formula input is disabled until there is an active cell.

### My row or column changed in the wrong place

Insert and delete actions use the currently selected cell as the reference point.

### I expected rename from the title to work fully

The title is visible, but rename is not a reliable documented workflow yet.

### I do not see selection totals like Sum or Avg

Those values appear only when you select more than one numeric cell.

---

## Related Guides

- [VBase User Guide](./README.md)
- [Create and Open Rooms](./04-create-and-open-rooms.md)
- [Use Workspace Chat](./05-use-workspace-chat.md)
