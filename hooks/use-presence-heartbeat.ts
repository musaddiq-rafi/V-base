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

/**
 * Custom hook that tracks user presence within a workspace using an
 * event-driven approach (no polling). Presence is updated only when:
 *  - The user navigates to a new location (mount / location change)
 *  - The tab becomes visible again after being hidden
 *
 * Presence is cleared when:
 *  - The hook unmounts (e.g., navigating away)
 *  - The tab is closed (`beforeunload`)
 *  - The tab becomes hidden (`visibilitychange`)
 *
 * A server-side Convex cron job cleans up orphaned records from
 * browser crashes where cleanup events never fire.
 *
 * Pass `null` or `undefined` to skip updates (e.g., while data loads).
 */
export function usePresenceHeartbeat(location: PresenceLocation | null | undefined) {
  const { user } = useUser();
  const updatePresence = useMutation(api.userPresence.heartbeat);
  const clearPresence = useMutation(api.userPresence.clearPresence);
  const workspaceIdRef = useRef<Id<"workspaces"> | null>(null);

  // Track the latest workspaceId so we can clear on unmount even if location becomes null
  if (location?.workspaceId) {
    workspaceIdRef.current = location.workspaceId;
  }

  const sendPresence = useCallback(() => {
    if (!user || !location) return;

    updatePresence({
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
      // Silently ignore failures (e.g. auth expired)
    });
  }, [
    user,
    updatePresence,
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

  // Send presence update on mount / location change (event-driven, no interval)
  useEffect(() => {
    if (!location) return;
    sendPresence();
    // No interval — purely event-driven
  }, [sendPresence, location]);

  // Handle tab visibility + tab close + unmount
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Tab hidden → clear presence so others see user as offline
        clear();
      } else if (document.visibilityState === "visible") {
        // Tab visible again → re-announce presence
        sendPresence();
      }
    };

    const handleBeforeUnload = () => {
      clear();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Also clear when the hook unmounts (e.g., navigating away from workspace)
      clear();
    };
  }, [clear, sendPresence]);
}
