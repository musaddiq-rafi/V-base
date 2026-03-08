"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState, Text } from "@codemirror/state";
import { unifiedMergeView } from "@codemirror/merge";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

interface DiffReviewOverlayProps {
  originalCode: string;
  proposedCode: string;
  fileName: string;
  language: string;
  onKeep: () => void;
  onUndo: () => void;
}

const LANG_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
};

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

/**
 * VS Code-style diff overlay using CodeMirror's unified merge view.
 * Shows the proposed code as the document with deleted (original) lines
 * rendered inline — exactly like VS Code / GitHub inline diffs.
 */
export function DiffReviewOverlay({
  originalCode,
  proposedCode,
  fileName,
  language,
  onKeep,
  onUndo,
}: DiffReviewOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous view if any
    viewRef.current?.destroy();

    // Normalize line endings to prevent spurious diff artifacts
    const normOriginal = originalCode.replace(/\r\n/g, "\n");
    const normProposed = proposedCode.replace(/\r\n/g, "\n");

    const state = EditorState.create({
      doc: normProposed,
      extensions: [
        basicSetup,
        getLanguageExtension(language),
        vscodeDark,
        EditorView.editable.of(false),
        EditorState.readOnly.of(true),
        unifiedMergeView({
          original: Text.of(normOriginal.split("\n")),
          highlightChanges: false,
          syntaxHighlightDeletions: true,
          gutter: true,
        }),
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "13px",
          },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
          },
          /* ── Added / changed lines: solid green block background ── */
          ".cm-changedLine": {
            backgroundColor: "#2ea04330 !important",
          },
          /* ── Deleted chunks: solid red block background ── */
          ".cm-deletedChunk": {
            backgroundColor: "#f8514930 !important",
          },
          ".cm-deletedChunk del": {
            textDecoration: "none !important",
            color: "#f8a0a0 !important",
          },
          ".cm-deletedChunk .cm-deletedText": {
            textDecoration: "none !important",
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [originalCode, proposedCode, language]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-20 flex flex-col bg-[#1e1e1e]"
    >
      {/* Header bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-b-[#3c3c3c]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-200">
              Review AI Changes
            </span>
          </div>
          <span className="text-[10px] text-gray-500 bg-[#1e1e1e] px-2 py-0.5 rounded">
            {fileName} &middot; {LANG_LABELS[language] || language}
          </span>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="flex items-center gap-3 text-[10px] text-gray-600">
          <span>
            <kbd className="px-1 py-0.5 bg-[#3c3c3c] rounded text-gray-400 font-mono">
              Scroll
            </kbd>{" "}
            to review
          </span>
        </div>
      </div>

      {/* CodeMirror unified merge view */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden" />

      {/* Bottom action bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-[#252526] border-t border-t-[#3c3c3c]">
        <p className="text-[11px] text-gray-500">
          <span className="text-emerald-500">Green</span> = new code &middot;{" "}
          <span className="text-red-500">Red</span> = removed code
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md border border-[#555] hover:border-[#777] bg-transparent hover:bg-[#3c3c3c] text-gray-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Discard
          </button>
          <button
            onClick={onKeep}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            Accept
          </button>
        </div>
      </div>
    </motion.div>
  );
}
