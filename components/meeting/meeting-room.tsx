"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LiveKitProvider } from "@/providers/livekit-provider";
import { MeetingSelector } from "./meeting-selector";
import { MeetingLobby } from "./meeting-lobby";
import { MeetingStageWithLiveKit } from "./meeting-stage";

interface MeetingRoomProps {
  roomId: Id<"rooms">;
  roomName: string;
  workspaceId: string;
}

export type MeetingState = "selecting" | "lobby" | "in-meeting" | "ended";

export function MeetingRoom({
  roomId,
  roomName,
  workspaceId,
}: MeetingRoomProps) {
  const { user } = useUser();
  const [meetingState, setMeetingState] = useState<MeetingState>("selecting");
  const [selectedMeetingId, setSelectedMeetingId] =
    useState<Id<"meetings"> | null>(null);
  const [selectedMeetingName, setSelectedMeetingName] = useState<string>("");
  const [livekitRoomName, setLivekitRoomName] = useState<string>("");
  const [meetingCreatedBy, setMeetingCreatedBy] = useState<string>("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Track if we're currently in a meeting to handle cleanup
  const isInMeetingRef = useRef(false);
  const meetingIdRef = useRef<Id<"meetings"> | null>(null);

  const joinMeeting = useMutation(api.meetings.joinMeeting);
  const leaveMeeting = useMutation(api.meetings.leaveMeeting);

  // Handle browser close/refresh - leave meeting before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInMeetingRef.current && meetingIdRef.current) {
        // Use sendBeacon for reliable cleanup on page unload
        const payload = JSON.stringify({ meetingId: meetingIdRef.current });
        navigator.sendBeacon("/api/leave-meeting", payload);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Cleanup on unmount as well
      if (isInMeetingRef.current && meetingIdRef.current) {
        leaveMeeting({ meetingId: meetingIdRef.current }).catch(console.error);
      }
    };
  }, [leaveMeeting]);

  const handleSelectMeeting = (
    meetingId: Id<"meetings">,
    meetingName: string,
    meetingLivekitRoomName: string,
    createdBy: string,
  ) => {
    setSelectedMeetingId(meetingId);
    setSelectedMeetingName(meetingName);
    // Use the authoritative room name passed from selector
    setLivekitRoomName(meetingLivekitRoomName);
    setMeetingCreatedBy(createdBy);
    setMeetingState("lobby");
  };

  const handleJoinMeeting = async () => {
    if (!selectedMeetingId) return;

    try {
      // joinMeeting now returns { livekitRoomName }
      const result = await joinMeeting({ meetingId: selectedMeetingId });

      // Update with the authoritative room name from the database
      // This ensures even if there was a stale value, we now have the correct one
      if (result.livekitRoomName) {
        setLivekitRoomName(result.livekitRoomName);
      }

      // Track that we're in a meeting for cleanup
      isInMeetingRef.current = true;
      meetingIdRef.current = selectedMeetingId;

      setMeetingState("in-meeting");
    } catch (error: any) {
      console.error("Failed to join meeting:", error);
      alert(error.message || "Failed to join meeting");
      // Go back to selector if meeting ended
      setMeetingState("selecting");
      setSelectedMeetingId(null);
      setLivekitRoomName("");
    }
  };

  const handleLeaveMeeting = useCallback(async () => {
    // Mark as not in meeting first to prevent duplicate leave calls
    isInMeetingRef.current = false;
    const meetingId = meetingIdRef.current;
    meetingIdRef.current = null;

    if (meetingId) {
      try {
        await leaveMeeting({ meetingId });
        console.log("[Meeting] Left meeting successfully");
      } catch (error) {
        console.error("Failed to leave meeting:", error);
      }
    }
    setMeetingState("ended");
  }, [leaveMeeting]);

  const handleBackToSelector = () => {
    setMeetingState("selecting");
    setSelectedMeetingId(null);
    setSelectedMeetingName("");
    setLivekitRoomName("");
    setMeetingCreatedBy("");
  };

  if (meetingState === "selecting") {
    return (
      <MeetingSelector
        roomId={roomId}
        roomName={roomName}
        workspaceId={workspaceId}
        onSelectMeeting={handleSelectMeeting}
      />
    );
  }

  if (meetingState === "lobby") {
    return (
      <MeetingLobby
        roomName={roomName}
        meetingName={selectedMeetingName}
        workspaceId={workspaceId}
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        onToggleVideo={() => setIsVideoEnabled(!isVideoEnabled)}
        onToggleAudio={() => setIsAudioEnabled(!isAudioEnabled)}
        onJoin={handleJoinMeeting}
        onBack={handleBackToSelector}
      />
    );
  }

  if (meetingState === "ended") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            You left the meeting
          </h1>
          <p className="text-muted-foreground mb-8">Thanks for joining!</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleBackToSelector}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl transition-colors"
            >
              Join Another Meeting
            </button>
            <a
              href={`/workspace/${workspaceId}`}
              className="px-6 py-3 bg-muted hover:bg-surface-hover text-foreground font-medium rounded-xl transition-colors"
            >
              Back to Workspace
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Validate we have all required data before rendering LiveKit
  if (!livekitRoomName || !selectedMeetingId || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 text-red-500 mx-auto mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            Missing meeting information
          </h1>
          <p className="text-muted-foreground mb-4">
            Unable to connect to the meeting.
          </p>
          <button
            onClick={handleBackToSelector}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Generate participant identity from user ID
  const participantIdentity = user.id;
  const participantName = user.fullName || user.username || "Anonymous User";

  return (
    <LiveKitProvider
      roomName={livekitRoomName}
      participantName={participantName}
      participantIdentity={participantIdentity}
      videoEnabled={isVideoEnabled}
      audioEnabled={isAudioEnabled}
      onDisconnected={() => {
        console.log("Disconnected from LiveKit room");
      }}
      onError={(error) => {
        console.error("LiveKit error:", error);
      }}
    >
      <MeetingStageWithLiveKit
        roomId={roomId}
        roomName={roomName}
        meetingId={selectedMeetingId}
        meetingName={selectedMeetingName}
        meetingCreatedBy={meetingCreatedBy}
        workspaceId={workspaceId}
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        onToggleVideo={() => setIsVideoEnabled(!isVideoEnabled)}
        onToggleAudio={() => setIsAudioEnabled(!isAudioEnabled)}
        onLeave={handleLeaveMeeting}
      />
    </LiveKitProvider>
  );
}
