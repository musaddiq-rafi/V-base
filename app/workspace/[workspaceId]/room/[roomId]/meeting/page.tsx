"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useOrganization } from "@clerk/nextjs";
import { MeetingRoom } from "@/components/meeting/meeting-room";

export default function MeetingPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const roomId = params.roomId as Id<"rooms">;
  const { organization } = useOrganization();

  const room = useQuery(api.rooms.getRoomById, { roomId });
  const workspace = useQuery(
    api.workspaces.getWorkspaceByClerkOrgId,
    organization ? { clerkOrgId: organization.id } : "skip"
  );

  if (!organization || room === undefined || workspace === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-sky-500 dark:text-sky-400 animate-spin" />
      </div>
    );
  }

  if (room === null || workspace === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Meeting room not found
          </h1>
          <Link
            href={`/workspace/${organization.id}`}
            className="text-sky-500 dark:text-sky-400 hover:text-sky-400 dark:hover:text-sky-300 font-medium"
          >
            Return to Workspace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MeetingRoom
      roomId={roomId}
      roomName={room.name}
      workspaceId={workspaceId}
    />
  );
}
