"use client";

import { motion } from "framer-motion";
import { FileText, Trash2, Clock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

interface WhiteboardCardProps {
  whiteboard: {
    _id: Id<"whiteboards">;
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

export function WhiteboardCard({
  whiteboard,
  workspaceId,
  roomId,
  viewMode,
}: WhiteboardCardProps) {
  const router = useRouter();
  const deleteWhiteboard = useMutation(api.whiteboards.deleteWhiteboard);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${whiteboard.name}"?`)) return;

    setIsDeleting(true);
    try {
      await deleteWhiteboard({ whiteboardId: whiteboard._id });
    } catch (error) {
      console.error("Failed to delete whiteboard:", error);
      alert("Failed to delete whiteboard");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpen = () => {
    router.push(
      `/workspace/${workspaceId}/room/${roomId}/whiteboard/${whiteboard._id}`
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
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-orange-400" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate group-hover:text-orange-400 transition-colors">
            {whiteboard.name}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {whiteboard.lastEditorName || whiteboard.creatorName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(whiteboard.updatedAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
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

  // Grid view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      onClick={handleOpen}
      className="group relative bg-white/5 border-2 border-white/10 rounded-xl p-5 cursor-pointer hover:border-orange-400/50 hover:shadow-xl hover:shadow-orange-500/10 transition-all"
    >
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all z-10 disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Icon */}
      <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center mb-4">
        <FileText className="w-6 h-6 text-orange-400" />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-white truncate mb-2 group-hover:text-orange-400 transition-colors">
        {whiteboard.name}
      </h3>

      {/* Metadata */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <User className="w-3 h-3" />
          <span className="truncate">
            {whiteboard.lastEditorName || whiteboard.creatorName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Clock className="w-3 h-3" />
          <span>{formatDate(whiteboard.updatedAt)}</span>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-orange-500/10 transition-all pointer-events-none" />
    </motion.div>
  );
}
