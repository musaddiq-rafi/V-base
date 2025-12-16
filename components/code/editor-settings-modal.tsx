"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Sun, Moon, Type } from "lucide-react";

export type EditorTheme = "dark" | "light";

interface EditorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: EditorTheme;
  onThemeChange: (theme: EditorTheme) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20, 22, 24];

export function EditorSettingsModal({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
}: EditorSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-[#252526] rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-[#3c3c3c]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3c3c3c]">
          <h2 className="text-lg font-semibold text-gray-200">
            Editor Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#3c3c3c] text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Theme Toggle */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Sun className="w-4 h-4" />
              Theme
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onThemeChange("dark")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                  theme === "dark"
                    ? "bg-[#1e1e1e] border-emerald-500 text-emerald-400"
                    : "bg-[#1e1e1e] border-[#3c3c3c] text-gray-400 hover:border-gray-500"
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
              <button
                onClick={() => onThemeChange("light")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                  theme === "light"
                    ? "bg-white border-emerald-500 text-emerald-600"
                    : "bg-[#1e1e1e] border-[#3c3c3c] text-gray-400 hover:border-gray-500"
                }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Type className="w-4 h-4" />
              Font Size
            </label>
            <div className="flex flex-wrap gap-2">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => onFontSizeChange(size)}
                  className={`px-3 py-1.5 rounded-md text-sm font-mono transition-all ${
                    fontSize === size
                      ? "bg-emerald-600 text-white"
                      : "bg-[#1e1e1e] text-gray-400 hover:bg-[#3c3c3c] border border-[#3c3c3c]"
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3c3c3c]">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
