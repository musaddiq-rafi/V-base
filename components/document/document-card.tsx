"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  FileText,
  Clock,
  User,
  MoreVertical,
  Trash2,
  Loader2,
  ExternalLink,
  Copy,
} from "lucide-react";
import { motion } from "framer-motion";

interface DocumentCardProps {
  documentId: string;
  name: string;
  creatorName: string;
  lastEditorName: string | null;
  updatedAt: number;
  workspaceId: string; // Clerk org ID for navigation
  roomId: string;
  viewMode?: "grid" | "list";
}

export function DocumentCard({
  documentId,
  name,
  creatorName,
  lastEditorName,
  updatedAt,
  workspaceId,
  roomId,
  viewMode = "grid",
}: DocumentCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteDocument = useMutation(api.documents.deleteDocument);

  const handleClick = () => {
    if (!isDeleting) {
      router.push(
        `/workspace/${workspaceId}/room/${roomId}/document/${documentId}`
      );
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    setIsDeleting(true);
    setShowMenu(false);

    try {
      await deleteDocument({ documentId: documentId as Id<"documents"> });

      await fetch("/api/liveblocks-delete-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomIds: [`doc:${documentId}`] }),
      });
    } catch (error: any) {
      alert(error.message || "Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  };

  // List View
  if (viewMode === "list") {
    return (
      <motion.div
        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
        onClick={handleClick}
        className={`group relative flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
      >
        {isDeleting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg z-10">
            <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
          </div>
        )}

        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-sky-400" />
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{name}</h3>
        </div>

        {/* Owner */}
        <div className="hidden md:flex items-center gap-2 text-sm text-white/50 w-40">
          <span className="truncate">{lastEditorName || creatorName}</span>
        </div>

        {/* Last Modified */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-white/50 w-32">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDate(updatedAt)}</span>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical className="w-4 h-4 text-white/50" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-8 bg-[#0f1520] border border-white/10 rounded-xl shadow-lg py-1.5 min-w-[160px] z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Grid View (Default)
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
      onClick={handleClick}
      className={`group relative bg-white/5 rounded-xl border border-white/10 overflow-hidden cursor-pointer transition-all hover:border-white/20 ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
    >
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
          <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
        </div>
      )}

      {/* Document Preview */}
      <div className="relative h-[140px] bg-gradient-to-br from-white/5 to-white/10 border-b border-white/10">
        {/* Document preview lines */}
        <div className="absolute inset-0 p-6">
          <div className="space-y-2.5">
            <div className="h-2 bg-white/20 rounded w-3/4" />
            <div className="h-2 bg-white/15 rounded w-full" />
            <div className="h-2 bg-white/15 rounded w-5/6" />
            <div className="h-2 bg-white/10 rounded w-2/3" />
            <div className="h-2 bg-white/10 rounded w-4/5" />
          </div>
        </div>

        {/* Document icon overlay */}
        <div className="absolute top-3 left-3">
          <div className="w-8 h-8 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <FileText className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Menu Button */}
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical className="w-4 h-4 text-white/60" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-10 bg-[#0f1520] border border-white/10 rounded-xl shadow-lg py-1.5 min-w-[160px] z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Document Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate mb-2">{name}</h3>
        <div className="flex items-center justify-between text-xs text-white/50">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDate(updatedAt)}</span>
          </div>
          <div className="flex items-center gap-1 truncate max-w-[120px]">
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{lastEditorName || creatorName}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
