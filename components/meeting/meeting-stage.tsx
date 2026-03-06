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
import { useRaisedHands, RaisedHandInfo } from "./use-raised-hands";
import { MessageSquare, Users, X, Hand } from "lucide-react";
import { PageLoader } from "@/components/shared/page-loader";

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

  // Raise hand state management
  const {
    raisedHands,
    isLocalHandRaised,
    toggleRaiseHand,
    getQueuePosition,
    isHandRaised,
    requestLowerHand,
    totalRaisedHands,
  } = useRaisedHands();

  // Check if current user is workspace admin
  const workspace = useQuery(api.workspaces.getWorkspaceByClerkOrgId, {
    clerkOrgId: workspaceId,
  });
  const isAdmin = user?.id === workspace?.ownerId;

  // Get the meeting's chat channel for unread tracking
  const channel = useQuery(api.channels.getChannelByContext, {
    contextType: "meeting",
    contextId: meetingId,
  });

  // Get messages to calculate unread count
  const messages = useQuery(
    api.messages.getMessagesWithAuthors,
    channel ? { channelId: channel._id } : "skip",
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
      (msg) => msg.timestamp > lastReadRef.current && msg.authorId !== user?.id,
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

  // Helper to parse participant metadata
  const parseMetadata = (metadata: string | undefined): { avatar?: string } => {
    if (!metadata) return {};
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  };

  // Convert LiveKit participants to our format
  const formattedParticipants = participants.map((p) => {
    const meta = parseMetadata(p.metadata);
    return {
      id: p.identity,
      name: p.name || p.identity,
      avatar: meta.avatar,
      isVideoEnabled: p.isCameraEnabled,
      isAudioEnabled: p.isMicrophoneEnabled,
      isScreenSharing: p.isScreenShareEnabled,
      isSelf: p.isLocal,
      isHost: p.identity === meetingCreatedBy,
    };
  });

  const participantCount = participants.length;

  return (
    <div className="h-screen bg-[#202124] flex flex-col">
      {/* Header - Google Meet style */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between h-14 px-4 bg-[#202124]"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div className="h-4 w-px bg-[#5f6368]" />
          <div>
            <h1 className="font-medium text-white text-sm">{meetingName}</h1>
            <p className="text-xs text-[#9aa0a6]">
              {roomName} • {participantCount} participant
              {participantCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleSidePanel("participants")}
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
              sidePanel === "participants"
                ? "bg-[#8ab4f8] text-[#202124]"
                : "bg-[#3c4043] text-white hover:bg-[#4a4d51]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{participantCount}</span>
          </button>
          <button
            onClick={() => toggleSidePanel("chat")}
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors relative ${
              sidePanel === "chat"
                ? "bg-[#8ab4f8] text-[#202124]"
                : "bg-[#3c4043] text-white hover:bg-[#4a4d51]"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {/* Unread badge */}
            {unreadCount > 0 && sidePanel !== "chat" && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#ea4335] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden bg-[#202124]">
        {/* Video Grid */}
        <div className="flex-1 p-2">
          <LiveKitParticipantGrid
            getQueuePosition={getQueuePosition}
            isHandRaised={isHandRaised}
          />
        </div>

        {/* Raised Hands Notification Badge */}
        {totalRaisedHands > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-20 left-4 z-10"
          >
            <button
              onClick={() => toggleSidePanel("participants")}
              className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg transition-colors"
            >
              <Hand className="w-4 h-4" />
              <span className="text-sm font-medium">
                Raised Hands ({totalRaisedHands})
              </span>
            </button>
          </motion.div>
        )}

        {/* Side Panel - Google Meet style */}
        {sidePanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-l border-[#3c4043] bg-[#202124] flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c4043]">
              <h2 className="font-medium text-white text-base">
                {sidePanel === "chat" ? "In-call messages" : "People"}
              </h2>
              <button
                onClick={() => setSidePanel(null)}
                className="p-2 rounded-full hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {sidePanel === "chat" && <MeetingChat meetingId={meetingId} />}
              {sidePanel === "participants" && (
                <ParticipantsList
                  participants={formattedParticipants}
                  raisedHands={raisedHands}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  onLowerHand={requestLowerHand}
                />
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
        isHandRaised={isLocalHandRaised}
        onToggleVideo={handleToggleVideo}
        onToggleAudio={handleToggleAudio}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleRaiseHand={toggleRaiseHand}
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
  return <PageLoader label="Connecting to meeting..." />;
}
