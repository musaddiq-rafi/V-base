"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { Check, Edit2, Clock } from "lucide-react";
import { useUser } from "@clerk/nextjs";

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
  
  // Get active users from Liveblocks
  const others = useOthers();
  const self = useSelf();

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

  const activeUsers = [
    ...(self ? [{ id: self.id, info: self.info }] : []),
    ...others.map(other => ({ id: other.id, info: other.info }))
  ];

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
      {/* Document Name */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleSaveName}
              className="text-lg font-semibold text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent px-1"
              autoFocus
              disabled={isSaving}
            />
            {isSaving && (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors group"
          >
            {document.name}
            <Edit2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Last Saved & Active Users */}
      <div className="flex items-center gap-6">
        {/* Last Saved */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Saved {formatLastSaved(document.updatedAt)}</span>
        </div>

        {/* Active Collaborators */}
        {activeUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {activeUsers.length} {activeUsers.length === 1 ? "user" : "users"}
            </span>
            <div className="flex -space-x-2">
              {activeUsers.slice(0, 5).map((user, index) => (
                <div
                  key={user.id}
                  className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold"
                  style={{ zIndex: activeUsers.length - index }}
                  title={user.info?.name || "Anonymous"}
                >
                  {user.info?.name?.charAt(0).toUpperCase() || "?"}
                </div>
              ))}
              {activeUsers.length > 5 && (
                <div
                  className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-semibold"
                  style={{ zIndex: 0 }}
                >
                  +{activeUsers.length - 5}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
