"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, FileText, Loader2, Search, Grid, List, SortAsc } from "lucide-react";
import { WhiteboardCard } from "./whiteboard-card";
import { CreateWhiteboardModal } from "./create-whiteboard-modal";
import { motion, AnimatePresence } from "framer-motion";

interface WhiteboardListProps {
  roomId: Id<"rooms">;
  workspaceId: string; // Clerk org ID for navigation
  convexWorkspaceId: Id<"workspaces">; // Convex workspace ID for mutations
}

export function WhiteboardList({ roomId, workspaceId, convexWorkspaceId }: WhiteboardListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  
  const whiteboards = useQuery(api.whiteboards.getWhiteboardsByRoom, { roomId });

  if (whiteboards === undefined) {
    return (
      <div className="flex items-center justify-center h-full bg-[#F9FBFD]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          <span className="text-sm text-gray-500">Loading whiteboards...</span>
        </div>
      </div>
    );
  }

  // Filter and sort whiteboards
  const filteredWhiteboards = whiteboards
    .filter(board => board.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.updatedAt - a.updatedAt;
    });

  const isEmpty = whiteboards.length === 0;
  const noResults = filteredWhiteboards.length === 0 && !isEmpty;

  return (
    <div className="h-full flex flex-col bg-[#F9FBFD]">
      {/* Top Section - Start a new whiteboard */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-gray-600">Start a new whiteboard</h2>
          </div>
          
          {/* Template Cards */}
          <div className="flex gap-4">
            {/* Blank Whiteboard */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="group flex flex-col items-center"
            >
              <div className="w-[120px] h-[160px] bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center hover:border-orange-400 hover:shadow-lg transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-orange-50" />
                <Plus className="w-10 h-10 text-gray-300 group-hover:text-orange-500 transition-colors relative z-10" />
                {/* Whiteboard decoration */}
                <div className="absolute inset-4 border border-gray-100 rounded" />
              </div>
              <span className="mt-3 text-sm text-gray-700 group-hover:text-orange-600 transition-colors">Blank</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Recent Whiteboards Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Search and Filter Bar */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-gray-900">Recent whiteboards</h2>
              
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search whiteboards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Sort */}
                <button
                  onClick={() => setSortBy(sortBy === "recent" ? "name" : "recent")}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <SortAsc className="w-4 h-4" />
                  <span>{sortBy === "recent" ? "Recent" : "Name"}</span>
                </button>

                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"} transition-all`}
                  >
                    <Grid className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded ${viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"} transition-all`}
                  >
                    <List className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Whiteboards Grid/List */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">
            {isEmpty && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No whiteboards yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Create your first whiteboard to start collaborating with your team.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Whiteboard
                </button>
              </motion.div>
            )}

            {noResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No whiteboards found</h3>
                <p className="text-gray-500">Try adjusting your search query</p>
              </motion.div>
            )}

            {!isEmpty && !noResults && (
              <AnimatePresence mode="popLayout">
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      : "space-y-2"
                  }
                >
                  {filteredWhiteboards.map((board) => (
                    <WhiteboardCard
                      key={board._id}
                      whiteboard={board}
                      workspaceId={workspaceId}
                      roomId={roomId}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <CreateWhiteboardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        roomId={roomId}
        workspaceId={workspaceId}
        convexWorkspaceId={convexWorkspaceId}
      />
    </div>
  );
}
