"use client";

import { motion } from "framer-motion";
import { Folder, FileCode, MoreVertical, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Language icons/colors mapping
const languageConfig: Record<
  string,
  { icon: string; color: string; bgColor: string }
> = {
  javascript: {
    icon: "JS",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
  },
  typescript: { icon: "TS", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  python: { icon: "PY", color: "text-green-400", bgColor: "bg-green-500/20" },
  java: { icon: "JV", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  cpp: { icon: "C++", color: "text-purple-400", bgColor: "bg-purple-500/20" },
  c: { icon: "C", color: "text-gray-400", bgColor: "bg-gray-500/20" },
  csharp: { icon: "C#", color: "text-violet-400", bgColor: "bg-violet-500/20" },
  go: { icon: "GO", color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
  rust: { icon: "RS", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  ruby: { icon: "RB", color: "text-red-400", bgColor: "bg-red-500/20" },
  php: { icon: "PHP", color: "text-indigo-400", bgColor: "bg-indigo-500/20" },
  swift: { icon: "SW", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  kotlin: { icon: "KT", color: "text-purple-400", bgColor: "bg-purple-500/20" },
  html: { icon: "HTML", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  css: { icon: "CSS", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  json: { icon: "JSON", color: "text-gray-400", bgColor: "bg-gray-500/20" },
  markdown: { icon: "MD", color: "text-gray-400", bgColor: "bg-gray-500/20" },
  sql: { icon: "SQL", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  yaml: { icon: "YML", color: "text-red-400", bgColor: "bg-red-500/20" },
  shell: { icon: "SH", color: "text-green-400", bgColor: "bg-green-500/20" },
};

interface CodeFileCardProps {
  id: Id<"codeFiles">;
  name: string;
  type: "file" | "folder";
  language?: string;
  creatorName: string;
  updatedAt: number;
  onClick: () => void;
}

export function CodeFileCard({
  id,
  name,
  type,
  language,
  creatorName,
  updatedAt,
  onClick,
}: CodeFileCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(name);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteNode = useMutation(api.codeFiles.deleteNode);
  const rename = useMutation(api.codeFiles.rename);

  const langConfig = language
    ? languageConfig[language] || {
        icon: "?",
        color: "text-gray-600",
        bgColor: "bg-gray-100",
      }
    : null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      // Delete from Convex and get list of deleted file IDs
      const result = await deleteNode({ id });

      // Delete corresponding Liveblocks rooms for the deleted files
      if (result.deletedFileIds && result.deletedFileIds.length > 0) {
        const roomIds = result.deletedFileIds.map(
          (fileId: string) => `code:${fileId}`
        );

        const response = await fetch("/api/liveblocks-delete-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomIds }),
        });

        if (!response.ok) {
          console.error("Failed to delete Liveblocks rooms");
        }
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(error.message);
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const handleRename = async () => {
    if (newName.trim() && newName !== name) {
      await rename({ id, name: newName.trim() });
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setNewName(name);
      setIsRenaming(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative bg-white/5 rounded-xl border border-white/10 hover:border-white/20 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Card Content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              type === "folder"
                ? "bg-amber-500/20"
                : langConfig?.bgColor || "bg-gray-500/20"
            }`}
          >
            {type === "folder" ? (
              <Folder className="w-6 h-6 text-amber-400" />
            ) : (
              <span
                className={`text-xs font-bold ${langConfig?.color || "text-gray-400"}`}
              >
                {langConfig?.icon || <FileCode className="w-6 h-6" />}
              </span>
            )}
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4 text-white/50" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div
                className="absolute right-0 top-8 bg-[#0f1520] border border-white/10 rounded-lg shadow-lg py-1 min-w-[120px] z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRenaming(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/70 hover:bg-white/10"
                >
                  <Pencil className="w-4 h-4" />
                  Rename
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="mt-3">
          {isRenaming ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="w-full px-2 py-1 text-sm font-medium text-white bg-white/5 border border-sky-500 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          ) : (
            <h3 className="font-medium text-white truncate">{name}</h3>
          )}
          {type === "file" && language && (
            <p className="text-xs text-white/50 mt-0.5 capitalize">
              {language}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
          <span>{creatorName}</span>
          <span>{formatDate(updatedAt)}</span>
        </div>
      </div>

      {/* Close menu on click outside */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(false);
          }}
        />
      )}
    </motion.div>
  );
}
