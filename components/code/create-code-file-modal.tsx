"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import { X, FileCode, Folder, Loader2 } from "lucide-react";

// Supported languages for code files
const LANGUAGES = [
  { value: "javascript", label: "JavaScript", extension: ".js" },
  { value: "typescript", label: "TypeScript", extension: ".ts" },
  { value: "python", label: "Python", extension: ".py" },
  { value: "java", label: "Java", extension: ".java" },
  { value: "cpp", label: "C++", extension: ".cpp" },
  { value: "c", label: "C", extension: ".c" },
  { value: "csharp", label: "C#", extension: ".cs" },
  { value: "go", label: "Go", extension: ".go" },
  { value: "rust", label: "Rust", extension: ".rs" },
  { value: "ruby", label: "Ruby", extension: ".rb" },
  { value: "php", label: "PHP", extension: ".php" },
  { value: "swift", label: "Swift", extension: ".swift" },
  { value: "kotlin", label: "Kotlin", extension: ".kt" },
  { value: "html", label: "HTML", extension: ".html" },
  { value: "css", label: "CSS", extension: ".css" },
  { value: "json", label: "JSON", extension: ".json" },
  { value: "markdown", label: "Markdown", extension: ".md" },
  { value: "sql", label: "SQL", extension: ".sql" },
  { value: "yaml", label: "YAML", extension: ".yaml" },
  { value: "shell", label: "Shell/Bash", extension: ".sh" },
];

interface CreateCodeFileModalProps {
  roomId: Id<"rooms">;
  workspaceId: Id<"workspaces">;
  parentId?: Id<"codeFiles">;
  type: "file" | "folder";
  onClose: () => void;
}

export function CreateCodeFileModal({
  roomId,
  workspaceId,
  parentId,
  type,
  onClose,
}: CreateCodeFileModalProps) {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFile = useMutation(api.codeFiles.createFile);
  const createFolder = useMutation(api.codeFiles.createFolder);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      if (type === "file") {
        await createFile({
          roomId,
          workspaceId,
          name: name.trim(),
          language,
          parentId,
        });
      } else {
        await createFolder({
          roomId,
          workspaceId,
          name: name.trim(),
          parentId,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {type === "file" ? (
              <FileCode className="w-6 h-6 text-emerald-600" />
            ) : (
              <Folder className="w-6 h-6 text-amber-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {type === "file" ? "Create New File" : "Create New Folder"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Input */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {type === "file" ? "File Name" : "Folder Name"}
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                type === "file" ? "e.g., index.js, main.py" : "e.g., src, utils"
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Language Selector (only for files) */}
          {type === "file" && (
            <div>
              <label
                htmlFor="language"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label} ({lang.extension})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isCreating}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create ${type === "file" ? "File" : "Folder"}`
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
