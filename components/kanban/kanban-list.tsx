"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Plus,
  Loader2,
  Search,
  Grid,
  List,
  SortAsc,
} from "lucide-react";
import { InlineLoader } from "@/components/shared/page-loader";
import { KanbanCard } from "./kanban-card";
import { motion, AnimatePresence } from "framer-motion";

interface KanbanListProps {
  roomId: Id<"rooms">;
  workspaceId: string; // Clerk org ID for navigation
  convexWorkspaceId: Id<"workspaces">; // Convex workspace ID
}

export function KanbanList({
  roomId,
  workspaceId,
  convexWorkspaceId,
}: KanbanListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [isCreating, setIsCreating] = useState(false);

  const router = useRouter();
  const createKanbanQuick = useMutation(api.kanban.createKanbanQuick);
  const kanbans = useQuery(api.kanban.getKanbansByRoom, { roomId });

  const handleQuickCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const kanbanId = await createKanbanQuick({ roomId, workspaceId: convexWorkspaceId });
      router.push(`/workspace/${workspaceId}/room/${roomId}/kanban/${kanbanId}`);
    } catch (error) {
      console.error("Failed to create board:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (kanbans === undefined) {
    return <InlineLoader label="Loading boards..." />;
  }

  const filtered = kanbans
    .filter((board) =>
      board.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.updatedAt - a.updatedAt;
    });

  const isEmpty = kanbans.length === 0;
  const noResults = filtered.length === 0 && !isEmpty;

  return (
    <div className="h-full flex flex-col bg-[#0b0f1a]">
      {/* Top Section */}
      <div className="flex-shrink-0 bg-white/5 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-white/60">
              Start a new board
            </h2>
          </div>

          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleQuickCreate}
              disabled={isCreating}
              className="group flex flex-col items-center"
            >
              <div className="w-[120px] h-[160px] bg-white/5 border-2 border-white/10 rounded-lg flex items-center justify-center hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/10" />
                {isCreating ? (
                  <Loader2 className="w-10 h-10 text-emerald-400 animate-spin relative z-10" />
                ) : (
                  <Plus className="w-10 h-10 text-white/30 group-hover:text-emerald-400 transition-colors relative z-10" />
                )}
                <div className="absolute inset-4 border border-white/10 rounded" />
              </div>
              <span className="mt-3 text-sm text-white/70 group-hover:text-emerald-400 transition-colors">
                Blank
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Recent Boards */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-shrink-0 bg-white/5 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-white">
                Recent boards
              </h2>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search boards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  onClick={() =>
                    setSortBy(sortBy === "recent" ? "name" : "recent")
                  }
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <SortAsc className="w-4 h-4" />
                  <span>{sortBy === "recent" ? "Recent" : "Name"}</span>
                </button>

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

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">
            {isEmpty && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-10 h-10 rounded bg-emerald-400/40" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  No boards yet
                </h3>
                <p className="text-white/50 mb-6 max-w-md mx-auto">
                  Create your first board to start tracking tasks.
                </p>
                <button
                  onClick={handleQuickCreate}
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {isCreating ? "Creating..." : "Create Board"}
                </button>
              </motion.div>
            )}

            {noResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Search className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No boards found
                </h3>
                <p className="text-white/50">
                  Try adjusting your search query
                </p>
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
                  {filtered.map((board) => (
                    <KanbanCard
                      key={board._id}
                      kanban={board}
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

    </div>
  );
}
