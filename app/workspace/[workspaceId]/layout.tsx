"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChatSystem } from "@/components/chat/chat-system";
import { Id } from "@/convex/_generated/dataModel";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const fileId = params.fileId as string | undefined;
  const documentId = params.documentId as string | undefined;
  const whiteboardId = params.whiteboardId as string | undefined;

  const { setActive, isLoaded: isOrgListLoaded } = useOrganizationList();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();

  const workspace = useQuery(
    api.workspaces.getWorkspaceByClerkOrgId,
    workspaceId ? { clerkOrgId: workspaceId } : "skip"
  );
  const createWorkspace = useMutation(api.workspaces.createWorkspace);

  const codeFile = useQuery(
    api.codeFiles.getFileById,
    fileId ? { fileId: fileId as Id<"codeFiles"> } : "skip"
  );
  const document = useQuery(
    api.documents.getDocumentById,
    documentId ? { documentId: documentId as Id<"documents"> } : "skip"
  );
  const whiteboard = useQuery(
    api.whiteboards.getWhiteboardById,
    whiteboardId ? { whiteboardId: whiteboardId as Id<"whiteboards"> } : "skip"
  );

  const getOrCreateFileChannel = useMutation(
    api.channels.getOrCreateFileChannel
  );

  const activeFile = useMemo(() => {
    if (codeFile) {
      return {
        fileType: "code" as const,
        fileId: codeFile._id as Id<"codeFiles">,
        roomId: codeFile.roomId as Id<"rooms">,
        workspaceId: codeFile.workspaceId as Id<"workspaces">,
        name: codeFile.name,
      };
    }

    if (document) {
      return {
        fileType: "document" as const,
        fileId: document._id as Id<"documents">,
        roomId: document.roomId as Id<"rooms">,
        workspaceId: document.workspaceId as Id<"workspaces">,
        name: document.name,
      };
    }

    if (whiteboard) {
      return {
        fileType: "whiteboard" as const,
        fileId: whiteboard._id as Id<"whiteboards">,
        roomId: whiteboard.roomId as Id<"rooms">,
        workspaceId: whiteboard.workspaceId as Id<"workspaces">,
        name: whiteboard.name,
      };
    }

    return null;
  }, [codeFile, document, whiteboard]);

  const fileChannel = useQuery(
    api.channels.getFileChannel,
    activeFile
      ? {
          workspaceId: activeFile.workspaceId,
          roomId: activeFile.roomId,
          fileId: activeFile.fileId,
          fileType: activeFile.fileType,
        }
      : "skip"
  );

  const [fileChannelId, setFileChannelId] = useState<
    Id<"channels"> | null
  >(null);

  // Set the active organization when entering a workspace
  useEffect(() => {
    if (isOrgListLoaded && setActive && workspaceId) {
      // Only set if different from current
      if (organization?.id !== workspaceId) {
        setActive({ organization: workspaceId }).catch((error) => {
          console.error("Error setting active organization:", error);
          // If the org doesn't exist or user doesn't have access, redirect to dashboard
          router.push("/dashboard");
        });
      }
    }
  }, [isOrgListLoaded, setActive, workspaceId, organization?.id, router]);

  useEffect(() => {
    if (organization && workspace === null) {
      createWorkspace({
        name: organization.name,
        clerkOrgId: organization.id,
      }).catch((err: any) => console.error("Error creating workspace:", err));
    }
  }, [organization, workspace, createWorkspace]);

  useEffect(() => {
    if (!activeFile) {
      setFileChannelId(null);
      return;
    }

    if (fileChannel) {
      setFileChannelId(fileChannel._id);
      return;
    }

    if (fileChannel === null) {
      getOrCreateFileChannel({
        workspaceId: activeFile.workspaceId,
        roomId: activeFile.roomId,
        fileId: activeFile.fileId,
        fileType: activeFile.fileType,
      })
        .then((channelId) => setFileChannelId(channelId))
        .catch(console.error);
    }
  }, [activeFile, fileChannel, getOrCreateFileChannel]);

  useEffect(() => {
    setFileChannelId(null);
  }, [activeFile?.fileId, activeFile?.fileType]);

  // Show loading while setting up organization context
  if (!isOrgListLoaded || !isOrgLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Verify the organization is set correctly
  if (organization?.id !== workspaceId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium">Switching workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {workspace && (
        <ChatSystem
          workspaceId={workspace._id}
          activeFileChat={
            activeFile && fileChannelId
              ? {
                  channelId: fileChannelId,
                  name: activeFile.name,
                  fileType: activeFile.fileType,
                }
              : undefined
          }
        />
      )}
    </>
  );
}
