"use client";

import { useMemo } from "react";
import { computeDiff, DiffLine } from "@/lib/diff";
import { Check, X, Plus, Minus, Equal } from "lucide-react";
import { motion } from "framer-motion";

interface DiffReviewOverlayProps {
  originalCode: string;
  proposedCode: string;
  fileName: string;
  language: string;
  onKeep: () => void;
  onUndo: () => void;
}

/** Map language to a display label */
const LANG_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
};

export function DiffReviewOverlay({
  originalCode,
  proposedCode,
  fileName,
  language,
  onKeep,
  onUndo,
}: DiffReviewOverlayProps) {
  const diff = useMemo(
    () => computeDiff(originalCode, proposedCode),
    [originalCode, proposedCode],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-20 flex flex-col bg-[#1e1e1e]"
    >
      {/* Header bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-200">
            AI Proposed Changes
          </span>
          <span className="text-[10px] text-gray-500">
            {fileName} &middot; {LANG_LABELS[language] || language}
          </span>
        </div>

        {/* Stats badges */}
        <div className="flex items-center gap-2">
          {diff.addedCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <Plus className="w-3 h-3" />
              {diff.addedCount}
            </span>
          )}
          {diff.removedCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
              <Minus className="w-3 h-3" />
              {diff.removedCount}
            </span>
          )}
          {diff.unchangedCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-500/10 px-1.5 py-0.5 rounded">
              <Equal className="w-3 h-3" />
              {diff.unchangedCount}
            </span>
          )}
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto min-h-0 font-mono text-sm">
        <table className="w-full border-collapse">
          <tbody>
            {diff.lines.map((line, idx) => (
              <DiffRow key={idx} line={line} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom action bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-[#252526] border-t border-[#3c3c3c]">
        <p className="text-[11px] text-gray-500">
          Review the AI&apos;s proposed changes before applying
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-[#3c3c3c] hover:bg-[#4c4c4c] text-gray-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Undo
          </button>
          <button
            onClick={onKeep}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Keep
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ───────── Individual diff row ───────── */

function DiffRow({ line }: { line: DiffLine }) {
  const bgClass =
    line.type === "added"
      ? "bg-emerald-500/10"
      : line.type === "removed"
        ? "bg-red-500/10"
        : "";

  const textClass =
    line.type === "added"
      ? "text-emerald-300"
      : line.type === "removed"
        ? "text-red-300"
        : "text-gray-400";

  const gutterTextClass =
    line.type === "added"
      ? "text-emerald-600"
      : line.type === "removed"
        ? "text-red-600"
        : "text-gray-600";

  const indicator =
    line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";

  const indicatorClass =
    line.type === "added"
      ? "text-emerald-400"
      : line.type === "removed"
        ? "text-red-400"
        : "text-gray-700";

  return (
    <tr className={`${bgClass} hover:brightness-110 transition-[filter]`}>
      {/* Old line number */}
      <td
        className={`select-none w-12 text-right pr-2 pl-2 ${gutterTextClass} text-[11px] border-r border-[#3c3c3c]/50 align-top`}
      >
        {line.oldLineNumber ?? ""}
      </td>
      {/* New line number */}
      <td
        className={`select-none w-12 text-right pr-2 ${gutterTextClass} text-[11px] border-r border-[#3c3c3c]/50 align-top`}
      >
        {line.newLineNumber ?? ""}
      </td>
      {/* +/- indicator */}
      <td
        className={`select-none w-6 text-center font-bold text-xs ${indicatorClass} align-top`}
      >
        {indicator}
      </td>
      {/* Line content */}
      <td className={`pr-4 whitespace-pre ${textClass} text-[13px]`}>
        {line.content}
      </td>
    </tr>
  );
}
