"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrganization } from "@clerk/nextjs";
import { ClientSideSuspense, RoomProvider } from "@liveblocks/react/suspense";
import { CollaborativeEditor } from "@/components/document/collaborative-editor";

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const roomId = params.roomId as Id<"rooms">;
  const documentId = params.documentId as Id<"documents">;
  const { organization } = useOrganization();

  const document = useQuery(api.documents.getDocumentById, { documentId });
  const room = useQuery(api.rooms.getRoomById, { roomId });

  if (!organization || document === undefined || room === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-500 animate-spin" />
      </div>
    );
  }

  if (document === null || room === null) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Document not found
          </h1>
          <Link
            href={`/workspace/${organization.id}/room/${roomId}`}
            className="text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 font-medium"
          >
            Return to Room
          </Link>
        </div>
      </div>
    );
  }

  // Create unique Liveblocks room ID for this document
  const liveblocksRoomId = `doc:${documentId}`;

  console.log("🏠 Liveblocks Room ID:", liveblocksRoomId);

  return (
    <RoomProvider
      id={liveblocksRoomId}
      initialPresence={{
        cursor: null,
      }}
    >
      <div className="fixed inset-0 flex flex-col print:static print:block">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 z-50 bg-white dark:bg-background border-b border-gray-200 dark:border-white/10 print:hidden"
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/workspace/${organization.id}/room/${roomId}`}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Documents</span>
              </Link>
              <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {document.name}
                </span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto print:overflow-visible print:flex-none print:h-auto">
          <ClientSideSuspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-background">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-500 animate-spin" />
              </div>
            }
          >
            <CollaborativeEditor documentId={documentId} />
          </ClientSideSuspense>
        </div>
      </div>
    </RoomProvider>
  );
}
