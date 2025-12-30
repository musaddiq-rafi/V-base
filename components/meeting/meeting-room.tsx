"use client";

import { useState } from "react";
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
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const joinMeeting = useMutation(api.meetings.joinMeeting);
  const leaveMeeting = useMutation(api.meetings.leaveMeeting);

  const handleSelectMeeting = (
    meetingId: Id<"meetings">,
    meetingName: string,
    meetingLivekitRoomName: string
  ) => {
    setSelectedMeetingId(meetingId);
    setSelectedMeetingName(meetingName);
    setLivekitRoomName(meetingLivekitRoomName);
    setMeetingState("lobby");
  };

  const handleJoinMeeting = async () => {
    if (!selectedMeetingId) return;

    try {
      await joinMeeting({ meetingId: selectedMeetingId });
      setMeetingState("in-meeting");
    } catch (error: any) {
      console.error("Failed to join meeting:", error);
      alert(error.message || "Failed to join meeting");
      // Go back to selector if meeting ended
      setMeetingState("selecting");
      setSelectedMeetingId(null);
    }
  };

  const handleLeaveMeeting = async () => {
    if (selectedMeetingId) {
      try {
        await leaveMeeting({ meetingId: selectedMeetingId });
      } catch (error) {
        console.error("Failed to leave meeting:", error);
      }
    }
    setMeetingState("ended");
  };

  const handleBackToSelector = () => {
    setMeetingState("selecting");
    setSelectedMeetingId(null);
    setSelectedMeetingName("");
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
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
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
          <h1 className="text-2xl font-bold text-white mb-2">
            You left the meeting
          </h1>
          <p className="text-gray-400 mb-8">Thanks for joining!</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleBackToSelector}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              Join Another Meeting
            </button>
            <a
              href={`/workspace/${workspaceId}`}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
            >
              Back to Workspace
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Generate participant identity from user ID
  const participantIdentity = user?.id || `guest-${Date.now()}`;
  const participantName = user?.fullName || user?.username || "Anonymous User";

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
        meetingId={selectedMeetingId!}
        meetingName={selectedMeetingName}
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
