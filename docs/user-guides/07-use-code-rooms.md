# Use Code Rooms

This page explains how to create files and folders, edit code together, run supported languages, and use the built-in AI assistant in a code room.

---

## Table Of Contents

1. [Create Your First File Or Folder](#create-your-first-file-or-folder)
2. [Browse Open Rename Or Delete Items](#browse-open-rename-or-delete-items)
3. [Change Editor Language And Settings](#change-editor-language-and-settings)
4. [Run Code And Read Output](#run-code-and-read-output)
5. [Use The AI Assistant](#use-the-ai-assistant)
6. [Copy Or Download Your Code](#copy-or-download-your-code)
7. [Common Issues](#common-issues)
8. [Related Guides](#related-guides)

---

## Create Your First File Or Folder

When you open a code room, the left side shows the `Code Files` area.

If the room is empty, you may see:

1. `No files yet`
2. `Create Folder`
3. `Create First File`

You can also use the top actions:

1. `New Folder`
2. `New File`

To create a new file:

1. Select `New File` or `Create First File`.
2. Enter a `File Name`.
3. Choose a `Language`.
4. Select `Create File`.

Supported file languages in the current creation flow are:

1. `JavaScript (.js)`
2. `Python (.py)`
3. `Java (.java)`
4. `C++ (.cpp)`
5. `C (.c)`

To create a folder:

1. Select `New Folder` or `Create Folder`.
2. Enter a `Folder Name`.
3. Select `Create Folder`.

![Code room file explorer showing empty-state actions and top create buttons.](../media/screenshots/code-01-file-explorer-empty-state.png)
Caption: Start a code room by creating your first file or folder from the file explorer.

![Creating a file in a code room and choosing a language.](../media/gifs/code-flow-01-create-file.gif)
Caption: Create a file, choose the language, and open it in the editor.

Placeholder media to capture during docs QA.

---

## Browse Open Rename Or Delete Items

The file explorer supports folder navigation with breadcrumbs. The top level starts at `Root`.

To open an item:

1. Select a folder to move into it.
2. Select a file card to open it in the editor.

The explorer also shows your current usage as `{count} / {limit} files used`.

Each file or folder card includes a menu with:

1. `Rename`
2. `Delete`

To rename an item:

1. Open the item menu.
2. Select `Rename`.
3. Type the new name.
4. Press Enter or click away.

To delete an item:

1. Open the item menu.
2. Select `Delete`.
3. Wait for the item to disappear from the list.

Deleting a folder removes its nested contents too, so use that action carefully.

![Code room file explorer showing folders, files, breadcrumbs, and item menus.](../media/screenshots/code-02-file-explorer-navigation-and-menu.png)
Caption: Use breadcrumbs to move through folders and the item menu to rename or delete entries.

Placeholder media to capture during docs QA.

---

## Change Editor Language And Settings

When a file is open, the top editor bar shows the file tab and editor controls.

The status area shows one of these states:

1. `Syncing`
2. `Synced`

To change the file language:

1. Open the language picker in the top bar.
2. Choose one of the visible languages.

The current picker options are:

1. `Python`
2. `JavaScript`
3. `Java`
4. `C++`
5. `C`

To adjust editor settings:

1. Select the `Editor Settings` button.
2. Choose the editor `Theme`.
3. Choose a `Font Size`.
4. Select `Done`.

The settings panel currently includes:

1. `Dark`
2. `Light`
3. Font sizes from `12px` through `24px`

![Open code editor showing sync state, language picker, and settings.](../media/screenshots/code-03-editor-toolbar-language-and-settings.png)
Caption: The editor bar controls sync visibility, language selection, and editor settings.

Placeholder media to capture during docs QA.

---

## Run Code And Read Output

Supported executable languages can be run from the editor toolbar.

The run section includes:

1. An execution engine picker
2. A `Run` button

The current engines are:

1. `Piston` with the description `Public API`
2. `VBase RCE` with the description `Custom Engine`

To run code:

1. Open a supported file.
2. Choose the execution engine you want.
3. Select `Run`.
4. Review the terminal panel at the bottom.

While a program is running, the button shows a loading state. The terminal opens automatically so you can read the result.

Use the terminal area to check:

1. Standard output
2. Error output
3. Running state

![Code editor showing execution engine selection and the Run button.](../media/screenshots/code-04-run-toolbar-and-engine-picker.png)
Caption: Choose an engine first, then run the current file from the editor toolbar.

![Running code and reading the terminal output in a code room.](../media/gifs/code-flow-02-run-code-and-view-output.gif)
Caption: Run a file and review the output in the built-in terminal panel.

Placeholder media to capture during docs QA.

---

## Use The AI Assistant

Code rooms include an `AI Assistant` sidebar.

To open it:

1. Open a file.
2. Select the sparkles button with the `AI Assistant` tooltip.

The assistant has two modes:

1. `Ask`
2. `Agent`

Use `Ask` when you want explanations, debugging help, or suggestions in chat.

Use `Agent` when you want the assistant to generate code directly into the editor.

Helpful details in the current interface:

1. The header is `AI Assistant`
2. You can clear history with `Clear chat`
3. Empty-state prompts change by mode
4. Assistant replies can be copied with `Copy`

To use the assistant:

1. Open the sidebar.
2. Choose `Ask` or `Agent`.
3. Type your request.
4. Press Enter or use Send.

In `Agent` mode, generated code is placed directly in the editor.

![Code room AI Assistant showing Ask and Agent modes.](../media/screenshots/code-05-ai-assistant-modes.png)
Caption: Use Ask for help in chat and Agent for direct code generation into the editor.

![Using the AI Assistant to generate or explain code.](../media/gifs/code-flow-03-use-ai-assistant.gif)
Caption: Open the assistant, switch modes, and send a prompt based on the task you want to complete.

Placeholder media to capture during docs QA.

---

## Copy Or Download Your Code

The top editor bar also includes quick actions for saving your current work outside the room.

Use:

1. `Copy code`
2. `Download file`

`Copy code` places the current file content on your clipboard.

`Download file` saves the current editor content as a local file using the active language extension.

![Code editor showing copy and download actions.](../media/screenshots/code-06-copy-and-download-actions.png)
Caption: Use the top-bar quick actions to copy code or download the current file.

Placeholder media to capture during docs QA.

---

## Common Issues

### I do not see a Run button for my file

The run controls appear only for supported executable languages in the current code-room workflow.

### My AI result replaced the editor unexpectedly

That happens in `Agent` mode. Use `Ask` if you want chat-based guidance without directly replacing the editor content.

### I created a folder and now cannot see my file

Check the breadcrumb trail and go back toward `Root` if you navigated into a different folder.

### I expected rename or delete inside the open editor

Rename and delete are currently documented from the file card menu in the explorer.

---

## Related Guides

- [VBase User Guide](./README.md)
- [Create and Open Rooms](./04-create-and-open-rooms.md)
- [Use Workspace Chat](./05-use-workspace-chat.md)
