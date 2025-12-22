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
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  typescript: { icon: "TS", color: "text-blue-600", bgColor: "bg-blue-100" },
  python: { icon: "PY", color: "text-green-600", bgColor: "bg-green-100" },
  java: { icon: "JV", color: "text-orange-600", bgColor: "bg-orange-100" },
  cpp: { icon: "C++", color: "text-purple-600", bgColor: "bg-purple-100" },
  c: { icon: "C", color: "text-gray-600", bgColor: "bg-gray-100" },
  csharp: { icon: "C#", color: "text-violet-600", bgColor: "bg-violet-100" },
  go: { icon: "GO", color: "text-cyan-600", bgColor: "bg-cyan-100" },
  rust: { icon: "RS", color: "text-orange-700", bgColor: "bg-orange-100" },
  ruby: { icon: "RB", color: "text-red-600", bgColor: "bg-red-100" },
  php: { icon: "PHP", color: "text-indigo-600", bgColor: "bg-indigo-100" },
  swift: { icon: "SW", color: "text-orange-500", bgColor: "bg-orange-100" },
  kotlin: { icon: "KT", color: "text-purple-500", bgColor: "bg-purple-100" },
  html: { icon: "HTML", color: "text-orange-600", bgColor: "bg-orange-100" },
  css: { icon: "CSS", color: "text-blue-500", bgColor: "bg-blue-100" },
  json: { icon: "JSON", color: "text-gray-600", bgColor: "bg-gray-100" },
  markdown: { icon: "MD", color: "text-gray-700", bgColor: "bg-gray-100" },
  sql: { icon: "SQL", color: "text-blue-700", bgColor: "bg-blue-100" },
  yaml: { icon: "YML", color: "text-red-500", bgColor: "bg-red-100" },
  shell: { icon: "SH", color: "text-green-700", bgColor: "bg-green-100" },
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
      className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Card Content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              type === "folder"
                ? "bg-amber-100"
                : langConfig?.bgColor || "bg-gray-100"
            }`}
          >
            {type === "folder" ? (
              <Folder className="w-6 h-6 text-amber-600" />
            ) : (
              <span
                className={`text-xs font-bold ${langConfig?.color || "text-gray-600"}`}
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
              className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div
                className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRenaming(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="w-4 h-4" />
                  Rename
                </button>
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
              className="w-full px-2 py-1 text-sm font-medium text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <h3 className="font-medium text-gray-900 truncate">{name}</h3>
          )}
          {type === "file" && language && (
            <p className="text-xs text-gray-500 mt-0.5 capitalize">
              {language}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
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
