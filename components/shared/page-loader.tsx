"use client";

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = "Loading..." }: PageLoaderProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Subtle background glow — matches the app's dark galaxy feel */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] rounded-full bg-gradient-radial from-sky-500/15 via-indigo-500/10 to-transparent blur-[100px]" />
        <div className="absolute bottom-[20%] left-[15%] w-[350px] h-[350px] rounded-full bg-gradient-radial from-indigo-500/10 via-purple-500/8 to-transparent blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-sky-500/30"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>

        {/* Animated ring spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative w-10 h-10"
        >
          <span className="absolute inset-0 rounded-full border-2 border-sky-500/20" />
          <span className="absolute inset-0 rounded-full border-2 border-t-sky-500 border-r-indigo-500 border-b-transparent border-l-transparent animate-spin" />
        </motion.div>

        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm font-medium text-muted-foreground"
        >
          {label}
        </motion.p>
      </div>
    </div>
  );
}

/** Inline variant for embedded loading states (inside a room/editor) */
export function InlineLoader({ label }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background gap-4">
      <div className="relative w-8 h-8">
        <span className="absolute inset-0 rounded-full border-2 border-sky-500/20" />
        <span className="absolute inset-0 rounded-full border-2 border-t-sky-500 border-r-indigo-500 border-b-transparent border-l-transparent animate-spin" />
      </div>
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
    </div>
  );
}
