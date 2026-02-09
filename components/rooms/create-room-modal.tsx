"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  X,
  Presentation,
  Loader2,
  PenTool,
  FileText,
  Code2,
  Video,
  Trello,
  Info,
  AlertCircle,
  Table,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: Id<"workspaces">;
}

export function CreateRoomModal({
  isOpen,
  onClose,
  workspaceId,
}: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState<
    "document" | "code" | "whiteboard" | "conference" | "kanban" | "spreadsheet"
  >("whiteboard");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const createRoom = useMutation(api.rooms.createRoom);
  const roomStats = useQuery(api.rooms.getRoomStats, { workspaceId });

  const hasMeetingRoom = roomStats?.hasMeetingRoom ?? false;
  const isMeetingSelected = roomType === "conference";
  const canCreateMeeting = isMeetingSelected && !hasMeetingRoom;
  const isCreateDisabled =
    !roomName.trim() || isCreating || (isMeetingSelected && hasMeetingRoom);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setIsCreating(true);
    try {
      const result: any = await createRoom({
        workspaceId,
        name: roomName.trim(),
        type: roomType,
      });
      // If a kanban was created, navigate to it
      if (roomType === "kanban" && result?.kanbanId) {
        const kbId = result.kanbanId;
        // Use workspaceId in route param (workspace route uses this id)
        // Navigate to the kanban board page
        router.push(`/workspace/${workspaceId}/room/${result.roomId}/kanban/${kbId}`);
        return; // navigation will close modal by leaving page
      }
      setRoomName("");
      setRoomType("whiteboard");
      onClose();
    } catch (error) {
      console.error("Failed to create room:", error);
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
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                  <Presentation className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Create New Room
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
              {/* Room Name Input */}
              <div>
                <label
                  htmlFor="roomName"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  Room Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g., Design Brainstorm"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all text-foreground placeholder-muted-foreground"
                  disabled={isCreating}
                  autoFocus
                />
              </div>

              {/* Room Type Select */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Room Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "whiteboard", label: "Whiteboard", icon: PenTool },
                    { value: "document", label: "Document", icon: FileText },
                    { value: "code", label: "Code", icon: Code2 },
                    { value: "spreadsheet", label: "Spreadsheet", icon: Table },
                    { value: "conference", label: "Meeting", icon: Video },
                    { value: "kanban", label: "Kanban", icon: Trello },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setRoomType(
                          option.value as
                            | "document"
                            | "code"
                            | "whiteboard"
                            | "conference"
                            | "kanban"
                            | "spreadsheet"
                        )
                      }
                      disabled={isCreating}
                      className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl transition-all text-sm font-medium ${roomType === option.value
                          ? "border-sky-500/50 bg-sky-500/20 text-sky-500 dark:text-sky-400"
                          : "border-border bg-muted text-muted-foreground hover:border-border hover:bg-muted/80"
                        } disabled:opacity-50`}
                    >
                  <option.icon className="w-4 h-4" />
                  {option.label}
                </button>
              ))}
            </div>

                {/* Meeting Room Info */}
                {isMeetingSelected && (
                  <div className={`flex items-start gap-2 mt-3 p-3 rounded-lg ${hasMeetingRoom ? "bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30" : "bg-sky-500/20 text-sky-500 dark:text-sky-400 border border-sky-500/30"}`}>
                    {hasMeetingRoom ? (
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    )}
                    <p className="text-sm">
                      {hasMeetingRoom
                        ? "This workspace already has a meeting room. Only one meeting room is allowed per workspace."
                        : "You can create 1 meeting room per workspace. This will be a shared space for video conferences."}
                    </p>
                  </div>
                )}
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
                  disabled={isCreateDisabled}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl hover:from-sky-400 hover:to-indigo-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : isMeetingSelected && hasMeetingRoom ? (
                    "Limit Reached"
                  ) : (
                    "Create Room"
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
