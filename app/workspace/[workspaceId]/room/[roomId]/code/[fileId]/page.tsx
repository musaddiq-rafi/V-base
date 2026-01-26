"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  Loader2,
  FileCode,
  ChevronRight,
  Folder,
} from "lucide-react";
import Link from "next/link";
import { useOrganization } from "@clerk/nextjs";
import { RoomProvider } from "@liveblocks/react/suspense";
import { CodeEditor } from "@/components/code/code-editor";
import { ClientSideSuspense } from "@liveblocks/react";
import { ActiveUsersAvatars } from "@/components/liveblocks/active-users";

export default function CodeFilePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const roomId = params.roomId as Id<"rooms">;
  const fileId = params.fileId as Id<"codeFiles">;
  const { organization } = useOrganization();

  const file = useQuery(api.codeFiles.getFileById, { fileId });
  const room = useQuery(api.rooms.getRoomById, { roomId });

  // Fetch parent folder name if file is in a folder
  const parentFolder = useQuery(
    api.codeFiles.getFileById,
    file?.parentId ? { fileId: file.parentId } : "skip"
  );

  if (!organization || file === undefined || room === undefined) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (file === null || room === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            File not found
          </h1>
          <Link
            href={`/workspace/${organization.id}/room/${roomId}`}
            className="text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 font-medium"
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
      <div className="fixed inset-0 flex flex-col bg-background-secondary">
        {/* Header Bar 1: Breadcrumb + Active Users */}
        <div className="shrink-0 h-10 bg-muted border-b border-border flex items-center justify-between px-3">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link
              href={`/workspace/${organization.id}/room/${roomId}`}
              className="hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <FileCode className="w-4 h-4 text-emerald-500" />
              <span>{room.name}</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            {file.parentId && parentFolder && (
              <>
                <div className="flex items-center gap-1 text-muted-foreground/80">
                  <Folder className="w-3.5 h-3.5" />
                  <span>{parentFolder.name}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              </>
            )}
            <span className="text-foreground">{file.name}</span>
          </nav>

          {/* Active Users */}
          <div className="flex items-center">
            <ClientSideSuspense
              fallback={<div className="text-xs text-muted-foreground">Loading...</div>}
            >
              <ActiveUsersAvatars variant="dark" label="editing" />
            </ClientSideSuspense>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 relative min-h-0">
          <ClientSideSuspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-background-secondary">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading editor...
                  </span>
                </div>
              </div>
            }
          >
            <CodeEditor
              fileId={fileId}
              language={file.language || "javascript"}
              fileName={file.name}
              closeUrl={`/workspace/${organization.id}/room/${roomId}`}
            />
          </ClientSideSuspense>
        </div>

        {/* Status Bar */}
        <div className="shrink-0 h-6 bg-[#007acc] flex items-center justify-between px-3 text-xs text-white select-none">
          <div className="flex items-center gap-3">
            <span className="opacity-80">VBase Code Editor</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-80 capitalize">{file.language}</span>
            <span className="opacity-80">UTF-8</span>
          </div>
        </div>
      </div>
    </RoomProvider>
  );
}
