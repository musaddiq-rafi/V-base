"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { X, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateDocumentModalProps {
  roomId: Id<"rooms">;
  workspaceId: Id<"workspaces">; // Convex workspace ID
  clerkOrgId: string; // Clerk org ID for navigation
  onClose: () => void;
}

export function CreateDocumentModal({
  roomId,
  workspaceId,
  clerkOrgId,
  onClose,
}: CreateDocumentModalProps) {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const createDocument = useMutation(api.documents.createDocument);
  const { user } = useUser();
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim() || !user) return;

    setIsCreating(true);
    try {
      const documentId = await createDocument({
        roomId,
        workspaceId,
        name: name.trim(),
        createdBy: user.id,
      });

      // Navigate to the new document
      router.push(
        `/workspace/${clerkOrgId}/room/${roomId}/document/${documentId}`
      );
    } catch (error) {
      console.error("Failed to create document:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isCreating) {
      handleCreate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background-secondary rounded-lg shadow-xl w-full max-w-md mx-4 border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            <h2 className="text-lg font-semibold text-foreground">
              Create New Document
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isCreating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <label
            htmlFor="document-name"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Document Name
          </label>
          <input
            id="document-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Project Proposal, Meeting Notes..."
            className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
            autoFocus
            disabled={isCreating}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Document"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
