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
  isDark: boolean;
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
  isDark,
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
    [height],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaY = startY.current - e.clientY;
      const newHeight = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, startHeight.current + deltaY),
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
          className={`absolute bottom-0 left-4 ${isDark ? "bg-[#252526] border-t-[#3c3c3c] border-x-[#3c3c3c] text-gray-400 hover:text-white hover:bg-[#2d2d2d]" : "bg-[#f3f3f3] border-t-[#e0e0e0] border-x-[#e0e0e0] text-gray-500 hover:text-gray-900 hover:bg-[#e8e8e8]"} border-t border-x px-3 py-1.5 rounded-t-lg flex items-center gap-2 text-xs font-medium transition-colors z-10`}
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
            className={`absolute bottom-0 left-0 right-0 ${isDark ? "bg-[#1e1e1e] border-t border-t-[#3c3c3c]" : "bg-white border-t border-t-[#e0e0e0]"} shadow-2xl flex flex-col z-20`}
          >
            {/* Resize Handle */}
            <div
              onMouseDown={handleMouseDown}
              className="absolute -top-0.5 left-0 right-0 h-1 cursor-ns-resize group hover:bg-emerald-500/50 transition-colors"
            />

            {/* Header - VS Code style */}
            <div
              className={`flex items-center justify-between h-9 px-2 ${isDark ? "bg-[#252526] border-b border-b-[#3c3c3c]" : "bg-[#f3f3f3] border-b border-b-[#e0e0e0]"}`}
            >
              <div className="flex items-center">
                {/* Terminal Tab */}
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 ${isDark ? "bg-[#1e1e1e] text-gray-300" : "bg-white text-gray-700"} text-xs font-medium border-t border-t-emerald-500 -mb-px`}
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  Output
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={onToggle}
                  className={`p-1.5 ${isDark ? "hover:bg-[#3c3c3c] text-gray-500 hover:text-white" : "hover:bg-[#e0e0e0] text-gray-400 hover:text-gray-900"} rounded transition-colors`}
                  title="Close Terminal"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className={`flex-1 overflow-auto p-3 font-mono text-sm ${isDark ? "bg-[#1e1e1e]" : "bg-white"}`}
            >
              {isRunning ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  <span>Executing...</span>
                </div>
              ) : output ? (
                <pre
                  className={`whitespace-pre-wrap leading-relaxed ${isError ? "text-red-400" : isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  {output}
                </pre>
              ) : (
                <div
                  className={`flex items-center gap-2 ${isDark ? "text-gray-600" : "text-gray-400"}`}
                >
                  <Circle
                    className={`w-2 h-2 ${isDark ? "fill-gray-600" : "fill-gray-400"}`}
                  />
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
