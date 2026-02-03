"use client";

import { Id } from "@/convex/_generated/dataModel";
import { Clock, User, UserCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface KanbanBoardCardProps {
  board: {
    _id: Id<"kanbanBoards">;
    name: string;
    creatorName: string;
    lastEditorName: string | null;
    updatedAt: number;
  };
  onClick: () => void;
  index: number;
}

export function KanbanBoardCard({ board, onClick, index }: KanbanBoardCardProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? "Just now" : `${minutes}m ago`;
      }
      return `${hours}h ago`;
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group bg-surface rounded-xl border border-border p-5 hover:bg-surface-hover hover:border-pink-500/50 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground truncate group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors">
            {board.name}
          </h3>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {/* Creator */}
        <div className="flex items-center gap-1.5">
          <UserCircle2 className="w-3.5 h-3.5" />
          <span className="truncate">{board.creatorName}</span>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDate(board.updatedAt)}</span>
        </div>
      </div>

      {/* Last Editor */}
      {board.lastEditorName && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            <span className="truncate">Edited by {board.lastEditorName}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
