"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrganization } from "@clerk/nextjs";
import { Suspense } from "react";
import { RoomProvider } from "@liveblocks/react/suspense";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (document === null || room === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Document not found
          </h1>
          <Link
            href={`/workspace/${organization.id}/room/${roomId}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Return to Room
          </Link>
        </div>
      </div>
    );
  }

  // Create unique Liveblocks room ID for this document
  const liveblocksRoomId = `doc:${documentId}`;

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
                href={`/workspace/${organization.id}/room/${roomId}`}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Documents</span>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  {document.name}
                </span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Editor Content */}
        <div className="flex-1 relative">
          <Suspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            }
          >
            <CollaborativeEditor documentId={documentId} />
          </Suspense>
        </div>
      </div>
    </RoomProvider>
  );
}
