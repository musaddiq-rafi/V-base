"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Loader2, Presentation, FileCode, Table } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrganization } from "@clerk/nextjs";
import { useEffect } from "react";
// Components
import { DocumentList } from "@/components/document/document-list";
import { FileExplorer } from "@/components/code/file-explorer";
import { WhiteboardList } from "@/components/whiteboard/whiteboard-list";
import { MeetingRoom } from "@/components/meeting/meeting-room";
// Merged Imports
import { KanbanList } from "@/components/kanban/kanban-list";
import { SpreadsheetList } from "@/components/spreadsheet/spreadsheet-list";

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

  useEffect(() => {
    if (room && workspace && room.workspaceId !== workspace._id) {
      router.push(`/workspace/${organization?.id}`);
    }
  }, [room, workspace, router, organization?.id]);

  if (!organization || room === undefined || workspace === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-sky-500 dark:text-sky-400 animate-spin" />
      </div>
    );
  }

  if (room === null || workspace === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Room not found</h1>
          <Link
            href={`/workspace/${organization.id}`}
            className="text-sky-500 dark:text-sky-400 hover:text-sky-400 dark:hover:text-sky-300 font-medium"
          >
            Return to Workspace
          </Link>
        </div>
      </div>
    );
  }

  // Document Rooms
  if (room.type === "document") {
    return (
      <div className="fixed inset-0 flex flex-col bg-background">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/workspace/${organization.id}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                <span className="font-semibold text-foreground">{room.name}</span>
                <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded">
                  {room.type}
                </span>
              </div>
            </div>
          </div>
        </motion.header>
        <div className="flex-1 relative">
          <DocumentList roomId={roomId} workspaceId={organization.id} convexWorkspaceId={workspace._id} />
        </div>
      </div>
    );
  }

  // Code Rooms
  if (room.type === "code") {
    return (
      <div className="fixed inset-0 flex flex-col bg-background">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/workspace/${organization.id}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span className="font-semibold text-foreground">{room.name}</span>
                <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded">
                  {room.type}
                </span>
              </div>
            </div>
          </div>
        </motion.header>
        <div className="flex-1 relative">
          <FileExplorer roomId={roomId} workspaceId={organization.id} convexWorkspaceId={workspace._id} />
        </div>
      </div>
    );
  }

  // Conference Rooms
  if (room.type === "conference") {
    return (
      <MeetingRoom roomId={roomId} roomName={room.name} workspaceId={organization.id} />
    );
  }

  // Whiteboard Rooms
  if (room.type === "whiteboard") {
    return (
      <div className="fixed inset-0 flex flex-col bg-background">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/workspace/${organization.id}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                <span className="font-semibold text-foreground">{room.name}</span>
                <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded">
                  {room.type}
                </span>
              </div>
            </div>
          </div>
        </motion.header>
        <div className="flex-1 relative">
          <WhiteboardList roomId={roomId} workspaceId={organization.id} convexWorkspaceId={workspace._id} />
        </div>
      </div>
    );
  }

  // Kanban Rooms (from rafi-dev)
  if (room.type === "kanban") {
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
                <Presentation className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-white">{room.name}</span>
                <span className="text-xs text-white/50 capitalize bg-white/10 px-2 py-1 rounded">
                  {room.type}
                </span>
              </div>
            </div>
          </div>
        </motion.header>
        <div className="flex-1 relative">
          <KanbanList roomId={roomId} workspaceId={organization.id} convexWorkspaceId={workspace._id} />
        </div>
      </div>
    );
  }

  // Spreadsheet Rooms (from main)
  if (room.type === "spreadsheet") {
    return (
      <div className="fixed inset-0 flex flex-col bg-background">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/workspace/${organization.id}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Table className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span className="font-semibold text-foreground">{room.name}</span>
                <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded">
                  {room.type}
                </span>
              </div>
            </div>
          </div>
        </motion.header>
        <div className="flex-1 relative">
          <SpreadsheetList roomId={roomId} workspaceId={organization.id} convexWorkspaceId={workspace._id} />
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-shrink-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/workspace/${organization.id}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Presentation className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              <span className="font-semibold text-foreground">{room.name}</span>
              <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded">
                {room.type}
              </span>
            </div>
          </div>
        </div>
      </motion.header>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Room Type: {room.type}</p>
          <p className="text-sm">This room type is not yet supported.</p>
        </div>
      </div>
    </div>
  );
}