"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface PresenceLocation {
  workspaceId: Id<"workspaces">;
  location: "workspace" | "room" | "file" | "meeting";
  roomId?: Id<"rooms">;
  roomName?: string;
  roomType?: string;
  fileId?: string;
  fileName?: string;
  meetingName?: string;
  path: string;
}

const HEARTBEAT_INTERVAL = 15_000; // 15 seconds

/**
 * Custom hook that sends periodic heartbeats to track user presence
 * within a workspace. Updates on mount, on location change, and
 * every 15 seconds. Clears presence on unmount and tab close.
 *
 * Pass `null` or `undefined` to skip heartbeats (e.g., while data loads).
 */
export function usePresenceHeartbeat(location: PresenceLocation | null | undefined) {
  const { user } = useUser();
  const heartbeat = useMutation(api.userPresence.heartbeat);
  const clearPresence = useMutation(api.userPresence.clearPresence);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const workspaceIdRef = useRef<Id<"workspaces"> | null>(null);

  // Track the latest workspaceId so we can clear on unmount even if location becomes null
  if (location?.workspaceId) {
    workspaceIdRef.current = location.workspaceId;
  }

  const sendHeartbeat = useCallback(() => {
    if (!user || !location) return;

    heartbeat({
      workspaceId: location.workspaceId,
      userName: user.fullName || user.firstName || "Unknown",
      userAvatar: user.imageUrl,
      location: location.location,
      roomId: location.roomId,
      roomName: location.roomName,
      roomType: location.roomType,
      fileId: location.fileId,
      fileName: location.fileName,
      meetingName: location.meetingName,
      path: location.path,
    }).catch(() => {
      // Silently ignore heartbeat failures (e.g. auth expired)
    });
  }, [
    user,
    heartbeat,
    location?.workspaceId,
    location?.location,
    location?.roomId,
    location?.roomName,
    location?.roomType,
    location?.fileId,
    location?.fileName,
    location?.meetingName,
    location?.path,
  ]);

  const clear = useCallback(() => {
    if (!user) return;
    const wsId = workspaceIdRef.current;
    if (!wsId) return;
    clearPresence({
      workspaceId: wsId,
    }).catch(() => {
      // Silently ignore clear failures
    });
  }, [user, clearPresence]);

  useEffect(() => {
    if (!location) return;

    // Send heartbeat immediately on mount / location change
    sendHeartbeat();

    // Set up periodic heartbeat
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Cleanup on unmount or location change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sendHeartbeat, location]);

  // Clear presence on tab close / navigation away
  useEffect(() => {
    const handleBeforeUnload = () => {
      clear();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Also clear when the hook unmounts (e.g., navigating away from workspace)
      clear();
    };
  }, [clear]);
}
