"use client";

import { useRoom, useSelf } from "@liveblocks/react/suspense";
import Editor, { OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { MonacoBinding } from "y-monaco";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { editor } from "monaco-editor";
import { Awareness } from "y-protocols/awareness";

// User colors for cursor presence
const USER_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FFA07A", // Light Salmon
  "#98D8C8", // Mint
  "#F7DC6F", // Yellow
  "#BB8FCE", // Purple
  "#85C1E2", // Sky Blue
  "#F8B739", // Orange
  "#52B788", // Green
];

function getUserColor(connectionId: number): string {
  return USER_COLORS[connectionId % USER_COLORS.length];
}

// Map our language values to Monaco language IDs
const LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
  csharp: "csharp",
  go: "go",
  rust: "rust",
  ruby: "ruby",
  php: "php",
  swift: "swift",
  kotlin: "kotlin",
  html: "html",
  css: "css",
  json: "json",
  markdown: "markdown",
  sql: "sql",
  yaml: "yaml",
  shell: "shell",
};

interface CodeEditorProps {
  fileId: Id<"codeFiles">;
  language: string;
}

export function CodeEditor({ fileId, language }: CodeEditorProps) {
  const room = useRoom();
  const self = useSelf();
  const userInfo = useSelf((me) => me.info);
  const [editorRef, setEditorRef] =
    useState<editor.IStandaloneCodeEditor | null>(null);
  const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);
  const [synced, setSynced] = useState(false);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const updateLastEdited = useMutation(api.codeFiles.updateLastEdited);

  // Debounced update of last edited
  const lastUpdateRef = useRef<number>(0);
  const updateLastEditedDebounced = useCallback(() => {
    const now = Date.now();
    // Only update every 30 seconds to avoid too many writes
    if (now - lastUpdateRef.current > 30000) {
      lastUpdateRef.current = now;
      updateLastEdited({ fileId });
    }
  }, [fileId, updateLastEdited]);

  // Handle editor mount
  const handleEditorMount: OnMount = useCallback((editor) => {
    setEditorRef(editor);
  }, []);

  // Set up Yjs and Liveblocks provider
  useEffect(() => {
    if (!editorRef || !room) return;

    // Create Yjs document and Liveblocks provider
    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksYjsProvider(room, yDoc);
    setProvider(yProvider);

    // Get the shared text type
    const yText = yDoc.getText("monaco");

    // Set up sync status
    const handleSync = (isSynced: boolean) => {
      setSynced(isSynced);
    };

    yProvider.on("sync", handleSync);

    // Create Monaco binding with awareness
    const model = editorRef.getModel();
    if (model) {
      bindingRef.current = new MonacoBinding(
        yText,
        model,
        new Set([editorRef]),
        yProvider.awareness as unknown as Awareness
      );
    }

    // Track edits
    const disposable = editorRef.onDidChangeModelContent(() => {
      updateLastEditedDebounced();
    });

    return () => {
      disposable.dispose();
      bindingRef.current?.destroy();
      yProvider.off("sync", handleSync);
      yProvider.destroy();
      yDoc.destroy();
    };
  }, [editorRef, room, updateLastEditedDebounced]);

  // Track if awareness has been set up to avoid infinite loops
  const awarenessSetRef = useRef(false);

  // Set user awareness for cursor presence (only once when provider is ready)
  useEffect(() => {
    if (!provider || !userInfo || !self || awarenessSetRef.current) return;

    // Mark as set to prevent re-running
    awarenessSetRef.current = true;

    const awareness = provider.awareness as unknown as Awareness;
    const userColor = getUserColor(self.connectionId);
    awareness.setLocalStateField("user", {
      name: userInfo.name || "Anonymous",
      color: userColor,
      colorLight: userColor + "40", // 25% opacity for selection
    });
  }, [provider, userInfo, self]);

  // Reset awareness flag when provider changes
  useEffect(() => {
    if (!provider) {
      awarenessSetRef.current = false;
    }
  }, [provider]);

  // Get Monaco language from our language value
  const monacoLanguage = LANGUAGE_MAP[language] || "plaintext";

  return (
    <div className="h-full w-full relative">
      {/* Sync Status Indicator */}
      {!synced && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 text-sm rounded-full">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          Syncing...
        </div>
      )}
      {synced && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-full opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          Synced
        </div>
      )}

      {/* Monaco Editor */}
      <Editor
        height="100%"
        defaultLanguage={monacoLanguage}
        theme="vs-dark"
        onMount={handleEditorMount}
        options={{
          readOnly: false,
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: "on",
          wordWrap: "on",
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
          renderWhitespace: "selection",
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
            <div className="text-gray-400">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
}
