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
}

export function DocumentCard({
  documentId,
  name,
  creatorName,
  lastEditorName,
  updatedAt,
  workspaceId,
  roomId,
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
      // Delete from Convex
      await deleteDocument({ documentId: documentId as Id<"documents"> });

      // Delete corresponding Liveblocks room
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
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={handleClick}
      className={`group relative bg-white rounded-lg border border-gray-200 p-6 cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
    >
      {/* Loading overlay when deleting */}
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg z-10">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Document Icon and Name */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
        </div>
        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-2 text-sm text-gray-500">
        {/* Last Updated */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Updated {formatDate(updatedAt)}</span>
        </div>

        {/* Last Editor / Creator */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>
            {lastEditorName
              ? `Edited by ${lastEditorName}`
              : `Created by ${creatorName}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
