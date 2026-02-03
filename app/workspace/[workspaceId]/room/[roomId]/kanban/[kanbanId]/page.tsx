"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default function KanbanPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const roomId = params.roomId as Id<"rooms">;
  const kanbanId = params.kanbanId as Id<"kanbans">;
  const { organization } = useOrganization();
  const { user } = useUser();

  const kanban = useQuery(api.kanban.getKanbanById, { kanbanId });
  const room = useQuery(api.rooms.getRoomById, { roomId });
  const updateKanban = useMutation(api.kanban.updateKanban);

  const [name, setName] = useState("");

  useEffect(() => {
    if (kanban?.name) setName(kanban.name);
  }, [kanban?.name]);

  if (!organization || kanban === undefined || room === undefined) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (kanban === null || room === null) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Board not found
          </h1>
          <Link
            href={`/workspace/${organization.id}/room/${roomId}`}
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Return to Room
          </Link>
        </div>
      </div>
    );
  }

  const handleNameBlur = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === kanban.name) return;
    try {
      await updateKanban({
        kanbanId,
        name: trimmed,
        lastEditedBy: user?.id,
      });
    } catch (error) {
      console.error("Failed to rename kanban:", error);
      setName(kanban.name);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0b0f1a]">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-shrink-0 z-50 bg-[#0b0f1a]/80 backdrop-blur-xl border-b border-white/10"
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/workspace/${organization.id}/room/${roomId}`}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                className="bg-transparent text-white font-semibold focus:outline-none border-b border-transparent focus:border-emerald-400 transition-colors"
              />
              <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
                kanban
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex-1">
        <KanbanBoard kanbanId={kanbanId} content={kanban.content} />
      </div>
    </div>
  );
}
