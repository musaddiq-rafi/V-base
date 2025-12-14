"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Edit2, Clock } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { ActiveUsersAvatars } from "@/components/liveblocks/active-users";

interface DocumentHeaderProps {
  documentId: Id<"documents">;
}

export function DocumentHeader({ documentId }: DocumentHeaderProps) {
  const document = useQuery(api.documents.getDocumentById, { documentId });
  const updateDocumentName = useMutation(api.documents.updateDocumentName);
  const updateLastEdited = useMutation(api.documents.updateLastEdited);
  const { user } = useUser();
  
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
    }, 30000); // Every 30 seconds

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

  const formatLastSaved = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!document) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#f9fbfd] border-b border-gray-200">
      {/* Document Name */}
      <div className="flex items-center gap-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleSaveName}
              className="text-base text-gray-900 border-b border-blue-500 outline-none bg-transparent px-1 py-0.5"
              autoFocus
              disabled={isSaving}
            />
            {isSaving && (
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-base text-gray-900 hover:bg-gray-100 px-2 py-1 rounded transition-colors group"
          >
            {document.name}
            <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Last Saved & Active Users */}
      <div className="flex items-center gap-4">
        {/* Last Saved */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Saved {formatLastSaved(document.updatedAt)}</span>
        </div>

        {/* Active Collaborators */}
        <ActiveUsersAvatars />
      </div>
    </div>
  );
}
