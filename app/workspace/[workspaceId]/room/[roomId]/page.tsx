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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (room === null || workspace === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Room not found
          </h1>
          <Link
            href={`/workspace/${organization.id}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
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
      <div className="fixed inset-0 flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 z-50 bg-white border-b border-gray-200"
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/workspace/${organization.id}`}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900">{room.name}</span>
                <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
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
      <div className="fixed inset-0 flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 z-50 bg-white border-b border-gray-200"
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/workspace/${organization.id}`}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-gray-900">{room.name}</span>
                <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
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
      <div className="fixed inset-0 flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 z-50 bg-white border-b border-gray-200"
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/workspace/${organization.id}`}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-orange-600" />
                <span className="font-semibold text-gray-900">{room.name}</span>
                <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
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

  // Fallback for any other room types
  return (
    <div className="fixed inset-0 flex flex-col">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-shrink-0 z-50 bg-white border-b border-gray-200"
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/workspace/${organization.id}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <Presentation className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-900">{room.name}</span>
              <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
                {room.type}
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">Room Type: {room.type}</p>
          <p className="text-sm">This room type is not yet supported.</p>
        </div>
      </div>
    </div>
  );
}
