"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Loader2, FileCode, Users } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrganization } from "@clerk/nextjs";
import { Suspense } from "react";
import { RoomProvider } from "@liveblocks/react/suspense";
import { CodeEditor } from "@/components/code/code-editor";
import { ClientSideSuspense } from "@liveblocks/react";

export default function CodeFilePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const roomId = params.roomId as Id<"rooms">;
  const fileId = params.fileId as Id<"codeFiles">;
  const { organization } = useOrganization();

  const file = useQuery(api.codeFiles.getFileById, { fileId });
  const room = useQuery(api.rooms.getRoomById, { roomId });

  if (!organization || file === undefined || room === undefined) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (file === null || room === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            File not found
          </h1>
          <Link
            href={`/workspace/${organization.id}/room/${roomId}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Return to Code Room
          </Link>
        </div>
      </div>
    );
  }

  // Create unique Liveblocks room ID for this code file
  const liveblocksRoomId = `code:${fileId}`;

  return (
    <RoomProvider
      id={liveblocksRoomId}
      initialPresence={{
        cursor: null,
      }}
      initialStorage={{}}
    >
      <div className="fixed inset-0 flex flex-col bg-[#1e1e1e]">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 z-50 bg-[#252526] border-b border-[#3c3c3c]"
        >
          <div className="flex items-center justify-between h-12 px-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/workspace/${organization.id}/room/${roomId}`}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Files</span>
              </Link>
              <div className="h-4 w-px bg-[#3c3c3c]" />
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-gray-200">
                  {file.name}
                </span>
                <span className="text-xs text-gray-500 capitalize bg-[#3c3c3c] px-2 py-0.5 rounded">
                  {file.language}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Active Users Placeholder */}
              <div className="flex items-center gap-1 text-gray-400">
                <Users className="w-4 h-4" />
                <span className="text-xs">Collaborating</span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Editor Content */}
        <div className="flex-1 relative">
          <ClientSideSuspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e]">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            }
          >
            <CodeEditor
              fileId={fileId}
              language={file.language || "javascript"}
            />
          </ClientSideSuspense>
        </div>
      </div>
    </RoomProvider>
  );
}
