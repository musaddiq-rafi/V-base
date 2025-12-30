"use client";

import {
  Terminal as TerminalIcon,
  ChevronUp,
  ChevronDown,
  Loader2,
  X,
  Maximize2,
  Minimize2,
  Circle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useRef, useState, useEffect } from "react";

interface TerminalProps {
  isOpen: boolean;
  onToggle: () => void;
  output: string | null;
  isError: boolean;
  isRunning: boolean;
}

const MIN_HEIGHT = 100;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 256;

export function Terminal({
  isOpen,
  onToggle,
  output,
  isError,
  isRunning,
}: TerminalProps) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startY.current = e.clientY;
      startHeight.current = height;
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    },
    [height]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaY = startY.current - e.clientY;
      const newHeight = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, startHeight.current + deltaY)
      );
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <>
      {/* Toggle Button (Visible when closed) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="absolute bottom-0 left-4 bg-[#252526] border border-[#3c3c3c] border-b-0 text-gray-400 px-3 py-1.5 rounded-t-lg flex items-center gap-2 text-xs font-medium hover:text-white hover:bg-[#2d2d2d] transition-colors z-10"
        >
          <TerminalIcon className="w-3.5 h-3.5" />
          Terminal
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Terminal Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ height }}
            className="absolute bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-[#3c3c3c] shadow-2xl flex flex-col z-20"
          >
            {/* Resize Handle */}
            <div
              onMouseDown={handleMouseDown}
              className="absolute -top-0.5 left-0 right-0 h-1 cursor-ns-resize group hover:bg-emerald-500/50 transition-colors"
            />

            {/* Header - VS Code style */}
            <div className="flex items-center justify-between h-9 px-2 bg-[#252526] border-b border-[#3c3c3c]">
              <div className="flex items-center">
                {/* Terminal Tab */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] text-gray-300 text-xs font-medium border-t border-t-emerald-500 -mb-px">
                  <TerminalIcon className="w-3.5 h-3.5" />
                  Output
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={onToggle}
                  className="p-1.5 hover:bg-[#3c3c3c] rounded text-gray-500 hover:text-white transition-colors"
                  title="Close Terminal"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-3 font-mono text-sm bg-[#1e1e1e]">
              {isRunning ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  <span>Executing...</span>
                </div>
              ) : output ? (
                <pre
                  className={`whitespace-pre-wrap leading-relaxed ${isError ? "text-red-400" : "text-gray-300"}`}
                >
                  {output}
                </pre>
              ) : (
                <div className="text-gray-600 flex items-center gap-2">
                  <Circle className="w-2 h-2 fill-gray-600" />
                  Ready. Click Run to execute your code.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
