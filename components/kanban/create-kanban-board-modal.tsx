"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Trello, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";

interface CreateKanbanBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: Id<"rooms">;
  workspaceId: Id<"workspaces">;
}

export function CreateKanbanBoardModal({
  isOpen,
  onClose,
  roomId,
  workspaceId,
}: CreateKanbanBoardModalProps) {
  const [boardName, setBoardName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useUser();

  const createBoard = useMutation(api.kanbanBoards.createKanbanBoard);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim() || !user) return;

    setIsCreating(true);
    try {
      await createBoard({
        roomId,
        workspaceId,
        name: boardName.trim(),
        createdBy: user.id,
      });
      setBoardName("");
      onClose();
    } catch (error) {
      console.error("Failed to create kanban board:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-background-secondary rounded-2xl shadow-2xl p-6 mx-4 border border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <Trello className="w-5 h-5 text-pink-500 dark:text-pink-400" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Create Kanban Board
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="space-y-5">
              {/* Board Name Input */}
              <div>
                <label
                  htmlFor="boardName"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  Board Name
                </label>
                <input
                  id="boardName"
                  type="text"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="e.g., Sprint Planning, Product Roadmap"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-foreground placeholder-muted-foreground"
                  disabled={isCreating}
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isCreating}
                  className="flex-1 px-4 py-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!boardName.trim() || isCreating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl hover:from-pink-400 hover:to-rose-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Board"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
