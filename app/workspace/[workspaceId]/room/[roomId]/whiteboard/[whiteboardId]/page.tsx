"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Loader2, Presentation } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrganization, useUser } from "@clerk/nextjs";
import { Suspense, useEffect } from "react";
import { RoomProvider } from "@liveblocks/react/suspense";
import { Whiteboard } from "@/components/whiteboard/excalidraw-board";
import { ActiveUsersAvatars } from "@/components/liveblocks/active-users";

export default function WhiteboardPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const roomId = params.roomId as Id<"rooms">;
  const whiteboardId = params.whiteboardId as Id<"whiteboards">;
  const { organization } = useOrganization();
  const { user } = useUser();

  const whiteboard = useQuery(api.whiteboards.getWhiteboardById, { whiteboardId });
  const room = useQuery(api.rooms.getRoomById, { roomId });
  const recordEdit = useMutation(api.whiteboards.recordWhiteboardEdit);

  // Record edit when user interacts with whiteboard
  useEffect(() => {
    if (whiteboard && user) {
      const timer = setTimeout(() => {
        recordEdit({
          whiteboardId,
          userId: user.id,
        }).catch(console.error);
      }, 5000); // Record edit after 5 seconds of being on the page

      return () => clearTimeout(timer);
    }
  }, [whiteboard, user, whiteboardId, recordEdit]);

  if (!organization || whiteboard === undefined || room === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (whiteboard === null || room === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Whiteboard not found
          </h1>
          <Link
            href={`/workspace/${workspaceId}/room/${roomId}`}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Return to Room
          </Link>
        </div>
      </div>
    );
  }

  // Verify this whiteboard belongs to the current room
  if (whiteboard.roomId !== roomId) {
    router.push(`/workspace/${workspaceId}/room/${roomId}`);
    return null;
  }

  // Create unique room ID for Liveblocks
  const liveblocksRoomId = `whiteboard:${whiteboardId}`;

  return (
    <RoomProvider
      id={liveblocksRoomId}
      initialPresence={{
        cursor: null,
      }}
      initialStorage={{}}
    >
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
                href={`/workspace/${workspaceId}/room/${roomId}`}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-orange-600" />
                <span className="font-semibold text-gray-900">{whiteboard.name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Whiteboard
                </span>
              </div>
            </div>
            <Suspense fallback={<div className="text-sm text-gray-500">Loading...</div>}>
              <ActiveUsersAvatars />
            </Suspense>
          </div>
        </motion.header>

        {/* Whiteboard Content */}
        <div className="flex-1 relative">
          <Suspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
              </div>
            }
          >
            <Whiteboard roomId={whiteboardId} whiteboardId={whiteboardId} />
          </Suspense>
        </div>
      </div>
    </RoomProvider>
  );
}
