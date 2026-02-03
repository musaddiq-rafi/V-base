"use client";

import { motion } from "framer-motion";
import { Clock, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

interface KanbanCardProps {
  kanban: {
    _id: Id<"kanbans">;
    name: string;
    createdAt: number;
    updatedAt: number;
    creatorName: string;
    lastEditorName: string | null;
  };
  workspaceId: string;
  roomId: Id<"rooms">;
  viewMode: "grid" | "list";
}

export function KanbanCard({
  kanban,
  workspaceId,
  roomId,
  viewMode,
}: KanbanCardProps) {
  const router = useRouter();
  const deleteKanban = useMutation(api.kanban.deleteKanban);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${kanban.name}"?`)) return;

    setIsDeleting(true);
    try {
      await deleteKanban({ kanbanId: kanban._id });
    } catch (error) {
      console.error("Failed to delete kanban:", error);
      alert("Failed to delete kanban");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpen = () => {
    router.push(
      `/workspace/${workspaceId}/room/${roomId}/kanban/${kanban._id}`,
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
        onClick={handleOpen}
        className="group flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer transition-all"
      >
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg flex items-center justify-center">
          <div className="w-5 h-5 rounded bg-emerald-400/30" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate group-hover:text-emerald-300 transition-colors">
            {kanban.name}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {kanban.lastEditorName || kanban.creatorName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(kanban.updatedAt)}
            </span>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      onClick={handleOpen}
      className="group relative bg-white/5 border-2 border-white/10 rounded-xl p-5 cursor-pointer hover:border-emerald-400/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all"
    >
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all z-10 disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl flex items-center justify-center mb-4">
        <div className="w-6 h-6 rounded bg-emerald-400/40" />
      </div>

      <h3 className="font-semibold text-white truncate mb-2 group-hover:text-emerald-300 transition-colors">
        {kanban.name}
      </h3>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <User className="w-3 h-3" />
          <span className="truncate">
            {kanban.lastEditorName || kanban.creatorName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Clock className="w-3 h-3" />
          <span>{formatDate(kanban.updatedAt)}</span>
        </div>
      </div>

      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-emerald-500/10 transition-all pointer-events-none" />
    </motion.div>
  );
}
