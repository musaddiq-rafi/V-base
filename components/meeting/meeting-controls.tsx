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
  Info,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MeetingControlsProps {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleScreenShare: () => void;
  onToggleRaiseHand: () => void;
  onLeave: () => void;
}

export function MeetingControls({
  isVideoEnabled,
  isAudioEnabled,
  isScreenSharing,
  isHandRaised,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onToggleRaiseHand,
  onLeave,
}: MeetingControlsProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-center gap-2 p-3 bg-[#202124]"
      >
        {/* Left Section - Meeting Info (optional placeholder) */}
        <div className="flex-1 hidden sm:block" />

        {/* Center Section - Main Controls */}
        <div className="flex items-center gap-2">
          {/* Audio Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleAudio}
                className={cn(
                  "relative w-12 h-12 rounded-full transition-all flex items-center justify-center",
                  isAudioEnabled
                    ? "bg-[#3c4043] hover:bg-[#4a4d51] text-white"
                    : "bg-[#ea4335] hover:bg-[#d33828] text-white",
                )}
              >
                {isAudioEnabled ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isAudioEnabled
                  ? "Turn off microphone (Ctrl+D)"
                  : "Turn on microphone (Ctrl+D)"}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Video Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleVideo}
                className={cn(
                  "relative w-12 h-12 rounded-full transition-all flex items-center justify-center",
                  isVideoEnabled
                    ? "bg-[#3c4043] hover:bg-[#4a4d51] text-white"
                    : "bg-[#ea4335] hover:bg-[#d33828] text-white",
                )}
              >
                {isVideoEnabled ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isVideoEnabled
                  ? "Turn off camera (Ctrl+E)"
                  : "Turn on camera (Ctrl+E)"}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Screen Share */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleScreenShare}
                className={cn(
                  "w-12 h-12 rounded-full transition-all flex items-center justify-center",
                  isScreenSharing
                    ? "bg-[#8ab4f8] hover:bg-[#7aa6e8] text-[#202124]"
                    : "bg-[#3c4043] hover:bg-[#4a4d51] text-white",
                )}
              >
                <MonitorUp className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isScreenSharing ? "Stop presenting" : "Present now"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Raise Hand */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleRaiseHand}
                className={cn(
                  "w-12 h-12 rounded-full transition-all flex items-center justify-center",
                  isHandRaised
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-[#3c4043] hover:bg-[#4a4d51] text-white",
                )}
              >
                <Hand className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isHandRaised ? "Lower hand" : "Raise hand"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Reactions */}
          {/* <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-12 h-12 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] text-white transition-all flex items-center justify-center">
                <Smile className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send a reaction</p>
            </TooltipContent>
          </Tooltip> */}

          {/* More Options */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button className="w-12 h-12 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] text-white transition-all flex items-center justify-center">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>More options</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="center"
              side="top"
              className="w-56 mb-2"
            >
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Info className="w-4 h-4 mr-2" />
                Meeting details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Divider */}
          <div className="w-px h-8 bg-[#5f6368] mx-2" />

          {/* Leave Meeting */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onLeave}
                className="px-5 py-3 rounded-full bg-[#ea4335] hover:bg-[#d33828] text-white font-medium transition-all flex items-center gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                <span className="hidden sm:inline">Leave</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Leave call</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Right Section - Time/Info (optional placeholder) */}
        <div className="flex-1 hidden sm:block" />
      </motion.div>
    </TooltipProvider>
  );
}
