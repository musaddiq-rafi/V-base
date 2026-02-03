"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Presentation,
  FileText,
  Code,
  Video,
  Loader2,
  Trash2,
  MoreVertical,
  AlertTriangle,
  Trello,
} from "lucide-react";
import { CreateRoomModal } from "./create-room-modal";

interface RoomListProps {
  workspaceId: Id<"workspaces">;
  clerkOrgId: string;
}

// Icon mapping for room types
const roomIcons = {
  whiteboard: Presentation,
  document: FileText,
  code: Code,
  conference: Video,
  kanban: Trello,
};

// Color mapping for room types - Theme aware
const roomColors = {
  whiteboard: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  document: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  code: "bg-green-500/20 text-green-600 dark:text-green-400",
  conference: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  kanban: "bg-pink-500/20 text-pink-600 dark:text-pink-400",
};

export function RoomList({ workspaceId, clerkOrgId }: RoomListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<Id<"rooms"> | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<Id<"rooms"> | null>(
    null
  );
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState<{
    id: Id<"rooms">;
    name: string;
  } | null>(null);

  const rooms = useQuery(api.rooms.getRoomsByWorkspace, { workspaceId });
  const deleteRoomMutation = useMutation(api.rooms.deleteRoom);

  const handleDeleteRoom = async (roomId: Id<"rooms">) => {
    setDeletingRoomId(roomId);
    setDeleteConfirmRoom(null);
    setMenuOpenId(null);

    try {
      // Delete from Convex and get Liveblocks room IDs to clean up
      const result = await deleteRoomMutation({ roomId });

      // Delete corresponding Liveblocks rooms
      if (
        result.liveblocksRoomIdsToDelete &&
        result.liveblocksRoomIdsToDelete.length > 0
      ) {
        await fetch("/api/liveblocks-delete-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomIds: result.liveblocksRoomIdsToDelete }),
        });
      }
    } catch (error: any) {
      alert(error.message || "Failed to delete room");
    } finally {
      setDeletingRoomId(null);
    }
  };

  const openDeleteConfirm = (
    roomId: Id<"rooms">,
    roomName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setDeleteConfirmRoom({ id: roomId, name: roomName });
    setMenuOpenId(null);
  };

  if (rooms === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-sky-500 dark:text-sky-400 animate-spin" />
      </div>
    );
  }

  const maxRooms = 10;
  const isAtRoomLimit = rooms.length >= maxRooms;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Rooms</h2>
          <p className="text-muted-foreground mt-1">
            {rooms.length}/{maxRooms} rooms used
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isAtRoomLimit}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl hover:from-sky-400 hover:to-indigo-500 transition-all font-medium shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          {isAtRoomLimit ? "Limit Reached" : "Create Room"}
        </button>
      </div>

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <div className="text-center py-16 bg-muted rounded-2xl border-2 border-dashed border-border">
          <Presentation className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No rooms yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Create your first room to start collaborating
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl hover:from-sky-400 hover:to-indigo-500 transition-all font-medium shadow-lg shadow-sky-500/25"
          >
            <Plus className="w-5 h-5" />
            Create First Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room, index) => {
            const Icon = roomIcons[room.type];
            const colorClass = roomColors[room.type];
            const isDeleting = deletingRoomId === room._id;

            return (
              <motion.div
                key={room._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() =>
                  router.push(`/workspace/${clerkOrgId}/room/${room._id}`)
                }
                className={`group relative bg-surface rounded-xl border border-border p-6 hover:bg-surface-hover hover:border-border transition-all cursor-pointer ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
              >
                {/* Icon and Type */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full capitalize">
                      {room.type}
                    </span>
                    {/* Menu Button */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(
                            menuOpenId === room._id ? null : room._id
                          );
                        }}
                        className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {/* Dropdown Menu */}
                      {menuOpenId === room._id && (
                        <div
                          className="absolute right-0 top-8 bg-background-secondary border border-border rounded-lg shadow-lg py-1 min-w-[120px] z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) =>
                              openDeleteConfirm(room._id, room.name, e)
                            }
                            disabled={isDeleting}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Loading overlay when deleting */}
                {isDeleting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                    <Loader2 className="w-6 h-6 text-sky-500 dark:text-sky-400 animate-spin" />
                  </div>
                )}

                {/* Room Name */}
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                  {room.name}
                </h3>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceId={workspaceId}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmRoom(null)}
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
                Delete Room
              </h3>

              {/* Message */}
              <p className="text-muted-foreground text-center text-sm mb-6">
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">
                  &quot;{deleteConfirmRoom.name}&quot;
                </span>
                ? This will delete all files, documents, and data inside it.
                This action cannot be undone.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmRoom(null)}
                  className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteRoom(deleteConfirmRoom.id)}
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
