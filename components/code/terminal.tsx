"use client";

import {
  Terminal as TerminalIcon,
  ChevronUp,
  ChevronDown,
  Loader2,
  GripHorizontal,
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
          className="absolute bottom-0 right-4 bg-gray-900 text-white px-4 py-2 rounded-t-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-800 transition-colors z-10"
        >
          <TerminalIcon className="w-4 h-4" />
          Console
          <ChevronUp className="w-4 h-4" />
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
            className="absolute bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-gray-700 shadow-2xl flex flex-col z-20"
          >
            {/* Resize Handle */}
            <div
              onMouseDown={handleMouseDown}
              className="absolute -top-1 left-0 right-0 h-2 cursor-ns-resize group flex items-center justify-center"
            >
              <div className="w-12 h-1 bg-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-gray-700">
              <div className="flex items-center gap-2 text-gray-300">
                <TerminalIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Output</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggle}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 font-mono text-sm">
              {isRunning ? (
                <div className="flex items-center gap-2 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running code...</span>
                </div>
              ) : output ? (
                <pre
                  className={`whitespace-pre-wrap ${isError ? "text-red-400" : "text-gray-300"}`}
                >
                  {output}
                </pre>
              ) : (
                <div className="text-gray-500 italic">
                  Run your code to see output here...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
