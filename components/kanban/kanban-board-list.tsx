"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Trello,
  Trash2,
  MoreVertical,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { KanbanBoardCard } from "./kanban-board-card";
import { CreateKanbanBoardModal } from "./create-kanban-board-modal";

interface KanbanBoardListProps {
  roomId: Id<"rooms">;
  workspaceId: string; // Clerk Org ID
  convexWorkspaceId: Id<"workspaces">;
}

export function KanbanBoardList({
  roomId,
  workspaceId,
  convexWorkspaceId,
}: KanbanBoardListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<Id<"kanbanBoards"> | null>(null);
  const [deletingBoardId, setDeletingBoardId] = useState<Id<"kanbanBoards"> | null>(
    null
  );
  const [deleteConfirmBoard, setDeleteConfirmBoard] = useState<{
    id: Id<"kanbanBoards">;
    name: string;
  } | null>(null);

  const boards = useQuery(api.kanbanBoards.getKanbanBoardsByRoom, { roomId });
  const deleteBoardMutation = useMutation(api.kanbanBoards.deleteKanbanBoard);

  const handleDeleteBoard = async (boardId: Id<"kanbanBoards">) => {
    setDeletingBoardId(boardId);
    setDeleteConfirmBoard(null);
    setMenuOpenId(null);

    try {
      // Delete from Convex
      await deleteBoardMutation({ boardId });

      // Delete corresponding Liveblocks room
      await fetch("/api/liveblocks-delete-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomIds: [`kanban:${boardId}`] }),
      });
    } catch (error: any) {
      alert(error.message || "Failed to delete board");
    } finally {
      setDeletingBoardId(null);
    }
  };

  const openDeleteConfirm = (
    boardId: Id<"kanbanBoards">,
    boardName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setDeleteConfirmBoard({ id: boardId, name: boardName });
    setMenuOpenId(null);
  };

  if (boards === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-pink-500 dark:text-pink-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Kanban Boards</h2>
            <p className="text-muted-foreground mt-1">
              Organize your tasks with boards
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl hover:from-pink-400 hover:to-rose-500 transition-all font-medium shadow-lg shadow-pink-500/25"
          >
            <Plus className="w-5 h-5" />
            Create Board
          </button>
        </div>

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <div className="text-center py-16 bg-muted rounded-2xl border-2 border-dashed border-border">
            <Trello className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No boards yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first kanban board to get started
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl hover:from-pink-400 hover:to-rose-500 transition-all font-medium shadow-lg shadow-pink-500/25"
            >
              <Plus className="w-5 h-5" />
              Create First Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board, index) => {
              const isDeleting = deletingBoardId === board._id;

              return (
                <div key={board._id} className="relative">
                  {/* Board Card */}
                  <div className={isDeleting ? "opacity-50 pointer-events-none" : ""}>
                    <KanbanBoardCard
                      board={board}
                      onClick={() =>
                        router.push(
                          `/workspace/${workspaceId}/room/${roomId}/kanban/${board._id}`
                        )
                      }
                      index={index}
                    />
                  </div>

                  {/* Menu Button (positioned absolutely over the card) */}
                  <div className="absolute top-5 right-5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === board._id ? null : board._id);
                      }}
                      className="p-1 rounded hover:bg-muted opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {/* Dropdown Menu */}
                    {menuOpenId === board._id && (
                      <div
                        className="absolute right-0 top-8 bg-background-secondary border border-border rounded-lg shadow-lg py-1 min-w-[120px] z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => openDeleteConfirm(board._id, board.name, e)}
                          disabled={isDeleting}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Loading overlay when deleting */}
                  {isDeleting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                      <Loader2 className="w-6 h-6 text-pink-500 dark:text-pink-400 animate-spin" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      <CreateKanbanBoardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roomId={roomId}
        workspaceId={convexWorkspaceId}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmBoard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmBoard(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-background-secondary rounded-2xl shadow-2xl p-6 mx-4 border border-border"
            >
              {/* Warning Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-foreground text-center mb-2">
                Delete Board
              </h3>

              {/* Message */}
              <p className="text-muted-foreground text-center text-sm mb-6">
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">
                  &quot;{deleteConfirmBoard.name}&quot;
                </span>
                ? All columns and cards will be lost. This action cannot be undone.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmBoard(null)}
                  className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteBoard(deleteConfirmBoard.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
