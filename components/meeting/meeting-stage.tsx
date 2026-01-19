"use client";

import { useState, useCallback, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { MeetingControls } from "./meeting-controls";
import {
  LiveKitParticipantGrid,
  AudioRenderer,
} from "./livekit-participant-grid";
import { MeetingChat } from "./meeting-chat";
import { ParticipantsList } from "./participants-list";
import { MessageSquare, Users, X, Loader2 } from "lucide-react";

interface MeetingStageProps {
  roomId: Id<"rooms">;
  roomName: string;
  meetingId: Id<"meetings">;
  meetingName: string;
  workspaceId: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onLeave: () => void;
}

type SidePanel = "chat" | "participants" | null;

// LiveKit-enabled meeting stage
export function MeetingStageWithLiveKit({
  roomId,
  roomName,
  meetingId,
  meetingName,
  workspaceId,
  isVideoEnabled,
  isAudioEnabled,
  onToggleVideo,
  onToggleAudio,
  onLeave,
}: MeetingStageProps) {
  const { user } = useUser();
  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Log room events for debugging
  useEffect(() => {
    if (!room) return;

    console.log("[Meeting Stage] Room connected:", room.name);
    console.log(
      "[Meeting Stage] Local participant:",
      localParticipant?.identity,
    );
    console.log("[Meeting Stage] Total participants:", participants.length);

    const handleParticipantConnected = (participant: any) => {
      console.log(
        "[Meeting Stage] Participant connected:",
        participant.identity,
      );
    };

    const handleParticipantDisconnected = (participant: any) => {
      console.log(
        "[Meeting Stage] Participant disconnected:",
        participant.identity,
      );
    };

    const handleTrackSubscribed = (
      track: any,
      publication: any,
      participant: any,
    ) => {
      console.log(
        "[Meeting Stage] Track subscribed:",
        track.kind,
        "from",
        participant.identity,
      );
    };

    const handleTrackUnsubscribed = (
      track: any,
      publication: any,
      participant: any,
    ) => {
      console.log(
        "[Meeting Stage] Track unsubscribed:",
        track.kind,
        "from",
        participant.identity,
      );
    };

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(
        RoomEvent.ParticipantDisconnected,
        handleParticipantDisconnected,
      );
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    };
  }, [room, localParticipant, participants]);

  const toggleSidePanel = (panel: SidePanel) => {
    setSidePanel((current) => (current === panel ? null : panel));
  };

  const handleToggleScreenShare = useCallback(async () => {
    if (!localParticipant) return;

    try {
      if (isScreenSharing) {
        await localParticipant.setScreenShareEnabled(false);
      } else {
        await localParticipant.setScreenShareEnabled(true);
      }
      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      console.error("Failed to toggle screen share:", error);
    }
  }, [localParticipant, isScreenSharing]);

  const handleToggleVideo = useCallback(async () => {
    if (!localParticipant) return;

    try {
      await localParticipant.setCameraEnabled(!isVideoEnabled);
      onToggleVideo();
    } catch (error) {
      console.error("Failed to toggle video:", error);
    }
  }, [localParticipant, isVideoEnabled, onToggleVideo]);

  const handleToggleAudio = useCallback(async () => {
    if (!localParticipant) return;

    try {
      await localParticipant.setMicrophoneEnabled(!isAudioEnabled);
      onToggleAudio();
    } catch (error) {
      console.error("Failed to toggle audio:", error);
    }
  }, [localParticipant, isAudioEnabled, onToggleAudio]);

  // Convert LiveKit participants to our format
  const formattedParticipants = participants.map((p) => ({
    id: p.identity,
    name: p.name || p.identity,
    avatar: undefined,
    isVideoEnabled: p.isCameraEnabled,
    isAudioEnabled: p.isMicrophoneEnabled,
    isScreenSharing: p.isScreenShareEnabled,
    isSelf: p.isLocal,
  }));

  const participantCount = participants.length;

  return (
    <div className="h-screen bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between h-14 px-4 border-b border-gray-800"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div>
            <h1 className="font-semibold text-white text-sm">{meetingName}</h1>
            <p className="text-xs text-gray-400">
              {roomName} • {participantCount} participant
              {participantCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleSidePanel("participants")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              sidePanel === "participants"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm">{participantCount}</span>
          </button>
          <button
            onClick={() => toggleSidePanel("chat")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              sidePanel === "chat"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <LiveKitParticipantGrid />
        </div>

        {/* Side Panel */}
        {sidePanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-l border-gray-800 bg-[#1e1e1e] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="font-semibold text-white">
                {sidePanel === "chat" ? "Chat" : "Participants"}
              </h2>
              <button
                onClick={() => setSidePanel(null)}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {sidePanel === "chat" && <MeetingChat roomId={roomId} />}
              {sidePanel === "participants" && (
                <ParticipantsList participants={formattedParticipants} />
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Audio Renderer for remote participants */}
      <AudioRenderer />

      {/* Controls Bar */}
      <MeetingControls
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        isScreenSharing={isScreenSharing}
        onToggleVideo={handleToggleVideo}
        onToggleAudio={handleToggleAudio}
        onToggleScreenShare={handleToggleScreenShare}
        onLeave={onLeave}
      />
    </div>
  );
}

// Fallback/loading stage (shown briefly while connecting)
export function MeetingStage({
  roomId,
  roomName,
  meetingId,
  meetingName,
  workspaceId,
  isVideoEnabled,
  isAudioEnabled,
  onToggleVideo,
  onToggleAudio,
  onLeave,
}: MeetingStageProps) {
  return (
    <div className="h-screen bg-[#1a1a1a] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Connecting to meeting...</p>
      </div>
    </div>
  );
}
