"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, FileText, Loader2, FolderOpen } from "lucide-react";
import { DocumentCard } from "./document-card";
import { CreateDocumentModal } from "./create-document-modal";
import { motion } from "framer-motion";

interface DocumentListProps {
  roomId: Id<"rooms">;
  workspaceId: Id<"workspaces">;
}

export function DocumentList({ roomId, workspaceId }: DocumentListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const documents = useQuery(api.documents.getDocumentsByRoom, { roomId });

  if (documents === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const isEmpty = documents.length === 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Header */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-blue-600" />
              Documents
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {documents.length} {documents.length === 1 ? "document" : "documents"}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Document
          </button>
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
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <FolderOpen className="w-12 h-12 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No documents yet
            </h2>
            <p className="text-gray-500 mb-6 max-w-md">
              Create your first document to start collaborating with your team in real-time.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create First Document
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {documents.map((doc) => (
              <DocumentCard
                key={doc._id}
                documentId={doc._id}
                name={doc.name}
                creatorName={doc.creatorName}
                lastEditorName={doc.lastEditorName}
                updatedAt={doc.updatedAt}
                workspaceId={workspaceId}
                roomId={roomId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showCreateModal && (
        <CreateDocumentModal
          roomId={roomId}
          workspaceId={workspaceId}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
