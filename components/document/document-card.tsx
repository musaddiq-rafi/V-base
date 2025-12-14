"use client";

import { useRouter } from "next/navigation";
import { FileText, Clock, User } from "lucide-react";
import { motion } from "framer-motion";

interface DocumentCardProps {
  documentId: string;
  name: string;
  creatorName: string;
  lastEditorName: string | null;
  updatedAt: number;
  workspaceId: string; // Clerk org ID for navigation
  roomId: string;
}

export function DocumentCard({
  documentId,
  name,
  creatorName,
  lastEditorName,
  updatedAt,
  workspaceId,
  roomId,
}: DocumentCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(
      `/workspace/${workspaceId}/room/${roomId}/document/${documentId}`
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={handleClick}
      className="bg-white rounded-lg border border-gray-200 p-6 cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all"
    >
      {/* Document Icon and Name */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-2 text-sm text-gray-500">
        {/* Last Updated */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Updated {formatDate(updatedAt)}</span>
        </div>

        {/* Last Editor / Creator */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>
            {lastEditorName
              ? `Edited by ${lastEditorName}`
              : `Created by ${creatorName}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
