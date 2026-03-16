# Use Document Rooms

This page explains how to create documents, open them, format content, use AI writing tools, and export or print your work.

---

## Table Of Contents

1. [Start A New Document](#start-a-new-document)
2. [Find And Open Documents](#find-and-open-documents)
3. [Rename A Document](#rename-a-document)
4. [Use The Toolbar](#use-the-toolbar)
5. [Use View Controls](#use-view-controls)
6. [Use AI Writing Tools](#use-ai-writing-tools)
7. [Save Export Or Print Your Work](#save-export-or-print-your-work)
8. [Common Issues](#common-issues)
9. [Related Guides](#related-guides)

---

## Start A New Document

Inside a document room, the top section is focused on starting new work.

To create a document:

1. Open the document room.
2. Find the `Start a new document` section.
3. Select the `Blank` card.

If the room is empty, you may also see:

1. `No documents yet`
2. `Create Document`

Both flows lead to creating a new document.

![Document list page showing the Start a new document section and Blank template.](../media/screenshots/documents-01-document-list-start-new.png)
Caption: Use the Blank template to create a new document quickly.

![Creating and opening a new document from the document list.](../media/gifs/documents-flow-01-create-and-open-document.gif)
Caption: Start from the document list, create a blank document, and open it for editing.

Placeholder media to capture during docs QA.

---

## Find And Open Documents

The document room also includes a `Recent documents` section.

Use it to:

1. Browse existing documents.
2. Search with `Search documents...`
3. Sort between `Recent` and `Name`
4. Switch between grid and list views

If no search results match, the page shows a no-results message instead of the normal document list.

![Document list page showing search, sort, and view controls.](../media/screenshots/documents-02-document-list-search-and-sort.png)
Caption: Search and sorting tools help you find the document you want faster.

Placeholder media to capture during docs QA.

---

## Rename A Document

Once a document is open, you can rename it from the document header.

To rename:

1. Open the document.
2. Select the document title in the header, or use `File` and then `Rename`.
3. Enter the new name.
4. Confirm by pressing Enter or clicking away.

Do not document rename as a document-card action in the list view. In the current interface, rename belongs to the open document header flow.

![Open document header showing the document title and File menu access.](../media/screenshots/documents-03-open-document-header.png)
Caption: Rename happens from the open document header, not from the document card list.

Placeholder media to capture during docs QA.

---

## Use The Toolbar

The document editor toolbar includes the main writing and formatting controls.

Common formatting actions include:

1. Bold
2. Italic
3. Underline
4. Strikethrough
5. Text color
6. Highlight
7. Alignment
8. Bullet lists
9. Numbered lists
10. Insert link
11. Insert image
12. Horizontal line
13. Clear formatting

The toolbar also includes heading, font, and size controls.

![Document editor toolbar showing formatting controls.](../media/screenshots/documents-05-toolbar-formatting.png)
Caption: The toolbar contains the main formatting tools for writing and editing.

Placeholder media to capture during docs QA.

---

## Use View Controls

The document header includes a `View` menu.

Visible controls include:

1. `Ruler`
2. `Page breaks`
3. `Page numbers`
4. `Full screen`
5. `Zoom`

Available zoom options include:

1. `50%`
2. `75%`
3. `100%`
4. `125%`
5. `150%`

Use these controls to change how the document is displayed while editing.

![Document View menu showing ruler, page breaks, page numbers, full screen, and zoom options.](../media/screenshots/documents-06-view-menu-controls.png)
Caption: The View menu controls the way the document is displayed while you work.

Placeholder media to capture during docs QA.

---

## Use AI Writing Tools

The editor includes an `AI Assistant`.

To use it:

1. Open the document.
2. Select text if your task needs a selection.
3. Select the `AI Assistant` button.
4. Choose one of the available actions.

Visible actions in the current UI:

1. `Summarize`
2. `Elaborate`
3. `Fix Grammar`
4. `Change Tone`
5. `Generate`

After the AI returns a result, the result panel can show:

1. `Replace`
2. `Insert Below`
3. `Retry`
4. `Discard`

Use `Generate` when you want to create fresh text from a prompt. Use the selection-based actions when you want to improve or transform existing text.

![AI Assistant action list showing available writing actions.](../media/screenshots/documents-07-ai-assistant-actions.png)
Caption: The AI Assistant gives you several ways to improve or generate content.

![AI Assistant result state showing Replace, Insert Below, Retry, and Discard.](../media/screenshots/documents-08-ai-result-actions.png)
Caption: Review the AI result before inserting or replacing text in the document.

![Using the AI Assistant in a document room.](../media/gifs/documents-flow-02-use-ai-assistant.gif)
Caption: Select text, choose an AI action, and apply the result back into the document.

Placeholder media to capture during docs QA.

---

## Save Export Or Print Your Work

The document header includes a `File` menu with export options.

Use `File` and then `Save` to export as:

1. `JSON`
2. `HTML`
3. `PDF`
4. `Text`

Important note: in the current UI, `PDF` uses the print flow rather than a separate PDF downloader.

You can also use `Print` directly from the header.

![Document File menu showing Save options for JSON, HTML, PDF, and Text.](../media/screenshots/documents-04-file-save-menu.png)
Caption: Use the File menu to export your document in the format you need.

Placeholder media to capture during docs QA.

Do not document these header items as working user actions in the guide:

1. `New Document` in the header file menu
2. `Remove` in the header file menu
3. The spelling and grammar check toolbar button

Those controls are visible, but they are not the reliable user-facing workflow to describe right now.

---

## Common Issues

### I selected an AI action and got an error about selecting text

Some AI actions require you to select text first.

### I expected PDF export to download directly

In the current UI, PDF export uses the print flow.

### I cannot find rename on the document card

Rename is documented from the open document header, not from the document list card.

### I expected a spelling and grammar check action

That button is visible in the toolbar, but it is not part of the reliable documented workflow right now.

---

## Related Guides

- [VBase User Guide](./README.md)
- [Create and Open Rooms](./04-create-and-open-rooms.md)
- [Use Workspace Chat](./05-use-workspace-chat.md)