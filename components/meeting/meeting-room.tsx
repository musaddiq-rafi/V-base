"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { MeetingLobby } from "./meeting-lobby";
import { MeetingStage } from "./meeting-stage";

interface MeetingRoomProps {
  roomId: Id<"rooms">;
  roomName: string;
  workspaceId: string;
}

export type MeetingState = "lobby" | "in-meeting" | "ended";

export function MeetingRoom({
  roomId,
  roomName,
  workspaceId,
}: MeetingRoomProps) {
  const [meetingState, setMeetingState] = useState<MeetingState>("lobby");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const handleJoinMeeting = () => {
    setMeetingState("in-meeting");
  };

  const handleLeaveMeeting = () => {
    setMeetingState("ended");
  };

  if (meetingState === "lobby") {
    return (
      <MeetingLobby
        roomName={roomName}
        workspaceId={workspaceId}
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        onToggleVideo={() => setIsVideoEnabled(!isVideoEnabled)}
        onToggleAudio={() => setIsAudioEnabled(!isAudioEnabled)}
        onJoin={handleJoinMeeting}
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
              onClick={() => setMeetingState("lobby")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              Rejoin Meeting
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

  return (
    <MeetingStage
      roomId={roomId}
      roomName={roomName}
      workspaceId={workspaceId}
      isVideoEnabled={isVideoEnabled}
      isAudioEnabled={isAudioEnabled}
      onToggleVideo={() => setIsVideoEnabled(!isVideoEnabled)}
      onToggleAudio={() => setIsAudioEnabled(!isAudioEnabled)}
      onLeave={handleLeaveMeeting}
    />
  );
}
