"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Loader2, Presentation, FileCode } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrganization } from "@clerk/nextjs";
import { useEffect, Suspense } from "react";
import { RoomProvider } from "@liveblocks/react/suspense";
import { Whiteboard } from "@/components/whiteboard/excalidraw-board";
import { ActiveUsersAvatars } from "@/components/liveblocks/active-users";

import { DocumentList } from "@/components/document/document-list";
import { FileExplorer } from "@/components/code/file-explorer";
import { WhiteboardList } from "@/components/whiteboard/whiteboard-list";
import { MeetingRoom } from "@/components/meeting/meeting-room";
import { KanbanList } from "@/components/kanban/kanban-list";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const roomId = params.roomId as Id<"rooms">;
  const { organization } = useOrganization();

  const room = useQuery(api.rooms.getRoomById, { roomId });
  const workspace = useQuery(
    api.workspaces.getWorkspaceByClerkOrgId,
    organization ? { clerkOrgId: organization.id } : "skip",
  );

  // Verify this room belongs to the current workspace
  useEffect(() => {
    if (room && workspace && room.workspaceId !== workspace._id) {
      // Room doesn't belong to this workspace, redirect
      router.push(`/workspace/${organization?.id}`);
    }
  }, [room, workspace, router, organization?.id]);

  if (!organization || room === undefined || workspace === undefined) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
      </div>
    );
  }

  if (room === null || workspace === null) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Room not found
          </h1>
          <Link
            href={`/workspace/${organization.id}`}
            className="text-sky-400 hover:text-sky-300 font-medium"
          >
            Return to Workspace
          </Link>
        </div>
      </div>
    );
  }

  // Create unique room ID for Liveblocks (only for whiteboard)
  const liveblocksRoomId = `room:${roomId}`;

  // For document rooms, show document list instead of editor
  if (room.type === "document") {
    return (
      <div className="fixed inset-0 flex flex-col bg-[#0b0f1a]">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 z-50 bg-[#0b0f1a]/80 backdrop-blur-xl border-b border-white/10"
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/workspace/${organization.id}`}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-white">{room.name}</span>
                <span className="text-xs text-white/50 capitalize bg-white/10 px-2 py-1 rounded">
                  {room.type}
                </span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Document List */}
        <div className="flex-1 relative">
          <DocumentList
            roomId={roomId}
            workspaceId={organization.id}
            convexWorkspaceId={workspace._id}
          />
        </div>
      </div>
    );
  }

  // For code rooms, show file explorer instead of editor
  if (room.type === "code") {
    return (
      <div className="fixed inset-0 flex flex-col bg-[#0b0f1a]">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 z-50 bg-[#0b0f1a]/80 backdrop-blur-xl border-b border-white/10"
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/workspace/${organization.id}`}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-white">{room.name}</span>
                <span className="text-xs text-white/50 capitalize bg-white/10 px-2 py-1 rounded">
                  {room.type}
                </span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* File Explorer */}
        <div className="flex-1 relative">
          <FileExplorer
            roomId={roomId}
            workspaceId={organization.id}
            convexWorkspaceId={workspace._id}
          />
        </div>
      </div>
    );
  }

  // For conference rooms, show the meeting room
  if (room.type === "conference") {
    return (
      <MeetingRoom
        roomId={roomId}
        roomName={room.name}
        workspaceId={organization.id}
      />
    );
  }

  // For whiteboard rooms, show whiteboard list
  if (room.type === "whiteboard") {
    return (
      <div className="fixed inset-0 flex flex-col bg-[#0b0f1a]">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 z-50 bg-[#0b0f1a]/80 backdrop-blur-xl border-b border-white/10"
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/workspace/${organization.id}`}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-orange-400" />
                <span className="font-semibold text-white">{room.name}</span>
                <span className="text-xs text-white/50 capitalize bg-white/10 px-2 py-1 rounded">
                  {room.type}
                </span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Whiteboard List */}
        <div className="flex-1 relative">
          <WhiteboardList
            roomId={roomId}
            workspaceId={organization.id}
            convexWorkspaceId={workspace._id}
          />
        </div>
      </div>
    );
  }

  // For kanban rooms, show kanban list
  if (room.type === "kanban") {
    return (
      <div className="fixed inset-0 flex flex-col bg-[#0b0f1a]">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 z-50 bg-[#0b0f1a]/80 backdrop-blur-xl border-b border-white/10"
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/workspace/${organization.id}`}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-white">{room.name}</span>
                <span className="text-xs text-white/50 capitalize bg-white/10 px-2 py-1 rounded">
                  {room.type}
                </span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Kanban List */}
        <div className="flex-1 relative">
          <KanbanList
            roomId={roomId}
            workspaceId={organization.id}
            convexWorkspaceId={workspace._id}
          />
        </div>
      </div>
    );
  }

  // Fallback for any other room types
  return (
    <div className="fixed inset-0 flex flex-col bg-[#0b0f1a]">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-shrink-0 z-50 bg-[#0b0f1a]/80 backdrop-blur-xl border-b border-white/10"
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/workspace/${organization.id}`}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Presentation className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-white">{room.name}</span>
              <span className="text-xs text-white/50 capitalize bg-white/10 px-2 py-1 rounded">
                {room.type}
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-white/60">
          <p className="text-lg font-medium mb-2">Room Type: {room.type}</p>
          <p className="text-sm">This room type is not yet supported.</p>
        </div>
      </div>
    </div>
  );
}
