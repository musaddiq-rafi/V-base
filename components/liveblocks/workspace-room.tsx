"use client";

import { ReactNode, Suspense } from "react";
import { RoomProvider } from "@liveblocks/react/suspense";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

interface WorkspaceRoomProps {
  workspaceId: string;
  workspaceName: string;
  children: ReactNode;
}

function LoadingFallback({ workspaceName }: { workspaceName: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Animated Logo */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>

        {/* Loading Text */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connecting to workspace
          </h2>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <span className="font-medium text-blue-600">{workspaceName}</span>
          </div>
        </div>

        {/* Spinner */}
        <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50 shadow-sm">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          <span className="text-sm text-gray-500">
            Setting up real-time collaboration...
          </span>
        </div>

        {/* Animated Dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-blue-500"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function WorkspaceRoom({
  workspaceId,
  workspaceName,
  children,
}: WorkspaceRoomProps) {
  // Room ID format: workspace:{orgId}
  const roomId = `workspace:${workspaceId}`;

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
      }}
    >
      <Suspense fallback={<LoadingFallback workspaceName={workspaceName} />}>
        {children}
      </Suspense>
    </RoomProvider>
  );
}
