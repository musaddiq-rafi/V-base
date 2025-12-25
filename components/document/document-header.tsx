"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { 
  FileText, 
  Star, 
  CloudOff, 
  Cloud,
  MoreVertical,
  Users,
  Share2,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { ActiveUsersAvatars } from "@/components/liveblocks/active-users";
import { useStatus } from "@liveblocks/react/suspense";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentHeaderProps {
  documentId: Id<"documents">;
}

export function DocumentHeader({ documentId }: DocumentHeaderProps) {
  const document = useQuery(api.documents.getDocumentById, { documentId });
  const updateDocumentName = useMutation(api.documents.updateDocumentName);
  const updateLastEdited = useMutation(api.documents.updateLastEdited);
  const { user } = useUser();
  const status = useStatus();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (document) {
      setName(document.name);
    }
  }, [document]);

  // Update last edited periodically
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      updateLastEdited({
        documentId,
        userId: user.id,
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [documentId, user, updateLastEdited]);

  const handleSaveName = async () => {
    if (!name.trim() || name === document?.name) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateDocumentName({
        documentId,
        name: name.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update document name:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setName(document?.name || "");
      setIsEditing(false);
    }
  };

  if (!document) {
    return (
      <div className="h-[52px] bg-[#F9FBFD] flex items-center justify-center">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-[#F9FBFD]">
      {/* Left Section - Logo and Document Name */}
      <div className="flex items-center gap-2">
        {/* Docs Logo */}
        <div className="flex items-center justify-center w-10 h-10 shrink-0">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>

        {/* Document Info */}
        <div className="flex flex-col">
          {/* Document Name */}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleSaveName}
                className="text-lg font-medium text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none px-0.5 -ml-0.5"
                autoFocus
                disabled={isSaving}
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-lg font-medium text-gray-900 hover:bg-gray-100 px-1 -ml-1 rounded transition-colors truncate max-w-[300px]"
              >
                {document.name}
              </button>
            )}
            {isSaving && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            )}
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Star className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Menu Bar */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <button className="px-2 py-0.5 hover:bg-gray-100 rounded transition-colors">
              File
            </button>
            <button className="px-2 py-0.5 hover:bg-gray-100 rounded transition-colors">
              Edit
            </button>
            <button className="px-2 py-0.5 hover:bg-gray-100 rounded transition-colors">
              View
            </button>
            <button className="px-2 py-0.5 hover:bg-gray-100 rounded transition-colors">
              Insert
            </button>
            <button className="px-2 py-0.5 hover:bg-gray-100 rounded transition-colors">
              Format
            </button>
            <button className="px-2 py-0.5 hover:bg-gray-100 rounded transition-colors">
              Tools
            </button>
          </div>
        </div>
      </div>

      {/* Right Section - Status and Actions */}
      <div className="flex items-center gap-2">
        {/* Sync Status */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-2">
          {status === "connected" ? (
            <>
              <Cloud className="w-4 h-4 text-green-600" />
              <span className="hidden sm:inline">Saved to cloud</span>
            </>
          ) : (
            <>
              <CloudOff className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Connecting...</span>
            </>
          )}
        </div>

        {/* Active Collaborators */}
        <ActiveUsersAvatars />

        {/* Share Button */}
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-9 px-5 text-sm font-medium gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>

        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem className="cursor-pointer">
              Version history
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              Download
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-red-600">
              Move to trash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
