"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Check,
  X,
  RotateCcw,
  FileText,
  Expand,
  PenLine,
  Languages,
  Wand2,
  ChevronRight,
} from "lucide-react";

type DocAiAction =
  | "summarize"
  | "elaborate"
  | "generate"
  | "fix-grammar"
  | "change-tone";

type ToneOption = "professional" | "casual" | "formal" | "friendly";

type PopoverState = "selecting-action" | "loading" | "result";

interface AiPopoverProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

const AI_ACTIONS = [
  { action: "summarize" as const, label: "Summarize", icon: FileText, needsSelection: true },
  { action: "elaborate" as const, label: "Elaborate", icon: Expand, needsSelection: true },
  { action: "fix-grammar" as const, label: "Fix Grammar", icon: PenLine, needsSelection: true },
  { action: "change-tone" as const, label: "Change Tone", icon: Languages, needsSelection: true },
  { action: "generate" as const, label: "Generate", icon: Wand2, needsSelection: false },
];

const TONE_OPTIONS: { value: ToneOption; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "friendly", label: "Friendly" },
];

export function AiPopover({ editor, isOpen, onClose }: AiPopoverProps) {
  const [state, setState] = useState<PopoverState>("selecting-action");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [showToneMenu, setShowToneMenu] = useState(false);
  const [showGenerateInput, setShowGenerateInput] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [lastAction, setLastAction] = useState<DocAiAction | null>(null);
  const [lastTone, setLastTone] = useState<ToneOption | undefined>();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [savedSelection, setSavedSelection] = useState<{ from: number; to: number } | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const generateInputRef = useRef<HTMLInputElement>(null);

  // Calculate position based on text selection or cursor
  const updatePosition = useCallback(() => {
    if (!editor || !editor.view) return;

    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    // Use the start of selection (or cursor pos) to anchor
    const anchorPos = hasSelection ? from : to;
    const coords = editor.view.coordsAtPos(anchorPos);

    // Get the editor container bounds
    const editorElement = editor.view.dom.closest(".min-h-screen");
    if (!editorElement) {
      setPosition({ top: coords.bottom + 8, left: coords.left });
      return;
    }

    const containerRect = editorElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Calculate relative position
    let top = coords.bottom - containerRect.top + 8;
    let left = coords.left - containerRect.left;

    // Clamp left so the popover doesn't overflow right edge
    left = Math.max(16, Math.min(left, containerRect.width - 340));

    // If near the bottom of viewport, position above selection
    if (coords.bottom + 300 > viewportHeight) {
      top = coords.top - containerRect.top - 8;
    }

    setPosition({ top, left });
  }, [editor]);

  // Save selection and update position when opened
  useEffect(() => {
    if (isOpen && editor) {
      const { from, to } = editor.state.selection;
      setSavedSelection({ from, to });
      updatePosition();
    }
  }, [isOpen, editor, updatePosition]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setState("selecting-action");
      setResult("");
      setError("");
      setShowToneMenu(false);
      setShowGenerateInput(false);
      setGeneratePrompt("");
      setLastAction(null);
      setLastTone(undefined);
      setSavedSelection(null);
    }
  }, [isOpen]);

  // Focus generate input when shown
  useEffect(() => {
    if (showGenerateInput && generateInputRef.current) {
      generateInputRef.current.focus();
    }
  }, [showGenerateInput]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay adding the listener to avoid immediate close from the trigger click
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleMouseDown);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isOpen, onClose]);

  const getSelectedText = useCallback((): string => {
    if (!editor || !savedSelection) return "";
    const { from, to } = savedSelection;
    if (from === to) return "";
    return editor.state.doc.textBetween(from, to, "\n");
  }, [editor, savedSelection]);

  const hasSelection = useCallback((): boolean => {
    if (!savedSelection) return false;
    return savedSelection.from !== savedSelection.to;
  }, [savedSelection]);

  const callAiApi = async (
    action: DocAiAction,
    tone?: ToneOption
  ) => {
    setState("loading");
    setError("");
    setLastAction(action);
    setLastTone(tone);

    const selectedText = getSelectedText();

    try {
      const requestBody: Record<string, string> = { action };

      if (action === "generate") {
        requestBody.customPrompt = generatePrompt;
      } else {
        requestBody.selectedText = selectedText;
      }

      if (action === "change-tone" && tone) {
        requestBody.tone = tone;
      }

      const response = await fetch("/api/generate-doc-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setState("result");
        return;
      }

      setResult(data.result);
      setState("result");
    } catch {
      setError("Failed to connect to AI service. Please try again.");
      setState("result");
    }
  };

  const handleActionClick = (action: DocAiAction) => {
    if (action === "change-tone") {
      setShowToneMenu(true);
      return;
    }

    if (action === "generate") {
      setShowGenerateInput(true);
      return;
    }

    if (!hasSelection()) {
      setError("Please select some text first.");
      setState("result");
      return;
    }

    callAiApi(action);
  };

  const handleToneSelect = (tone: ToneOption) => {
    if (!hasSelection()) {
      setError("Please select some text first.");
      setState("result");
      return;
    }
    setShowToneMenu(false);
    callAiApi("change-tone", tone);
  };

  const handleGenerateSubmit = () => {
    if (!generatePrompt.trim()) return;
    setShowGenerateInput(false);
    callAiApi("generate");
  };

  const handleReplace = () => {
    if (!editor || !savedSelection || !result) return;
    const { from, to } = savedSelection;

    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .deleteSelection()
      .insertContent(result)
      .run();

    onClose();
  };

  const handleInsertBelow = () => {
    if (!editor || !savedSelection || !result) return;
    const { to } = savedSelection;

    editor
      .chain()
      .focus()
      .setTextSelection(to)
      .insertContent("\n" + result)
      .run();

    onClose();
  };

  const handleRetry = () => {
    if (lastAction) {
      callAiApi(lastAction, lastTone);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute z-50"
          style={{ top: position.top, left: position.left }}
        >
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 w-[320px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  AI Assistant
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-0.5 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-neutral-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-2">
              {/* Action Selection */}
              {state === "selecting-action" && !showToneMenu && !showGenerateInput && (
                <div className="space-y-0.5">
                  {AI_ACTIONS.map(({ action, label, icon: Icon, needsSelection }) => (
                    <button
                      key={action}
                      onClick={() => handleActionClick(action)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors text-left
                        ${needsSelection && !hasSelection()
                          ? "text-neutral-400 dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{label}</span>
                      {action === "change-tone" && (
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                      )}
                      {needsSelection && !hasSelection() && (
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-600">
                          Select text
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Tone Sub-menu */}
              {state === "selecting-action" && showToneMenu && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => setShowToneMenu(false)}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                  >
                    <ChevronRight className="h-3 w-3 rotate-180" />
                    Back
                  </button>
                  <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 px-2.5 py-1">
                    Choose tone:
                  </div>
                  {TONE_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => handleToneSelect(value)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
                    >
                      <Languages className="h-4 w-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Generate Input */}
              {state === "selecting-action" && showGenerateInput && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowGenerateInput(false)}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                  >
                    <ChevronRight className="h-3 w-3 rotate-180" />
                    Back
                  </button>
                  <div className="px-1">
                    <input
                      ref={generateInputRef}
                      type="text"
                      value={generatePrompt}
                      onChange={(e) => setGeneratePrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleGenerateSubmit();
                      }}
                      placeholder="Describe what to generate..."
                      className="w-full px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-purple-400 dark:focus:ring-purple-500 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400"
                    />
                    <button
                      onClick={handleGenerateSubmit}
                      disabled={!generatePrompt.trim()}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      Generate
                    </button>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {state === "loading" && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600 dark:text-purple-400" />
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    Generating...
                  </span>
                </div>
              )}

              {/* Result State */}
              {state === "result" && (
                <div className="space-y-2">
                  {error ? (
                    <div className="px-2.5 py-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-md">
                      {error}
                    </div>
                  ) : (
                    <div className="max-h-[200px] overflow-y-auto px-2.5 py-2 text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/80 rounded-md leading-relaxed whitespace-pre-wrap">
                      {result}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 px-1">
                    {!error && result && (
                      <>
                        {hasSelection() && (
                          <button
                            onClick={handleReplace}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                          >
                            <Check className="h-3 w-3" />
                            Replace
                          </button>
                        )}
                        <button
                          onClick={handleInsertBelow}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 transition-colors"
                        >
                          Insert Below
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Retry"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Retry
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={onClose}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
