"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, FileText, Loader2, Search, Grid, List, SortAsc } from "lucide-react";
import { DocumentCard } from "./document-card";
import { CreateDocumentModal } from "./create-document-modal";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentListProps {
  roomId: Id<"rooms">;
  workspaceId: string; // Clerk org ID for navigation
  convexWorkspaceId: Id<"workspaces">; // Convex workspace ID for mutations
}

export function DocumentList({ roomId, workspaceId, convexWorkspaceId }: DocumentListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  
  const documents = useQuery(api.documents.getDocumentsByRoom, { roomId });

  if (documents === undefined) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0b0f1a]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <span className="text-sm text-white/50">Loading documents...</span>
        </div>
      </div>
    );
  }

  // Filter and sort documents
  const filteredDocs = documents
    .filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.updatedAt - a.updatedAt;
    });

  const isEmpty = documents.length === 0;
  const noResults = filteredDocs.length === 0 && !isEmpty;

  return (
    <div className="h-full flex flex-col bg-[#0b0f1a]">
      {/* Top Section - Start a new document */}
      <div className="flex-shrink-0 bg-white/5 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-white/60">Start a new document</h2>
          </div>
          
          {/* Template Cards */}
          <div className="flex gap-4">
            {/* Blank Document */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="group flex flex-col items-center"
            >
              <div className="w-[120px] h-[160px] bg-white/5 border-2 border-white/10 rounded-lg flex items-center justify-center hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-500/10 transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5" />
                <Plus className="w-10 h-10 text-white/30 group-hover:text-sky-400 transition-colors relative z-10" />
                {/* Document lines decoration */}
                <div className="absolute top-4 left-4 right-4 space-y-2">
                  <div className="h-1 bg-white/10 rounded w-3/4" />
                  <div className="h-1 bg-white/10 rounded w-full" />
                  <div className="h-1 bg-white/10 rounded w-2/3" />
                </div>
              </div>
              <span className="mt-3 text-sm text-white/70 group-hover:text-sky-400 transition-colors">Blank</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Recent Documents Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Search and Filter Bar */}
        <div className="flex-shrink-0 bg-white/5 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-white">Recent documents</h2>
              
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Sort */}
                <button
                  onClick={() => setSortBy(sortBy === "recent" ? "name" : "recent")}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <SortAsc className="w-4 h-4" />
                  <span>{sortBy === "recent" ? "Recent" : "Name"}</span>
                </button>

                {/* View Toggle */}
                <div className="flex items-center bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white/20 shadow-sm" : "hover:bg-white/10"} transition-all`}
                  >
                    <Grid className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded ${viewMode === "list" ? "bg-white/20 shadow-sm" : "hover:bg-white/10"} transition-all`}
                  >
                    <List className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Grid/List */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">
            {isEmpty ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-32 h-32 bg-gradient-to-br from-sky-500/20 to-indigo-600/20 rounded-full flex items-center justify-center mb-6">
                  <FileText className="w-16 h-16 text-sky-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  No documents yet
                </h2>
                <p className="text-white/50 mb-6 max-w-md">
                  Get started by creating your first document. Collaborate with your team in real-time.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-full hover:shadow-lg hover:shadow-sky-500/25 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create Document
                </motion.button>
              </motion.div>
            ) : noResults ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <Search className="w-12 h-12 text-white/30 mb-4" />
                <h3 className="text-lg font-medium text-white mb-1">No documents found</h3>
                <p className="text-white/50">Try a different search term</p>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div
                  layout
                  className={viewMode === "grid" 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "flex flex-col gap-2"
                  }
                >
                  {filteredDocs.map((doc, index) => (
                    <motion.div
                      key={doc._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <DocumentCard
                        documentId={doc._id}
                        name={doc.name}
                        creatorName={doc.creatorName}
                        lastEditorName={doc.lastEditorName}
                        updatedAt={doc.updatedAt}
                        workspaceId={workspaceId}
                        roomId={roomId}
                        viewMode={viewMode}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateDocumentModal
            roomId={roomId}
            workspaceId={convexWorkspaceId}
            clerkOrgId={workspaceId}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
