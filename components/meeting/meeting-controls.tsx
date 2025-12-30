"use client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  MoreVertical,
  Hand,
  Smile,
} from "lucide-react";
import { motion } from "framer-motion";

interface MeetingControlsProps {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}

export function MeetingControls({
  isVideoEnabled,
  isAudioEnabled,
  isScreenSharing,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onLeave,
}: MeetingControlsProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-center gap-3 p-4 border-t border-gray-800 bg-[#1e1e1e]"
    >
      {/* Audio Toggle */}
      <button
        onClick={onToggleAudio}
        className={`relative p-4 rounded-full transition-all ${
          isAudioEnabled
            ? "bg-gray-700 hover:bg-gray-600 text-white"
            : "bg-red-500 hover:bg-red-600 text-white"
        }`}
        title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        {isAudioEnabled ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5" />
        )}
      </button>

      {/* Video Toggle */}
      <button
        onClick={onToggleVideo}
        className={`relative p-4 rounded-full transition-all ${
          isVideoEnabled
            ? "bg-gray-700 hover:bg-gray-600 text-white"
            : "bg-red-500 hover:bg-red-600 text-white"
        }`}
        title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {isVideoEnabled ? (
          <Video className="w-5 h-5" />
        ) : (
          <VideoOff className="w-5 h-5" />
        )}
      </button>

      {/* Screen Share */}
      <button
        onClick={onToggleScreenShare}
        className={`p-4 rounded-full transition-all ${
          isScreenSharing
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-700 hover:bg-gray-600 text-white"
        }`}
        title={isScreenSharing ? "Stop sharing" : "Share screen"}
      >
        <MonitorUp className="w-5 h-5" />
      </button>

      {/* Raise Hand */}
      <button
        className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all"
        title="Raise hand"
      >
        <Hand className="w-5 h-5" />
      </button>

      {/* Reactions */}
      <button
        className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all"
        title="Reactions"
      >
        <Smile className="w-5 h-5" />
      </button>

      {/* More Options */}
      <button
        className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all"
        title="More options"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-700 mx-2" />

      {/* Leave Meeting */}
      <button
        onClick={onLeave}
        className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium transition-all flex items-center gap-2"
        title="Leave meeting"
      >
        <PhoneOff className="w-5 h-5" />
        <span>Leave</span>
      </button>
    </motion.div>
  );
}
