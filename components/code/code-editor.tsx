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
  ChevronDown,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { Terminal } from "./terminal";
import { executeCode, LANGUAGE_VERSIONS } from "@/lib/piston";
import { executeCodeVBase, VBASE_LANGUAGE_VERSIONS } from "@/lib/vbase-rce";
import { EditorSettingsModal, EditorTheme } from "./editor-settings-modal";
import { AIChatSidebar } from "./ai-chat-sidebar";
import { DiffReviewOverlay } from "./diff-review-overlay";

// RCE Engine types
type RCEEngine = "piston" | "vbase";

const RCE_ENGINE_INFO: Record<
  RCEEngine,
  { label: string; description: string }
> = {
  piston: { label: "Piston", description: "Public API" },
  vbase: { label: "VBase RCE", description: "Custom Engine" },
};

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
  roomId: Id<"rooms">;
  workspaceId: Id<"workspaces">;
  language: string;
  fileName: string;
  closeUrl: string;
  /** If provided, called instead of standard Link navigation for the close button */
  onClose?: () => void;
  /** Called when user changes the language from the dropdown */
  onLanguageChange?: (language: string) => void;
}

// Supported languages for the picker
const SUPPORTED_LANGUAGES = [
  { value: "python", label: "Python", ext: ".py" },
  { value: "javascript", label: "JavaScript", ext: ".js" },
  { value: "java", label: "Java", ext: ".java" },
  { value: "cpp", label: "C++", ext: ".cpp" },
  { value: "c", label: "C", ext: ".c" },
];

// Language icon colors mapping
const languageColors: Record<string, string> = {
  javascript: "#f7df1e",
  python: "#3776ab",
  java: "#ed8b00",
  c: "#555555",
  cpp: "#00599c",
};

export function CodeEditor({
  fileId,
  roomId,
  workspaceId,
  language,
  fileName,
  closeUrl,
  onClose,
  onLanguageChange,
}: CodeEditorProps) {
  const languageColor = languageColors[language] || "#6b7280";
  const room = useRoom();
  const [element, setElement] = useState<HTMLElement>();
  const [synced, setSynced] = useState(false);
  const editorViewRef = useRef<EditorView | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);

  // Get user info from Liveblocks authentication endpoint
  const userInfo = useSelf((me) => me.info);

  // Editor Settings State
  const [theme, setTheme] = useState<EditorTheme>("dark");
  const [fontSize, setFontSize] = useState(14);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // RCE Engine State
  const [rceEngine, setRceEngine] = useState<RCEEngine>("vbase");
  const [isEngineDropdownOpen, setIsEngineDropdownOpen] = useState(false);

  // Language picker state
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.value === language) ||
    SUPPORTED_LANGUAGES[0];

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // Check if language is supported for execution (must be supported by both engines)
  const isExecutionSupported =
    language in LANGUAGE_VERSIONS && language in VBASE_LANGUAGE_VERSIONS;

  // AI Sidebar State
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);

  // Diff Review State
  const [pendingProposal, setPendingProposal] = useState<{
    originalCode: string;
    proposedCode: string;
  } | null>(null);

  const getEditorContent = useCallback(() => {
    return (
      ytextRef.current?.toString() ??
      editorViewRef.current?.state.doc.toString() ??
      ""
    );
  }, []);

  const setEditorContent = useCallback((code: string) => {
    const ytext = ytextRef.current;
    if (ytext && ytext.doc) {
      // Write directly to Y.Text CRDT to avoid merge artifacts from the
      // CodeMirror ↔ Yjs bridge. The yCollab extension will reactively
      // update the editor view.
      ytext.doc.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, code);
      });
    } else {
      // Fallback: direct CodeMirror dispatch (non-collaborative case)
      const view = editorViewRef.current;
      if (view) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: code },
        });
      }
    }
  }, []);

  /** Called by AI sidebar in agent mode — shows diff overlay instead of directly applying */
  const proposeEditorContent = useCallback((proposedCode: string) => {
    const originalCode = editorViewRef.current?.state.doc.toString() ?? "";
    setPendingProposal({ originalCode, proposedCode });
  }, []);

  const handleKeepProposal = useCallback(() => {
    if (pendingProposal) {
      setEditorContent(pendingProposal.proposedCode);
      setPendingProposal(null);
    }
  }, [pendingProposal, setEditorContent]);

  const handleUndoProposal = useCallback(() => {
    setPendingProposal(null);
  }, []);

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
    ytextRef.current = ytext;
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

      // Execute using selected RCE engine
      let result;
      if (rceEngine === "vbase") {
        result = await executeCodeVBase(language, sourceCode);
      } else {
        result = await executeCode(language, sourceCode);
      }

      if (result.run.code !== 0 && result.run.code !== null) {
        setIsError(true);
      }

      setOutput(result.run.output);
    } catch (error: unknown) {
      setIsError(true);
      setOutput(
        error instanceof Error ? error.message : "Failed to execute code",
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
          {onClose ? (
            <button
              onClick={onClose}
              className="ml-auto p-0.5 hover:bg-[#3c3c3c] rounded opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              href={closeUrl}
              className="ml-auto p-0.5 hover:bg-[#3c3c3c] rounded opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </Link>
          )}
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

          {/* Language Picker Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#3c3c3c] text-gray-300 text-xs font-medium rounded transition-colors"
              title="Change language"
            >
              <Circle
                className="w-2.5 h-2.5 shrink-0"
                fill={languageColor}
                stroke={languageColor}
              />
              <span>{currentLang.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {isLangDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsLangDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-44 bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-xl z-20 overflow-hidden">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        if (lang.value !== language) {
                          onLanguageChange?.(lang.value);
                        }
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-[#3c3c3c] transition-colors ${
                        language === lang.value
                          ? "bg-[#3c3c3c] text-emerald-400"
                          : "text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Circle
                          className="w-2.5 h-2.5 shrink-0"
                          fill={languageColors[lang.value] || "#6b7280"}
                          stroke={languageColors[lang.value] || "#6b7280"}
                        />
                        <span className="font-medium">{lang.label}</span>
                        <span className="text-gray-500">{lang.ext}</span>
                      </div>
                      {language === lang.value && (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

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

          {/* Run Button with RCE Engine Selector */}
          {isExecutionSupported && (
            <>
              <div className="w-px h-4 bg-[#3c3c3c] mx-1" />

              {/* RCE Engine Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsEngineDropdownOpen(!isEngineDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-1 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-gray-300 text-xs font-medium rounded-l border-r border-[#2c2c2c] transition-colors"
                  title="Select execution engine"
                >
                  <span>{RCE_ENGINE_INFO[rceEngine].label}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Dropdown Menu */}
                {isEngineDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsEngineDropdownOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-1 w-44 bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-xl z-20 overflow-hidden">
                      {(Object.keys(RCE_ENGINE_INFO) as RCEEngine[]).map(
                        (engine) => (
                          <button
                            key={engine}
                            onClick={() => {
                              setRceEngine(engine);
                              setIsEngineDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-[#3c3c3c] transition-colors ${
                              rceEngine === engine
                                ? "bg-[#3c3c3c] text-emerald-400"
                                : "text-gray-300"
                            }`}
                          >
                            <div>
                              <div className="font-medium">
                                {RCE_ENGINE_INFO[engine].label}
                              </div>
                              <div className="text-gray-500 text-[10px]">
                                {RCE_ENGINE_INFO[engine].description}
                              </div>
                            </div>
                            {rceEngine === engine && (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </button>
                        ),
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Run Button */}
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-r transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="w-px h-4 bg-[#3c3c3c] mx-1" />

          {/* AI Assistant Button */}
          <button
            onClick={() => setIsAISidebarOpen(!isAISidebarOpen)}
            className={`group/ai relative p-1.5 rounded-md transition-all duration-200 ${
              isAISidebarOpen
                ? "bg-gradient-to-r from-purple-500/25 to-pink-500/25 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                : "text-gray-500 hover:text-purple-300 hover:bg-purple-500/10 hover:shadow-[0_0_8px_rgba(168,85,247,0.15)]"
            }`}
            title="AI Assistant"
          >
            <Sparkles
              className={`w-4 h-4 transition-transform duration-300 ${
                isAISidebarOpen
                  ? "animate-[sparkle-spin_2s_ease-in-out_infinite]"
                  : "group-hover/ai:scale-110 group-hover/ai:rotate-12"
              }`}
            />
            {/* Glow dot */}
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full transition-opacity duration-300 ${
                isAISidebarOpen
                  ? "opacity-100 bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.6)] animate-pulse"
                  : "opacity-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* CodeMirror Editor Container + AI Sidebar */}
      <div className="flex-1 relative min-h-0 overflow-hidden flex">
        {/* Editor + Terminal */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <div ref={ref} className="flex-1 min-h-0 overflow-hidden" />

          {/* Terminal Panel */}
          <Terminal
            isOpen={isTerminalOpen}
            onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
            output={output}
            isError={isError}
            isRunning={isRunning}
          />

          {/* Diff Review Overlay — shown when AI proposes code */}
          <AnimatePresence>
            {pendingProposal && (
              <DiffReviewOverlay
                originalCode={pendingProposal.originalCode}
                proposedCode={pendingProposal.proposedCode}
                fileName={fileName}
                language={language}
                onKeep={handleKeepProposal}
                onUndo={handleUndoProposal}
              />
            )}
          </AnimatePresence>
        </div>

        {/* AI Chat Sidebar */}
        <AIChatSidebar
          isOpen={isAISidebarOpen}
          language={language}
          fileId={fileId}
          roomId={roomId}
          workspaceId={workspaceId}
          getEditorContent={getEditorContent}
          setEditorContent={setEditorContent}
          proposeEditorContent={proposeEditorContent}
          hasPendingProposal={!!pendingProposal}
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
