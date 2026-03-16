"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface RenameOnExitModalProps {
  /** Current entity name (e.g. "Untitled document") */
  currentName: string;
  /** Prefix that marks a name as "untitled" (e.g. "Untitled document") */
  untitledPrefix: string;
  /** Async rename function — receives the new trimmed name */
  onRename: (newName: string) => Promise<void>;
  /** Accent color class for the Save button gradient (e.g. "from-sky-500 to-indigo-600") */
  accentGradient?: string;
  /** Accent ring color (e.g. "focus:ring-sky-500") */
  accentRing?: string;
  /** Label shown in the modal heading (e.g. "document", "whiteboard") */
  entityLabel?: string;
}

/**
 * Hook + Modal combo for prompting a rename when navigating away from an
 * untitled entity.  Returns:
 *  - `handleBackNavigation(url)` — call this instead of `router.push`
 *  - `RenameModal` — JSX element to render (renders nothing when closed)
 *  - `isUntitled` — whether the entity currently has an untitled name
 */
export function useRenameOnExit({
  currentName,
  untitledPrefix,
  onRename,
  accentGradient = "from-sky-500 to-indigo-600",
  accentRing = "focus:ring-sky-500",
  entityLabel = "file",
}: RenameOnExitModalProps) {
  const router = useRouter();

  const isUntitled =
    currentName.toLowerCase().startsWith(untitledPrefix.toLowerCase());

  const [showPrompt, setShowPrompt] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Browser beforeunload warning for untitled entities
  useEffect(() => {
    if (!isUntitled) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isUntitled]);

  // Focus input on open
  useEffect(() => {
    if (showPrompt && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [showPrompt]);

  const handleBackNavigation = useCallback(
    (url: string) => {
      if (isUntitled) {
        setRenameValue(currentName);
        setPendingNav(url);
        setShowPrompt(true);
      } else {
        router.push(url);
      }
    },
    [isUntitled, currentName, router],
  );

  const handleRenameAndNavigate = useCallback(async () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== currentName) {
      setIsRenaming(true);
      try {
        await onRename(trimmed);
      } catch (err) {
        console.error("Failed to rename:", err);
      } finally {
        setIsRenaming(false);
      }
    }
    setShowPrompt(false);
    if (pendingNav) router.push(pendingNav);
  }, [renameValue, currentName, onRename, pendingNav, router]);

  const handleSkip = useCallback(() => {
    setShowPrompt(false);
    if (pendingNav) router.push(pendingNav);
  }, [pendingNav, router]);

  const handleKeepEditing = useCallback(() => {
    setShowPrompt(false);
    setPendingNav(null);
  }, []);

  const RenameModal = showPrompt ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleKeepEditing}
      />
      <div className="relative bg-background-secondary border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Name your {entityLabel}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Give your {entityLabel} a name before leaving, or keep the default.
          </p>
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameAndNavigate();
              if (e.key === "Escape") handleKeepEditing();
            }}
            className={`w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent text-sm`}
            placeholder={`Enter ${entityLabel} name...`}
          />
        </div>
        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            onClick={handleKeepEditing}
            className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium text-sm"
          >
            Keep editing
          </button>
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors font-medium text-sm"
          >
            Skip
          </button>
          <button
            onClick={handleRenameAndNavigate}
            disabled={isRenaming}
            className={`flex-1 px-4 py-2 bg-gradient-to-r ${accentGradient} text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {isRenaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Save & Leave"
            )}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { handleBackNavigation, RenameModal, isUntitled };
}
