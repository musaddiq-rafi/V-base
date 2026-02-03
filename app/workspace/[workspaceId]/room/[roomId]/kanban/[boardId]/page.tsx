"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Loader2, Trello } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useEffect, Suspense } from "react";
import { RoomProvider } from "@liveblocks/react/suspense";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { ActiveUsersAvatars } from "@/components/liveblocks/active-users";

export default function KanbanBoardPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const roomId = params.roomId as Id<"rooms">;
  const boardId = params.boardId as Id<"kanbanBoards">;
  const { organization } = useOrganization();
  const { user } = useUser();

  const room = useQuery(api.rooms.getRoomById, { roomId });
  const board = useQuery(api.kanbanBoards.getKanbanBoardById, { boardId });
  const workspace = useQuery(
    api.workspaces.getWorkspaceByClerkOrgId,
    organization ? { clerkOrgId: organization.id } : "skip"
  );

  // Verify this board belongs to the current room
  useEffect(() => {
    if (board && board.roomId !== roomId) {
      // Board doesn't belong to this room, redirect
      router.push(`/workspace/${organization?.id}/room/${roomId}`);
    }
  }, [board, roomId, router, organization?.id]);

  if (!organization || !user || room === undefined || board === undefined || workspace === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-pink-500 dark:text-pink-400 animate-spin" />
      </div>
    );
  }

  if (room === null || board === null || workspace === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Board not found
          </h1>
          <Link
            href={`/workspace/${organization.id}/room/${roomId}`}
            className="text-pink-500 dark:text-pink-400 hover:text-pink-400 dark:hover:text-pink-300 font-medium"
          >
            Return to Room
          </Link>
        </div>
      </div>
    );
  }

  // Create unique room ID for Liveblocks
  const liveblocksRoomId = `kanban:${boardId}`;

  return (
    <RoomProvider
      id={liveblocksRoomId}
      initialPresence={{
        cursor: null,
      }}
      initialStorage={{
        columns: [],
      }}
    >
      <div className="fixed inset-0 flex flex-col bg-background">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/workspace/${organization.id}/room/${roomId}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Trello className="w-5 h-5 text-pink-500 dark:text-pink-400" />
                <span className="font-semibold text-foreground">{board.name}</span>
              </div>
            </div>

            {/* Active Users */}
            <Suspense fallback={null}>
              <ActiveUsersAvatars />
            </Suspense>
          </div>
        </motion.header>

        {/* Kanban Board */}
        <div className="flex-1 relative overflow-hidden">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-pink-500 dark:text-pink-400 animate-spin" />
              </div>
            }
          >
            <KanbanBoard />
          </Suspense>
        </div>
      </div>
    </RoomProvider>
  );
}
