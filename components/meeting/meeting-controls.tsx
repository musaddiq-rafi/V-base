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
  Settings,
  Info,
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
        className="flex items-center justify-center py-3 px-4 bg-[#1e1f22]"
      >
        {/* Control pill */}
        <div className="flex items-center gap-1 px-2 py-1.5 bg-[#2b2d31] rounded-lg">
          {/* Audio Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleAudio}
                className={cn(
                  "w-10 h-10 rounded-lg transition-all flex items-center justify-center",
                  isAudioEnabled
                    ? "bg-transparent hover:bg-[#3f4147] text-[#b5bac1] hover:text-[#f2f3f5]"
                    : "bg-[#ed4245] hover:bg-[#d63a3d] text-white",
                )}
              >
                {isAudioEnabled ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-[#111214] text-[#e0e1e5] border-none text-xs"
            >
              {isAudioEnabled ? "Mute" : "Unmute"}
            </TooltipContent>
          </Tooltip>

          {/* Video Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleVideo}
                className={cn(
                  "w-10 h-10 rounded-lg transition-all flex items-center justify-center",
                  isVideoEnabled
                    ? "bg-transparent hover:bg-[#3f4147] text-[#b5bac1] hover:text-[#f2f3f5]"
                    : "bg-[#ed4245] hover:bg-[#d63a3d] text-white",
                )}
              >
                {isVideoEnabled ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-[#111214] text-[#e0e1e5] border-none text-xs"
            >
              {isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
            </TooltipContent>
          </Tooltip>

          {/* Screen Share */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleScreenShare}
                className={cn(
                  "w-10 h-10 rounded-lg transition-all flex items-center justify-center",
                  isScreenSharing
                    ? "bg-[#5865f2] hover:bg-[#4752c4] text-white"
                    : "bg-transparent hover:bg-[#3f4147] text-[#b5bac1] hover:text-[#f2f3f5]",
                )}
              >
                <MonitorUp className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-[#111214] text-[#e0e1e5] border-none text-xs"
            >
              {isScreenSharing ? "Stop Sharing" : "Share Screen"}
            </TooltipContent>
          </Tooltip>

          {/* Raise Hand */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleRaiseHand}
                className={cn(
                  "w-10 h-10 rounded-lg transition-all flex items-center justify-center",
                  isHandRaised
                    ? "bg-[#fee75c] hover:bg-[#ffd83d] text-[#1e1f22]"
                    : "bg-transparent hover:bg-[#3f4147] text-[#b5bac1] hover:text-[#f2f3f5]",
                )}
              >
                <Hand className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-[#111214] text-[#e0e1e5] border-none text-xs"
            >
              {isHandRaised ? "Lower Hand" : "Raise Hand"}
            </TooltipContent>
          </Tooltip>

          {/* More Options */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button className="w-10 h-10 rounded-lg bg-transparent hover:bg-[#3f4147] text-[#b5bac1] hover:text-[#f2f3f5] transition-all flex items-center justify-center">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-[#111214] text-[#e0e1e5] border-none text-xs"
              >
                More
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="center"
              side="top"
              className="w-48 mb-2 bg-[#111214] border-[#2b2d31]"
            >
              <DropdownMenuItem className="text-[#e0e1e5] hover:bg-[#3f4147] focus:bg-[#3f4147]">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2b2d31]" />
              <DropdownMenuItem className="text-[#e0e1e5] hover:bg-[#3f4147] focus:bg-[#3f4147]">
                <Info className="w-4 h-4 mr-2" />
                Meeting details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Separator */}
          <div className="w-px h-6 bg-[#3f4147] mx-1" />

          {/* Leave Meeting - Discord red disconnect */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onLeave}
                className="h-10 px-4 rounded-lg bg-[#ed4245] hover:bg-[#d63a3d] text-white font-medium transition-all flex items-center gap-2 text-[13px]"
              >
                <PhoneOff className="w-4 h-4" />
                <span className="hidden sm:inline">Leave</span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-[#111214] text-[#e0e1e5] border-none text-xs"
            >
              Disconnect
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
