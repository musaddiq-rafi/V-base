"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { MeetingControls } from "./meeting-controls";
import { ParticipantGrid } from "./participant-grid";
import { MeetingChat } from "./meeting-chat";
import { ParticipantsList } from "./participants-list";
import { MessageSquare, Users, X } from "lucide-react";

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
  const { user } = useUser();
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const toggleSidePanel = (panel: SidePanel) => {
    setSidePanel((current) => (current === panel ? null : panel));
  };

  // Mock participants for UI demonstration
  const mockParticipants = [
    {
      id: user?.id || "1",
      name: user?.fullName || user?.username || "You",
      avatar: user?.imageUrl,
      isVideoEnabled,
      isAudioEnabled,
      isScreenSharing: false,
      isSelf: true,
    },
  ];

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
              {roomName} • {mockParticipants.length} participant
              {mockParticipants.length !== 1 ? "s" : ""}
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
            <span className="text-sm">{mockParticipants.length}</span>
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
          <ParticipantGrid
            participants={mockParticipants}
            isScreenSharing={isScreenSharing}
          />
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
                <ParticipantsList participants={mockParticipants} />
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Controls Bar */}
      <MeetingControls
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        isScreenSharing={isScreenSharing}
        onToggleVideo={onToggleVideo}
        onToggleAudio={onToggleAudio}
        onToggleScreenShare={() => setIsScreenSharing(!isScreenSharing)}
        onLeave={onLeave}
      />
    </div>
  );
}
