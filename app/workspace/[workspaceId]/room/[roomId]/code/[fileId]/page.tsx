"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  FileCode,
  ChevronRight,
  Folder,
  Pencil,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { useOrganization } from "@clerk/nextjs";
import { RoomProvider } from "@liveblocks/react/suspense";
import { CodeEditor } from "@/components/code/code-editor";
import { ClientSideSuspense } from "@liveblocks/react";
import { ActiveUsersAvatars } from "@/components/liveblocks/active-users";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePresenceHeartbeat } from "@/hooks/use-presence-heartbeat";
import { PageLoader, InlineLoader } from "@/components/shared/page-loader";

// Editable filename component (Google Docs style)
function EditableFileName({
  fileId,
  currentName,
}: {
  fileId: Id<"codeFiles">;
  currentName: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rename = useMutation(api.codeFiles.rename);

  const isUntitled = currentName.startsWith("untitled");

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync external name changes
  useEffect(() => {
    if (!isEditing) setEditValue(currentName);
  }, [currentName, isEditing]);

  const handleSave = useCallback(async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === currentName) {
      setEditValue(currentName);
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await rename({ id: fileId, name: trimmed });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to rename:", err);
      setEditValue(currentName);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, currentName, fileId, rename]);

  const handleCancel = () => {
    setEditValue(currentName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          className="text-sm text-foreground bg-background border border-emerald-500 rounded px-1.5 py-0.5 outline-none min-w-[120px] max-w-[250px]"
        />
        {isSaving ? (
          <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
        ) : (
          <>
            <button
              onClick={handleSave}
              className="p-0.5 hover:bg-muted rounded text-emerald-500"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              className="p-0.5 hover:bg-muted rounded text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={`group/name flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted transition-colors ${
        isUntitled ? "text-muted-foreground italic" : "text-foreground"
      }`}
      title="Click to rename"
    >
      <span className="text-sm">{currentName}</span>
      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity" />
    </button>
  );
}

export default function CodeFilePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const roomId = params.roomId as Id<"rooms">;
  const fileId = params.fileId as Id<"codeFiles">;
  const { organization } = useOrganization();

  const file = useQuery(api.codeFiles.getFileById, { fileId });
  const room = useQuery(api.rooms.getRoomById, { roomId });
  const rename = useMutation(api.codeFiles.rename);
  const updateLanguage = useMutation(api.codeFiles.updateLanguage);

  // Presence heartbeat — track user is editing this code file
  usePresenceHeartbeat(
    file && room
      ? {
          workspaceId: file.workspaceId,
          location: "file",
          roomId: room._id,
          roomName: room.name,
          roomType: "code",
          fileId: fileId,
          fileName: file.name,
          path: `/workspace/${organization?.id || workspaceId}/room/${roomId}/code/${fileId}`,
        }
      : null,
  );

  // Fetch parent folder name if file is in a folder
  const parentFolder = useQuery(
    api.codeFiles.getFileById,
    file?.parentId ? { fileId: file.parentId } : "skip",
  );

  // Prompt to name file before leaving if still "untitled"
  const isUntitled = file?.name?.startsWith("untitled") ?? false;
  const [showRenamePrompt, setShowRenamePrompt] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  // Browser beforeunload warning for untitled files
  useEffect(() => {
    if (!isUntitled) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isUntitled]);

  // Focus rename input on prompt open
  useEffect(() => {
    if (showRenamePrompt && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [showRenamePrompt]);

  const handleBackNavigation = (url: string) => {
    if (isUntitled) {
      setRenameValue(file?.name || "");
      setPendingNavigation(url);
      setShowRenamePrompt(true);
    } else {
      router.push(url);
    }
  };

  const handleRenameAndNavigate = async () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== file?.name) {
      setIsRenaming(true);
      try {
        await rename({ id: fileId, name: trimmed });
      } catch (err) {
        console.error("Failed to rename:", err);
      } finally {
        setIsRenaming(false);
      }
    }
    setShowRenamePrompt(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  const handleSkipRename = () => {
    setShowRenamePrompt(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  const handleKeepEditing = () => {
    setShowRenamePrompt(false);
    setPendingNavigation(null);
  };

  const handleLanguageChange = async (newLang: string) => {
    try {
      await updateLanguage({ fileId, language: newLang });
    } catch (err) {
      console.error("Failed to update language:", err);
    }
  };

  if (!organization || file === undefined || room === undefined) {
    return <PageLoader label="Loading code editor..." />;
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
  const backUrl = `/workspace/${organization.id}/room/${roomId}`;

  return (
    <RoomProvider
      id={liveblocksRoomId}
      initialPresence={{
        cursor: null,
        selectedCell: null,
      }}
      initialStorage={{}}
    >
      <div className="fixed inset-0 flex flex-col bg-background-secondary">
        {/* Header Bar 1: Breadcrumb + Active Users */}
        <div className="shrink-0 h-10 bg-muted border-b border-border flex items-center justify-between px-3">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <button
              onClick={() => handleBackNavigation(backUrl)}
              className="hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <FileCode className="w-4 h-4 text-emerald-500" />
              <span>{room.name}</span>
            </button>
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
            <EditableFileName fileId={fileId} currentName={file.name} />
          </nav>

          {/* Active Users */}
          <div className="flex items-center">
            <ClientSideSuspense
              fallback={
                <div className="text-xs text-muted-foreground">Loading...</div>
              }
            >
              <ActiveUsersAvatars variant="dark" label="editing" />
            </ClientSideSuspense>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 relative min-h-0">
          <ClientSideSuspense
            fallback={
              <InlineLoader label="Loading editor..." />
            }
          >
            <CodeEditor
              fileId={fileId}
              roomId={roomId}
              workspaceId={file.workspaceId}
              language={file.language || "python"}
              fileName={file.name}
              closeUrl={backUrl}
              onClose={
                isUntitled ? () => handleBackNavigation(backUrl) : undefined
              }
              onLanguageChange={handleLanguageChange}
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

        {/* Rename Prompt Modal */}
        {showRenamePrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleKeepEditing}
            />
            <div className="relative bg-background-secondary border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Name your file
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Give your file a name before leaving, or keep the default.
                </p>
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameAndNavigate();
                    if (e.key === "Escape") handleKeepEditing();
                  }}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  placeholder="Enter file name..."
                />
              </div>
              <div className="flex items-center gap-3 px-6 pb-6">
                <button
                  onClick={handleKeepEditing}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium text-sm"
                >
                  Keep editing
                </button>
                <button
                  onClick={handleSkipRename}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors font-medium text-sm"
                >
                  Skip
                </button>
                <button
                  onClick={handleRenameAndNavigate}
                  disabled={isRenaming}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isRenaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save & Leave"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoomProvider>
  );
}
