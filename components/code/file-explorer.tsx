"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Plus,
  Folder,
  FileCode,
  Loader2,
  FolderOpen,
  ChevronRight,
  Home,
} from "lucide-react";
import { CodeFileCard } from "./code-file-card";
import { CreateCodeFileModal } from "./create-code-file-modal";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface FileExplorerProps {
  roomId: Id<"rooms">;
  workspaceId: string; // Clerk org ID for navigation
  convexWorkspaceId: Id<"workspaces">; // Convex workspace ID for mutations
}

export function FileExplorer({
  roomId,
  workspaceId,
  convexWorkspaceId,
}: FileExplorerProps) {
  const router = useRouter();
  const [currentFolderId, setCurrentFolderId] = useState<
    Id<"codeFiles"> | undefined
  >(undefined);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"file" | "folder">("file");

  const files = useQuery(api.codeFiles.getFiles, {
    roomId,
    parentId: currentFolderId,
  });
  const fileCount = useQuery(api.codeFiles.getFileCount, { roomId });
  const breadcrumbs = useQuery(api.codeFiles.getBreadcrumbs, {
    itemId: currentFolderId,
  });

  const handleItemClick = (item: {
    _id: Id<"codeFiles">;
    type: "file" | "folder";
  }) => {
    if (item.type === "folder") {
      setCurrentFolderId(item._id);
    } else {
      // Navigate to code editor
      router.push(`/workspace/${workspaceId}/room/${roomId}/code/${item._id}`);
    }
  };

  const handleCreateFile = () => {
    setCreateType("file");
    setShowCreateModal(true);
  };

  const handleCreateFolder = () => {
    setCreateType("folder");
    setShowCreateModal(true);
  };

  const navigateToRoot = () => {
    setCurrentFolderId(undefined);
  };

  const navigateToFolder = (folderId: string) => {
    setCurrentFolderId(folderId as Id<"codeFiles">);
  };

  if (files === undefined || fileCount === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const isEmpty = files.length === 0;
  const isAtRoot = currentFolderId === undefined;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Header */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileCode className="w-7 h-7 text-emerald-600" />
              Code Files
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {fileCount.count} / {fileCount.limit} files used
              {fileCount.remaining > 0 && (
                <span className="text-emerald-600 ml-1">
                  ({fileCount.remaining} remaining)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateFolder}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Folder className="w-5 h-5" />
              New Folder
            </button>
            <button
              onClick={handleCreateFile}
              disabled={fileCount.remaining === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              New File
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 mt-4 text-sm">
          <button
            onClick={navigateToRoot}
            className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors ${
              isAtRoot ? "text-gray-900 font-medium" : "text-gray-600"
            }`}
          >
            <Home className="w-4 h-4" />
            Root
          </button>
          {breadcrumbs?.map((crumb, index) => (
            <div key={crumb.id} className="flex items-center gap-1">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => navigateToFolder(crumb.id)}
                className={`px-2 py-1 rounded hover:bg-gray-100 transition-colors ${
                  index === breadcrumbs.length - 1
                    ? "text-gray-900 font-medium"
                    : "text-gray-600"
                }`}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
              <FolderOpen className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isAtRoot ? "No files yet" : "This folder is empty"}
            </h2>
            <p className="text-gray-500 mb-6 max-w-md">
              {isAtRoot
                ? "Create your first code file to start collaborating with your team in real-time."
                : "Create a file or folder to organize your code."}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateFolder}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Folder className="w-5 h-5" />
                Create Folder
              </button>
              <button
                onClick={handleCreateFile}
                disabled={fileCount.remaining === 0}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                Create First File
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {files.map((item) => (
              <CodeFileCard
                key={item._id}
                id={item._id}
                name={item.name}
                type={item.type}
                language={item.language}
                creatorName={item.creatorName}
                updatedAt={item.updatedAt}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showCreateModal && (
        <CreateCodeFileModal
          roomId={roomId}
          workspaceId={convexWorkspaceId}
          parentId={currentFolderId}
          type={createType}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
