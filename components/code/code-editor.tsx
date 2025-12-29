"use client";

import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { useCallback, useEffect, useRef, useState } from "react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useRoom, useSelf } from "@liveblocks/react/suspense";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Play, Loader2, Settings } from "lucide-react";
import { Terminal } from "./terminal";
import { executeCode, LANGUAGE_VERSIONS } from "@/lib/piston";
import {
  EditorSettingsModal,
  EditorTheme,
} from "./editor-settings-modal";

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

// Generate a consistent color based on user name
function getUserColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

// Get CodeMirror language extension based on language string
function getLanguageExtension(language: string) {
  switch (language) {
    case "javascript":
      return javascript();
    case "typescript":
      return javascript({ typescript: true });
    case "python":
      return python();
    case "java":
      return java();
    case "c":
    case "cpp":
      return cpp();
    default:
      return javascript();
  }
}

interface CodeEditorProps {
  fileId: Id<"codeFiles">;
  language: string;
}

export function CodeEditor({ fileId, language }: CodeEditorProps) {
  const room = useRoom();
  const [element, setElement] = useState<HTMLElement>();
  const [synced, setSynced] = useState(false);
  const editorViewRef = useRef<EditorView | null>(null);

  // Get user info from Liveblocks authentication endpoint
  const userInfo = useSelf((me) => me.info);

  // Editor Settings State
  const [theme, setTheme] = useState<EditorTheme>("dark");
  const [fontSize, setFontSize] = useState(14);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // Check if language is supported for execution
  const isExecutionSupported = language in LANGUAGE_VERSIONS;

  const updateLastEdited = useMutation(api.codeFiles.updateLastEdited);

  // Debounced update of last edited
  const lastUpdateRef = useRef<number>(0);
  const updateLastEditedDebounced = useCallback(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current > 30000) {
      lastUpdateRef.current = now;
      updateLastEdited({ fileId });
    }
  }, [fileId, updateLastEdited]);

  // Ref callback for the editor container
  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    setElement(node);
  }, []);

  // Set up Liveblocks Yjs provider and attach CodeMirror editor
  useEffect(() => {
    if (!element || !room || !userInfo) {
      return;
    }

    // Get the singleton Yjs provider for this room
    const provider = getYjsProviderForRoom(room);
    const ydoc = provider.getYDoc();
    const ytext = ydoc.getText("codemirror");
    const undoManager = new Y.UndoManager(ytext);

    // Listen for sync status
    const handleSync = (isSynced: boolean) => {
      setSynced(isSynced);
    };
    provider.on("sync", handleSync);

    // Attach user info to Yjs awareness for cursor presence
    const userColor = getUserColor(userInfo.name || "Anonymous");
    provider.awareness.setLocalStateField("user", {
      name: userInfo.name || "Anonymous",
      color: userColor,
      colorLight: userColor + "80",
    });

    // Set up CodeMirror with extensions
    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        getLanguageExtension(language),
        theme === "dark" ? vscodeDark : vscodeLight,
        EditorView.lineWrapping,
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: `${fontSize}px`,
          },
          ".cm-scroller": {
            overflow: "auto",
          },
          ".cm-content": {
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
          },
          ".cm-gutters": {
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
          },
        }),
        yCollab(ytext, provider.awareness, { undoManager }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            updateLastEditedDebounced();
          }
        }),
      ],
    });

    // Attach CodeMirror to element
    const view = new EditorView({
      state,
      parent: element,
    });
    editorViewRef.current = view;

    return () => {
      provider.off("sync", handleSync);
      view?.destroy();
    };
  }, [element, room, userInfo, language, updateLastEditedDebounced, theme, fontSize]);

  // Handle Run Code
  const handleRun = async () => {
    if (!editorViewRef.current) return;

    setIsRunning(true);
    setIsTerminalOpen(true);
    setOutput(null);
    setIsError(false);

    try {
      const sourceCode = editorViewRef.current.state.doc.toString();
      const result = await executeCode(language, sourceCode);

      if (result.run.code !== 0) {
        setIsError(true);
      }

      setOutput(result.run.output);
    } catch (error: unknown) {
      setIsError(true);
      setOutput(
        error instanceof Error ? error.message : "Failed to execute code"
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col relative bg-[#1e1e1e]">
      {/* Editor Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="font-mono text-xs bg-[#3c3c3c] px-2 py-1 rounded uppercase">
            {language}
          </span>
          {!isExecutionSupported && (
            <span className="text-xs text-gray-500">
              (Execution not supported)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sync Status */}
          {!synced && (
            <div className="flex items-center gap-2 px-2 py-1 text-amber-500 text-xs">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Syncing...
            </div>
          )}
          {synced && (
            <div className="flex items-center gap-2 px-2 py-1 text-green-500 text-xs opacity-60">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Synced
            </div>
          )}

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-md hover:bg-[#3c3c3c] text-gray-400 hover:text-gray-200 transition-colors"
            title="Editor Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Run Button */}
          {isExecutionSupported && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              Run
            </button>
          )}
        </div>
      </div>

      {/* CodeMirror Editor Container */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        <div ref={ref} className="h-full w-full" />

        {/* Terminal Panel */}
        <Terminal
          isOpen={isTerminalOpen}
          onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
          output={output}
          isError={isError}
          isRunning={isRunning}
        />
      </div>

      {/* Settings Modal */}
      <EditorSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />
    </div>
  );
}
