"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Loader2, Presentation } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrganization } from "@clerk/nextjs";
import { useEffect } from "react";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const roomId = params.roomId as Id<"rooms">;
  const { organization } = useOrganization();

  const room = useQuery(api.rooms.getRoomById, { roomId });
  const workspace = useQuery(
    api.workspaces.getWorkspaceByClerkOrgId,
    organization ? { clerkOrgId: organization.id } : "skip"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50"
      >
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/workspace/${organization.id}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Rooms</span>
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Presentation className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <span className="font-semibold text-gray-900 block">
                  {room.name}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {room.type} Room
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Dummy Whiteboard */}
      <main className="p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-6xl mx-auto"
        >
          {/* Whiteboard Container */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
            {/* Whiteboard Toolbar (Dummy) */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-black hover:bg-gray-800 cursor-pointer transition-colors" title="Pen" />
                <div className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-gray-400 cursor-pointer transition-colors" title="Eraser" />
                <div className="w-px h-6 bg-gray-300" />
                <div className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 cursor-pointer transition-colors" title="Red" />
                <div className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 cursor-pointer transition-colors" title="Blue" />
                <div className="w-8 h-8 rounded-lg bg-green-500 hover:bg-green-600 cursor-pointer transition-colors" title="Green" />
              </div>
              <div className="flex-1" />
              <span className="text-sm text-gray-500 font-medium">
                0 users active
              </span>
            </div>

            {/* Whiteboard Canvas Area */}
            <div className="relative bg-white h-[calc(100vh-16rem)] flex items-center justify-center">
              {/* Grid Background */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #f0f0f0 1px, transparent 1px),
                    linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
                  `,
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Dummy Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative z-10 text-center"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
                  <Presentation className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-3">
                  THIS IS A WHITEBOARD
                </h2>
                <p className="text-gray-600 text-lg">
                  Collaborative whiteboard coming soon...
                </p>
                <div className="mt-8 flex items-center justify-center gap-4">
                  <div className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium text-sm">
                    Room Type: {room.type}
                  </div>
                  <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm">
                    Workspace: {workspace.name}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
