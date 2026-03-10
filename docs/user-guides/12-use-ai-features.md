# Use AI Features

This page explains how to use the AI assistant tools available in Document Rooms, Code Rooms, and Whiteboard Rooms.

All AI features in VBase are powered by **Google Gemini 2.5 Flash** and work directly inside the room you are already in — no separate tool required.

---

## Table Of Contents

1. [AI Writing Tools In Document Rooms](#ai-writing-tools-in-document-rooms)
2. [AI Chat Sidebar In Code Rooms](#ai-chat-sidebar-in-code-rooms)
3. [AI Diagram Generator In Whiteboard Rooms](#ai-diagram-generator-in-whiteboard-rooms)
4. [Common Issues](#common-issues)
5. [Related Guides](#related-guides)

---

## AI Writing Tools In Document Rooms

The document editor includes a floating AI popover that transforms or generates text in-place.

### Open The AI Popover

1. Open a document inside a Document Room.
2. Select some text you want to improve.
3. The AI popover appears anchored near the selection.

If you want to generate completely new content without a selection, look for the **Generate** option — it does not require a selection.

### Available Actions

| Action | What It Does | Requires Selection |
|--------|--------------|--------------------|
| **Summarize** | Condenses the selection to about one-third of its length | ✅ |
| **Elaborate** | Expands the selection with more detail and examples | ✅ |
| **Fix Grammar** | Corrects grammar, spelling, and punctuation without changing meaning | ✅ |
| **Change Tone** | Rewrites the selection in a different voice | ✅ |
| **Generate** | Creates 2–4 paragraphs of new content from a free-text prompt | ❌ |

### Change Tone Options

When you select **Change Tone**, a submenu appears with four voice options:

- **Professional** — Clear, direct, business-appropriate language
- **Casual** — Relaxed and conversational
- **Formal** — Academic or official register
- **Friendly** — Warm and approachable

### Apply Or Discard The Result

After Gemini returns a result:

- Select **Replace** to overwrite your selected text with the AI output.
- Select **Insert Below** to add the AI output after the current cursor position.
- Select **Retry** to re-run the same action with a new result.

### Tips

- Selections longer than 3 000 characters are automatically trimmed before being sent to the AI. Very long selections may produce less precise results.
- If you are not happy with the result, use **Retry** before applying.

---

## AI Chat Sidebar In Code Rooms

The AI Chat Sidebar is available in every Code Room. It gives you a Gemini-powered assistant that has full context of the file you currently have open.

### Open The Sidebar

1. Open a Code Room and open or create a file.
2. Look for the **AI** button or panel toggle in the editor toolbar.
3. The sidebar opens on the right side of the editor.

### Choose A Mode

The sidebar has two modes toggled at the top:

| Mode | What It Does |
|------|--------------|
| **Ask** | Conversational Q&A. Responses appear as formatted Markdown with syntax-highlighted code. |
| **Agent** | You describe what you want. Gemini writes the code and **inserts it directly into your open file**. |

Use **Ask** mode when you want an explanation, a suggestion, or a discussion about your code.

Use **Agent** mode when you want Gemini to write or rewrite the code for you.

### Supported Languages

The AI assistant works with:

- JavaScript
- Python
- Java (class must be named `Main`)
- C
- C++

TypeScript is not supported because the code execution engines do not support it.

### Chat History

- Your conversation is saved automatically per file.
- If you close the room and come back later, your previous messages will still be there.
- Use the **Clear** button in the sidebar header to wipe the history for the current file.

### Tips

- The AI always sees the full content of the currently open file, so you can ask questions like "What does this function do?" without copying and pasting code.
- In **Agent** mode, describe the task as clearly as possible — for example: *"Write a function that sorts a list of integers using quicksort"*.
- After Agent mode writes code into your file, you can switch to Ask mode to ask follow-up questions about what it wrote.

---

## AI Diagram Generator In Whiteboard Rooms

The Whiteboard includes a diagram generator that turns a plain-English description into a flowchart rendered directly on the canvas.

### Generate A Diagram

1. Open a Whiteboard Room and open or create a whiteboard.
2. Click the **Generate with AI** button in the top-right toolbar.
3. Type a description of the diagram you want. For example:
   - *"User login flow with OAuth fallback"*
   - *"Order processing pipeline from cart to delivery"*
   - *"CI/CD pipeline for a web application"*
4. Confirm the prompt.
5. The diagram appears on the canvas with an animated step-by-step reveal.
6. The whiteboard saves automatically after the diagram is placed.

### How The Shapes Work

| Shape | Meaning |
|-------|---------|
| **Oval / Ellipse** | Start or End point |
| **Diamond** | Decision or branch |
| **Rectangle** | Process or action step |

### Tips

- The generator supports up to **14 nodes** per diagram to keep the result readable.
- New diagrams are placed below any existing content on the canvas so your previous work is not overwritten.
- After generation you can move, resize, and edit elements normally using Excalidraw tools.
- If the result is not what you expected, generate again with a more specific description.

---

## Common Issues

### The AI popover does not appear

- Make sure you have selected text before looking for the popover.
- Try clicking at the end of a word or sentence to set the cursor position, then select text again.

### The AI sidebar is not visible in the Code Room

- Confirm that you have a file open in the editor. The sidebar requires an active file.
- Try refreshing the page.

### The diagram generator does nothing after I submit

- Check that your workspace has the `GEMINI_API_KEY` environment variable configured (relevant if you are self-hosting).
- Try a shorter or simpler description first to confirm the feature is working, then iterate.

### The AI result looks wrong or off-topic

- For documents: use **Retry** for a different result, or refine your selection.
- For code: switch to **Ask** mode and ask Gemini to explain or correct what was written.
- For diagrams: re-run the generator with a more specific natural-language description.

---

## Related Guides

- [Use Document Rooms](./06-use-document-rooms.md)
- [Use Code Rooms](./07-use-code-rooms.md)
- [Use Whiteboard Rooms](./08-use-whiteboard-rooms.md)
