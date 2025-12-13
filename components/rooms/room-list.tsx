"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Presentation,
  FileText,
  Code,
  Video,
  Loader2,
  Users,
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
};

// Color mapping for room types
const roomColors = {
  whiteboard: "bg-purple-100 text-purple-600",
  document: "bg-blue-100 text-blue-600",
  code: "bg-green-100 text-green-600",
  conference: "bg-orange-100 text-orange-600",
};

export function RoomList({ workspaceId, clerkOrgId }: RoomListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const rooms = useQuery(api.rooms.getRoomsByWorkspace, { workspaceId });

  if (rooms === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rooms</h2>
          <p className="text-gray-600 mt-1">
            {rooms.length} {rooms.length === 1 ? "room" : "rooms"} available
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Create Room
        </button>
      </div>

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <Presentation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No rooms yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first room to start collaborating
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
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

            return (
              <motion.div
                key={room._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() =>
                  router.push(
                    `/workspace/${clerkOrgId}/room/${room._id}`
                  )
                }
                className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
              >
                {/* Icon and Type */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full capitalize">
                    {room.type}
                  </span>
                </div>

                {/* Room Name */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {room.name}
                </h3>

                {/* Footer - Active Users (placeholder for now) */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>0 active</span>
                </div>
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
    </div>
  );
}
