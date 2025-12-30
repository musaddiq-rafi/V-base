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
import {
  Play,
  Loader2,
  Settings,
  Copy,
  Check,
  Download,
  Circle,
  X,
} from "lucide-react";
import Link from "next/link";
import { Terminal } from "./terminal";
import { executeCode, LANGUAGE_VERSIONS } from "@/lib/piston";
import { EditorSettingsModal, EditorTheme } from "./editor-settings-modal";

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
  fileName: string;
  closeUrl: string;
}

// Language icon colors mapping
const languageColors: Record<string, string> = {
  javascript: "#f7df1e",
  typescript: "#3178c6",
  python: "#3776ab",
  java: "#ed8b00",
  c: "#555555",
  cpp: "#00599c",
};

export function CodeEditor({
  fileId,
  language,
  fileName,
  closeUrl,
}: CodeEditorProps) {
  const languageColor = languageColors[language] || "#6b7280";
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
  }, [
    element,
    room,
    userInfo,
    language,
    updateLastEditedDebounced,
    theme,
    fontSize,
  ]);

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

  // Copy code to clipboard
  const [copied, setCopied] = useState(false);
  const handleCopyCode = async () => {
    if (!editorViewRef.current) return;
    const code = editorViewRef.current.state.doc.toString();
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download code as file
  const handleDownload = () => {
    if (!editorViewRef.current) return;
    const code = editorViewRef.current.state.doc.toString();
    const extension =
      language === "javascript"
        ? "js"
        : language === "typescript"
          ? "ts"
          : language === "python"
            ? "py"
            : language === "java"
              ? "java"
              : language === "cpp"
                ? "cpp"
                : language === "c"
                  ? "c"
                  : "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full w-full flex flex-col relative bg-[#1e1e1e]">
      {/* Combined File Tab + Toolbar Bar */}
      <div className="shrink-0 h-9 flex items-center bg-[#252526] border-b border-[#3c3c3c]">
        {/* File Tab */}
        <div className="h-full flex items-center gap-2 px-3 bg-[#1e1e1e] border-t-2 border-t-emerald-500 text-gray-200 text-sm min-w-0 max-w-[200px]">
          <Circle
            className="w-3 h-3 shrink-0"
            fill={languageColor}
            stroke={languageColor}
          />
          <span className="truncate">{fileName}</span>
          <Link
            href={closeUrl}
            className="ml-auto p-0.5 hover:bg-[#3c3c3c] rounded opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1 px-3">
          {/* Sync Status */}
          {!synced ? (
            <div className="flex items-center gap-1.5 px-2 py-1 text-amber-500 text-xs">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              <span>Syncing</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 text-emerald-500 text-xs">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span className="opacity-70">Synced</span>
            </div>
          )}

          <div className="w-px h-4 bg-[#3c3c3c] mx-1" />

          {/* Copy Button */}
          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-500 hover:text-gray-300 transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-500 hover:text-gray-300 transition-colors"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-500 hover:text-gray-300 transition-colors"
            title="Editor Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Run Button */}
          {isExecutionSupported && (
            <>
              <div className="w-px h-4 bg-[#3c3c3c] mx-1" />
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                Run
              </button>
            </>
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
