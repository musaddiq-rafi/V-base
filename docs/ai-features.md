# VBase AI Features Documentation

A comprehensive reference covering every AI-powered feature in VBase — architecture, API routes, prompting strategy, data persistence, and component integration.

---

## Table of Contents

1. [Overview](#overview)
2. [AI Provider](#ai-provider)
3. [Feature Matrix](#feature-matrix)
4. [Code Room — AI Chat Sidebar](#code-room--ai-chat-sidebar)
5. [Document Room — AI Writing Tools](#document-room--ai-writing-tools)
6. [Whiteboard Room — AI Diagram Generator](#whiteboard-room--ai-diagram-generator)
7. [Backend — AI Chat Persistence (Convex)](#backend--ai-chat-persistence-convex)
8. [Authentication & Security](#authentication--security)
9. [Environment Variables](#environment-variables)
10. [File References](#file-references)

---

## Overview

VBase embeds AI assistance directly into three room types, eliminating the need to switch between a separate AI tool and the workspace:

- **Code Rooms** — Conversational AI assistant and agentic code writer powered by Gemini
- **Document Rooms** — In-line text transformation tools (summarise, elaborate, fix grammar, tone, generate)
- **Whiteboard Rooms** — Natural-language-to-diagram generator that renders onto the Excalidraw canvas

All AI features in VBase use **Google Gemini 2.5 Flash** via direct REST calls. No AI SDK is installed; requests are made with the standard `fetch` API to keep the bundle lean.

---

## AI Provider

| Property | Value |
|----------|-------|
| **Model** | `gemini-2.5-flash` |
| **Provider** | Google AI (Generative Language API) |
| **Endpoint** | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` |
| **Auth** | `GEMINI_API_KEY` server-side environment variable (never exposed to the client) |
| **SDK** | None — plain `fetch()` REST calls |

---

## Feature Matrix

| Feature | Room Type | API Route | Persisted | Model Temperature |
|---------|-----------|-----------|-----------|-------------------|
| AI Chat — Ask mode | Code | `POST /api/generate-code` | ✅ Convex (`aiChatMessages`) | `0.5` |
| AI Agent — write to editor | Code | `POST /api/generate-code` | ✅ Convex (`aiChatMessages`) | `0.2` |
| Summarize selection | Document | `POST /api/generate-doc-ai` | ❌ | `0.4` |
| Elaborate selection | Document | `POST /api/generate-doc-ai` | ❌ | `0.6` |
| Fix Grammar | Document | `POST /api/generate-doc-ai` | ❌ | `0.3` |
| Change Tone | Document | `POST /api/generate-doc-ai` | ❌ | `0.4` |
| Generate (free prompt) | Document | `POST /api/generate-doc-ai` | ❌ | `0.6` |
| AI Diagram Generator | Whiteboard | `POST /api/generate-diagram` | ✅ canvas auto-save | `0.2` |

---

## Code Room — AI Chat Sidebar

### Purpose

The AI Chat Sidebar lives inside every Code Room and gives developers a Gemini-powered assistant that has full context of the currently open file.

### Component

`components/code/ai-chat-sidebar.tsx`

### API Route

`app/api/generate-code/route.ts`

### Modes

The sidebar operates in two toggleable modes:

| Mode | Behaviour |
|------|-----------|
| **Ask** | Conversational Q&A. Responses are rendered as Markdown with syntax-highlighted code fences via `react-markdown` + `remark-gfm`. |
| **Agent** | Returns raw runnable code only. Strips any accidental markdown fences and **injects the code directly into the CodeMirror editor** via `setEditorContent()`. |

### Context Injection

Every request includes the current editor content (`currentCode` field in the request body), so Gemini always has visibility of what is already written.

### Chat History Persistence

- Each user and assistant message is saved to the Convex `aiChatMessages` table.
- History is scoped to the specific `fileId` so it survives page refreshes and re-opens.
- Users can clear history for a file using the **Clear** button in the sidebar header.

### System Prompt Constraints

- Supported languages: Python, JavaScript, Java, C++, C (TypeScript is intentionally excluded to match the code execution engines)
- Java responses must use `Main` as the class name
- Agent mode returns bare code only — no prose, no markdown fences

### Configuration

| Parameter | Ask Mode | Agent Mode |
|-----------|----------|------------|
| Temperature | `0.5` | `0.2` |
| Max output tokens | `8192` | `8192` |

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     Code Room (browser)                      │
│  ┌────────────────────────┐  ┌───────────────────────────┐   │
│  │   CodeMirror Editor    │  │    AI Chat Sidebar        │   │
│  │  (current file content)│◄─┤  Mode toggle: Ask/Agent   │   │
│  └────────────────────────┘  │  Message history (local)  │   │
│                              └───────────┬───────────────┘   │
└──────────────────────────────────────────┼───────────────────┘
                                           │ POST /api/generate-code
                                           ▼
                               ┌───────────────────────┐
                               │  Next.js API Route    │
                               │  (server-side)        │
                               └───────────┬───────────┘
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
         ┌─────────────────┐   ┌─────────────────────┐  ┌────────────────┐
         │  Gemini 2.5     │   │  Convex aiChat.ts   │  │  CodeMirror    │
         │  Flash (REST)   │   │  (save messages)    │  │  setContent()  │
         └─────────────────┘   └─────────────────────┘  └────────────────┘
```

---

## Document Room — AI Writing Tools

### Purpose

An AI popover anchored to the text selection cursor that transforms or generates document content in-place.

### Component

`components/document/ai-popover.tsx`

### API Route

`app/api/generate-doc-ai/route.ts`

### Available Actions

| Action | Requires Selection | Temperature | Description |
|--------|--------------------|-------------|-------------|
| **Summarize** | ✅ | `0.4` | Condenses selected text to approximately one-third of its original length |
| **Elaborate** | ✅ | `0.6` | Expands selected text to approximately twice the length with additional detail and examples |
| **Fix Grammar** | ✅ | `0.3` | Corrects grammar, spelling, and punctuation without changing meaning or tone |
| **Change Tone** | ✅ | `0.4` | Rewrites the selection in one of four tones: Professional, Casual, Formal, or Friendly |
| **Generate** | ❌ | `0.6` | Free-text prompt that generates 2–4 paragraphs of new content |

### Result Actions

After Gemini returns a result the user has two options:

- **Replace** — Overwrites the selected text range in the TipTap editor
- **Insert Below** — Appends the generated content after the current cursor position

A **Retry** button remembers the last action and tone for one-click re-generation.

### Input Truncation

Selected text is capped at **3 000 characters**. If the selection exceeds this limit, it is truncated and a `[Text truncated]` notice is appended to the prompt to inform the model.

### Configuration

| Parameter | Value |
|-----------|-------|
| Max output tokens | `4096` |

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                   Document Room (browser)                    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │           TipTap Editor (Liveblocks Yjs)             │    │
│  │                                                      │    │
│  │    [selected text] ──► AI Popover                    │    │
│  │                        ├── Summarize                 │    │
│  │                        ├── Elaborate                 │    │
│  │                        ├── Fix Grammar               │    │
│  │                        ├── Change Tone ──► submenu   │    │
│  │                        └── Generate (free prompt)    │    │
│  └──────────────────────────────┬───────────────────────┘    │
└─────────────────────────────────┼────────────────────────────┘
                                  │ POST /api/generate-doc-ai
                                  ▼
                      ┌───────────────────────┐
                      │  Next.js API Route    │
                      └───────────┬───────────┘
                                  ▼
                      ┌───────────────────────┐
                      │  Gemini 2.5 Flash     │
                      └───────────┬───────────┘
                                  │ result text
                          ┌───────┴───────┐
                          ▼               ▼
                       Replace       Insert Below
                    (TipTap range)  (TipTap cursor)
```

---

## Whiteboard Room — AI Diagram Generator

### Purpose

Converts a natural-language description into a structured flowchart rendered directly on the Excalidraw canvas.

### Component

`components/whiteboard/excalidraw-board.tsx`

### API Route

`app/api/generate-diagram/route.ts`

### User Flow

1. Click the **Generate with AI** button in the top-right toolbar of the whiteboard
2. Enter a description (e.g. *"User login flow with OAuth fallback"*)
3. Gemini returns a structured JSON payload
4. The client computes a layered DAG layout using a topological sort (Kahn's algorithm)
5. Nodes and arrows are stagger-animated onto the canvas (150 ms per node, 180 ms per arrow)
6. The viewport auto-scrolls and fits to the new content
7. The canvas auto-saves to Convex

### JSON Schema (Gemini output)

```json
{
  "title": "string",
  "nodes": [
    { "id": "string", "label": "string", "shape": "ellipse | diamond | rectangle" }
  ],
  "edges": [
    { "from": "string", "to": "string", "label": "string (optional)" }
  ]
}
```

### Shape Semantics

| Shape | Semantic |
|-------|----------|
| `ellipse` | Start / End (terminal) node |
| `diamond` | Decision / branch node |
| `rectangle` | Process / action node |

### Constraints

- Maximum **14 nodes** per generation to keep diagrams readable
- Temperature `0.2` for reliable JSON structure
- Max tokens `2048`

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                   Whiteboard Room (browser)                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Excalidraw Canvas                    [Generate w/ AI] │  │
│  │                                              │         │  │
│  │     ┌─────────────────────────────────────┐ │         │  │
│  │     │  Prompt modal (user types desc.)    │◄┘         │  │
│  │     └───────────────────┬─────────────────┘           │  │
│  └─────────────────────────┼───────────────────────────── ┘  │
└────────────────────────────┼─────────────────────────────────┘
                             │ POST /api/generate-diagram
                             ▼
                 ┌───────────────────────┐
                 │  Next.js API Route    │
                 └───────────┬───────────┘
                             ▼
                 ┌───────────────────────┐
                 │  Gemini 2.5 Flash     │
                 │  (JSON output mode)   │
                 └───────────┬───────────┘
                             │ { title, nodes[], edges[] }
                             ▼
                 ┌───────────────────────┐
                 │  Kahn's Topo-Sort     │
                 │  (layer assignment)   │
                 └───────────┬───────────┘
                             ▼
                 ┌───────────────────────┐
                 │  Stagger-animate onto │
                 │  Excalidraw canvas    │
                 └───────────┬───────────┘
                             ▼
                 ┌───────────────────────┐
                 │  Auto-save to Convex  │
                 └───────────────────────┘
```

---

## Backend — AI Chat Persistence (Convex)

### File

`convex/aiChat.ts`

### Table

`aiChatMessages` — indexed by `by_file`, `by_room`, and `by_workspace`.

### Operations

| Operation | Type | Description |
|-----------|------|-------------|
| `getMessages(fileId)` | Query | Load chat history for a specific code file |
| `saveMessage(fileId, role, content)` | Mutation | Persist a user or assistant turn |
| `clearMessages(fileId)` | Mutation | Wipe all messages for a file |
| `deleteMessagesForFile` | Internal Mutation | Cascading delete when a code file is deleted |
| `deleteMessagesForRoom` | Internal Mutation | Cascading delete when a code room is deleted |
| `deleteMessagesForWorkspace` | Internal Mutation | Cascading delete when a workspace is deleted |

### Data Model

```typescript
aiChatMessages: defineTable({
  fileId:    v.id("codeFiles"),
  roomId:    v.id("rooms"),
  workspaceId: v.id("workspaces"),
  role:      v.union(v.literal("user"), v.literal("assistant")),
  content:   v.string(),
  createdAt: v.number(),
})
  .index("by_file",      ["fileId"])
  .index("by_room",      ["roomId"])
  .index("by_workspace", ["workspaceId"])
```

---

## Authentication & Security

- The `GEMINI_API_KEY` is a **server-side only** environment variable. It is never sent to the browser or exposed in client bundles.
- All AI API routes (`/api/generate-code`, `/api/generate-doc-ai`, `/api/generate-diagram`) run inside Next.js **Route Handlers**, meaning they execute exclusively on the server.
- Input from users is passed directly in prompt strings. Those prompts are not used to construct shell commands or database queries, so injection risk is confined to prompt-injection against the AI model itself, which Gemini's safety filters help mitigate.

---

## Environment Variables

Add the following to `.env.local`:

```env
# Google Gemini (required for all AI features)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

> If `GEMINI_API_KEY` is missing or invalid, all three AI features will fail silently with an error response. The rest of VBase continues to function normally.

---

## File References

| File | Purpose |
|------|---------|
| `app/api/generate-code/route.ts` | Code AI Chat & Agent API route |
| `app/api/generate-doc-ai/route.ts` | Document AI writing tools API route |
| `app/api/generate-diagram/route.ts` | Whiteboard diagram generator API route |
| `components/code/ai-chat-sidebar.tsx` | Code room AI sidebar component |
| `components/document/ai-popover.tsx` | Document room AI popover component |
| `components/whiteboard/excalidraw-board.tsx` | Whiteboard board (includes diagram generation) |
| `convex/aiChat.ts` | Convex backend for AI chat persistence |
