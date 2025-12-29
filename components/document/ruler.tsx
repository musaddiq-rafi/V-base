"use client";

import { useRef, useState, useCallback } from "react";
import { FaCaretDown } from "react-icons/fa";

const DEFAULT_RULER_WIDTH = 794; // A4 width in pixels
const MARKER_WIDTH = 16;

interface RulerProps {
  leftMargin: number;
  rightMargin: number;
  onLeftMarginChange: (value: number) => void;
  onRightMarginChange: (value: number) => void;
  pageWidth?: number;
}

export function Ruler({
  leftMargin,
  rightMargin,
  onLeftMarginChange,
  onRightMarginChange,
  pageWidth = DEFAULT_RULER_WIDTH,
}: RulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!rulerRef.current) return;

      const rect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clampedX = Math.max(0, Math.min(pageWidth, x));

      if (isDraggingLeft) {
        // Left marker can't go past right marker minus some gap
        const maxLeft = pageWidth - rightMargin - 100;
        onLeftMarginChange(Math.min(clampedX, maxLeft));
      } else if (isDraggingRight) {
        // Right marker position is from the right edge
        const fromRight = pageWidth - clampedX;
        const maxRight = pageWidth - leftMargin - 100;
        onRightMarginChange(Math.min(fromRight, maxRight));
      }
    },
    [isDraggingLeft, isDraggingRight, leftMargin, rightMargin, onLeftMarginChange, onRightMarginChange, pageWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  }, []);

  const handleLeftMouseDown = () => {
    setIsDraggingLeft(true);
  };

  const handleRightMouseDown = () => {
    setIsDraggingRight(true);
  };

  // Generate tick marks
  const ticks = [];
  for (let i = 0; i <= pageWidth; i += 10) {
    const isMajor = i % 100 === 0;
    const isHalf = i % 50 === 0 && !isMajor;
    
    ticks.push(
      <div
        key={i}
        className="absolute bottom-0"
        style={{ left: i }}
      >
        <div
          className={`w-px bg-gray-500 ${
            isMajor ? "h-3" : isHalf ? "h-2" : "h-1"
          }`}
        />
        {isMajor && i > 0 && (
          <span
            className="absolute -translate-x-1/2 text-[10px] text-gray-600 select-none"
            style={{ top: -12 }}
          >
            {i / 100}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: `${pageWidth}px` }} className="mx-auto h-6 relative select-none print:hidden">
      {/* Ruler background */}
      <div
        ref={rulerRef}
        className="absolute inset-0 bg-[#F9FBFD] border-b border-gray-300"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Tick marks */}
        <div className="relative h-full">
          {ticks}
        </div>

        {/* Left margin marker */}
        <div
          className="absolute top-0 cursor-ew-resize z-10"
          style={{ left: leftMargin - MARKER_WIDTH / 2 }}
          onMouseDown={handleLeftMouseDown}
        >
          <FaCaretDown className="text-blue-500 w-4 h-4" />
        </div>

        {/* Right margin marker */}
        <div
          className="absolute top-0 cursor-ew-resize z-10"
          style={{ right: rightMargin - MARKER_WIDTH / 2 }}
          onMouseDown={handleRightMouseDown}
        >
          <FaCaretDown className="text-blue-500 w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
