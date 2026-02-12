"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
  meetingCreatedBy: string;
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
  meetingCreatedBy,
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

  // Get the meeting's chat channel for unread tracking
  const channel = useQuery(api.channels.getChannelByContext, {
    contextType: "meeting",
    contextId: meetingId,
  });

  // Get messages to calculate unread count
  const messages = useQuery(
    api.messages.getMessagesWithAuthors,
    channel ? { channelId: channel._id } : "skip"
  );

  // Track last read timestamp for unread badge
  const lastReadRef = useRef<number>(Date.now());
  const [unreadCount, setUnreadCount] = useState(0);

  // Mark as read mutation
  const markAsRead = useMutation(api.messages.markChannelAsRead);

  // Update unread count when messages change and chat is closed
  useEffect(() => {
    if (!messages || sidePanel === "chat") {
      setUnreadCount(0);
      return;
    }

    // Count messages after last read timestamp
    const newMessages = messages.filter(
      (msg) => msg.timestamp > lastReadRef.current && msg.authorId !== user?.id
    );
    setUnreadCount(newMessages.length);
  }, [messages, sidePanel, user?.id]);

  // When chat panel opens, reset unread count and mark as read
  useEffect(() => {
    if (sidePanel === "chat" && channel) {
      lastReadRef.current = Date.now();
      setUnreadCount(0);
      markAsRead({ channelId: channel._id });
    }
  }, [sidePanel, channel, markAsRead]);

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
    isHost: p.identity === meetingCreatedBy,
  }));

  const participantCount = participants.length;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between h-14 px-4 border-b border-border"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-sm">{meetingName}</h1>
            <p className="text-xs text-muted-foreground">
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
                ? "bg-sky-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm">{participantCount}</span>
          </button>
          <button
            onClick={() => toggleSidePanel("chat")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors relative ${
              sidePanel === "chat"
                ? "bg-sky-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {/* Unread badge */}
            {unreadCount > 0 && sidePanel !== "chat" && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-background">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
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
            className="h-full border-l border-border bg-background-secondary flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">
                {sidePanel === "chat" ? "Chat" : "Participants"}
              </h2>
              <button
                onClick={() => setSidePanel(null)}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {sidePanel === "chat" && <MeetingChat meetingId={meetingId} />}
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
    <div className="h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Connecting to meeting...</p>
      </div>
    </div>
  );
}
