"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import {
  useParticipants,
  useLocalParticipant,
  useTracks,
  VideoTrack,
  AudioTrack,
} from "@livekit/components-react";
import { Track, Participant, TrackPublication } from "livekit-client";
import {
  Mic,
  MicOff,
  VideoOff,
  Pin,
  PinOff,
  Hand,
  Maximize,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Parse participant metadata to extract avatar URL
function parseParticipantMetadata(metadata: string | undefined): {
  avatar?: string;
  handRaised?: boolean;
  handRaisedAt?: number;
} {
  if (!metadata) return {};
  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
}

interface LiveKitParticipantGridProps {
  getQueuePosition: (participantId: string) => number | null;
  isHandRaised: (participantId: string) => boolean;
}

export function LiveKitParticipantGrid({
  getQueuePosition,
  isHandRaised,
}: LiveKitParticipantGridProps) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [stagedParticipantId, setStagedParticipantId] = useState<string | null>(
    null,
  );
  const [fullscreenParticipantId, setFullscreenParticipantId] = useState<
    string | null
  >(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Get all video tracks (camera + screen share) - subscribe to all
  const videoTracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    {
      onlySubscribed: false,
    },
  );

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenParticipantId(null);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Auto-stage screen sharing participant
  useEffect(() => {
    const screenSharingParticipant = participants.find(
      (p) => p.isScreenShareEnabled,
    );
    if (screenSharingParticipant && !stagedParticipantId) {
      setStagedParticipantId(screenSharingParticipant.identity);
    }
  }, [participants, stagedParticipantId]);

  const handleStageToggle = useCallback((participantId: string) => {
    setStagedParticipantId((prev) =>
      prev === participantId ? null : participantId,
    );
  }, []);

  const handleFullscreen = useCallback(async (participantId: string) => {
    const element = document.getElementById(
      `participant-tile-${participantId}`,
    );
    if (element) {
      try {
        await element.requestFullscreen();
        setFullscreenParticipantId(participantId);
      } catch (error) {
        console.error("Failed to enter fullscreen:", error);
      }
    }
  }, []);

  const scrollCarousel = useCallback((direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 200;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);

  // Get staged participant data
  const stagedParticipant = stagedParticipantId
    ? participants.find((p) => p.identity === stagedParticipantId)
    : null;

  const stagedCameraTrack = stagedParticipant
    ? videoTracks.find(
        (t) =>
          t.participant.identity === stagedParticipant.identity &&
          t.source === Track.Source.Camera,
      )
    : undefined;

  const stagedScreenShareTrack = stagedParticipant
    ? videoTracks.find(
        (t) =>
          t.participant.identity === stagedParticipant.identity &&
          t.source === Track.Source.ScreenShare,
      )
    : undefined;

  // Non-staged participants
  const nonStagedParticipants = stagedParticipantId
    ? participants.filter((p) => p.identity !== stagedParticipantId)
    : participants;

  // Regular grid layout (no staging)
  if (!stagedParticipantId) {
    const getGridClass = () => {
      const count = participants.length;
      if (count === 1) return "grid-cols-1 max-w-2xl mx-auto";
      if (count === 2) return "grid-cols-2 max-w-4xl mx-auto";
      if (count <= 4) return "grid-cols-2";
      if (count <= 6) return "grid-cols-3";
      if (count <= 9) return "grid-cols-3";
      return "grid-cols-4";
    };

    return (
      <div className={cn("grid gap-3 h-full auto-rows-fr p-2", getGridClass())}>
        {participants.map((participant) => {
          const cameraTrack = videoTracks.find(
            (t) =>
              t.participant.identity === participant.identity &&
              t.source === Track.Source.Camera,
          );
          const screenShareTrack = videoTracks.find(
            (t) =>
              t.participant.identity === participant.identity &&
              t.source === Track.Source.ScreenShare,
          );

          return (
            <ParticipantTile
              key={participant.identity}
              participant={participant}
              isLocal={participant.isLocal}
              cameraTrack={cameraTrack}
              screenShareTrack={screenShareTrack}
              handRaisedPosition={getQueuePosition(participant.identity)}
              isHandRaised={isHandRaised(participant.identity)}
              isStaged={false}
              onStageToggle={handleStageToggle}
              onFullscreen={handleFullscreen}
            />
          );
        })}
      </div>
    );
  }

  // Staged layout
  return (
    <div className="flex flex-col h-full gap-3 p-2">
      {/* Staged participant (takes majority of space) */}
      {stagedParticipant && (
        <div className="flex-1 min-h-0">
          <ParticipantTile
            key={stagedParticipant.identity}
            participant={stagedParticipant}
            isLocal={stagedParticipant.isLocal}
            cameraTrack={stagedCameraTrack}
            screenShareTrack={stagedScreenShareTrack}
            handRaisedPosition={getQueuePosition(stagedParticipant.identity)}
            isHandRaised={isHandRaised(stagedParticipant.identity)}
            isStaged={true}
            onStageToggle={handleStageToggle}
            onFullscreen={handleFullscreen}
            className="h-full"
          />
        </div>
      )}

      {/* Carousel of other participants */}
      {nonStagedParticipants.length > 0 && (
        <div className="relative flex-shrink-0 h-32">
          {/* Left scroll button */}
          <button
            onClick={() => scrollCarousel("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-gray-800/90 hover:bg-gray-700 text-white flex items-center justify-center shadow-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Carousel container */}
          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-10 h-full"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {nonStagedParticipants.map((participant) => {
              const cameraTrack = videoTracks.find(
                (t) =>
                  t.participant.identity === participant.identity &&
                  t.source === Track.Source.Camera,
              );
              const screenShareTrack = videoTracks.find(
                (t) =>
                  t.participant.identity === participant.identity &&
                  t.source === Track.Source.ScreenShare,
              );

              return (
                <div
                  key={participant.identity}
                  className="flex-shrink-0 w-48 h-full"
                >
                  <ParticipantTile
                    participant={participant}
                    isLocal={participant.isLocal}
                    cameraTrack={cameraTrack}
                    screenShareTrack={screenShareTrack}
                    handRaisedPosition={getQueuePosition(participant.identity)}
                    isHandRaised={isHandRaised(participant.identity)}
                    isStaged={false}
                    onStageToggle={handleStageToggle}
                    onFullscreen={handleFullscreen}
                    isCarouselItem
                  />
                </div>
              );
            })}
          </div>

          {/* Right scroll button */}
          <button
            onClick={() => scrollCarousel("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-gray-800/90 hover:bg-gray-700 text-white flex items-center justify-center shadow-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

interface ParticipantTileProps {
  participant: Participant;
  isLocal: boolean;
  cameraTrack?: {
    participant: Participant;
    publication: TrackPublication;
    source: Track.Source;
  };
  screenShareTrack?: {
    participant: Participant;
    publication: TrackPublication;
    source: Track.Source;
  };
  handRaisedPosition: number | null;
  isHandRaised: boolean;
  isStaged: boolean;
  onStageToggle: (participantId: string) => void;
  onFullscreen: (participantId: string) => void;
  className?: string;
  isCarouselItem?: boolean;
}

function ParticipantTile({
  participant,
  isLocal,
  cameraTrack,
  screenShareTrack,
  handRaisedPosition,
  isHandRaised,
  isStaged,
  onStageToggle,
  onFullscreen,
  className,
  isCarouselItem = false,
}: ParticipantTileProps) {
  const isCameraEnabled = participant.isCameraEnabled;
  const isMicEnabled = participant.isMicrophoneEnabled;
  const isScreenSharing = participant.isScreenShareEnabled;

  // Parse metadata to get avatar
  const metadata = useMemo(
    () => parseParticipantMetadata(participant.metadata),
    [participant.metadata],
  );
  const avatarUrl = metadata.avatar;

  // Get display name
  const displayName = participant.name || participant.identity;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Determine what to show - prefer screen share if active
  const activeTrack = screenShareTrack || cameraTrack;
  const showVideo = activeTrack && (isScreenSharing || isCameraEnabled);
  const canFullscreen = showVideo; // Can fullscreen if has video

  return (
    <motion.div
      id={`participant-tile-${participant.identity}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative bg-[#202124] rounded-lg overflow-hidden group",
        isCarouselItem ? "h-full" : "min-h-[120px]",
        isStaged && "ring-2 ring-blue-500",
        className,
      )}
    >
      {/* Video or Avatar */}
      {showVideo && activeTrack ? (
        <div className="absolute inset-0">
          <VideoTrack
            trackRef={activeTrack}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#3c4043]">
          {avatarUrl ? (
            <div
              className={cn(
                "rounded-full overflow-hidden",
                isCarouselItem
                  ? "w-12 h-12"
                  : isStaged
                    ? "w-32 h-32"
                    : "w-20 h-20",
              )}
            >
              <Image
                src={avatarUrl}
                alt={displayName}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={cn(
                "rounded-full bg-[#5f6368] flex items-center justify-center",
                isCarouselItem
                  ? "w-12 h-12"
                  : isStaged
                    ? "w-32 h-32"
                    : "w-20 h-20",
              )}
            >
              <span
                className={cn(
                  "font-medium text-white",
                  isCarouselItem
                    ? "text-lg"
                    : isStaged
                      ? "text-4xl"
                      : "text-2xl",
                )}
              >
                {initials}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Screen share indicator */}
      {isScreenSharing && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-[#1a73e8] rounded text-xs text-white font-medium flex items-center gap-1">
          <Pin className="w-3 h-3" />
          Presenting
        </div>
      )}

      {/* Staged indicator */}
      {isStaged && !isScreenSharing && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 rounded text-xs text-white font-medium flex items-center gap-1">
          <Pin className="w-3 h-3" />
          Pinned
        </div>
      )}

      {/* Hover actions container - top right corner */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
        {/* Raised Hand Indicator */}
        {isHandRaised && handRaisedPosition !== null && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500 rounded-full">
              <span className="text-xs font-bold text-white">
                {handRaisedPosition}
              </span>
              <Hand className="w-3 h-3 text-white" />
            </div>
          </motion.div>
        )}

        {/* Three dot menu */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => onStageToggle(participant.identity)}
                className="flex items-center gap-2"
              >
                {isStaged ? (
                  <>
                    <PinOff className="w-4 h-4" />
                    <span>Unpin</span>
                  </>
                ) : (
                  <>
                    <Pin className="w-4 h-4" />
                    <span>Pin to stage</span>
                  </>
                )}
              </DropdownMenuItem>
              {canFullscreen && (
                <DropdownMenuItem
                  onClick={() => onFullscreen(participant.identity)}
                  className="flex items-center gap-2"
                >
                  <Maximize className="w-4 h-4" />
                  <span>Full screen</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bottom info bar - Google Meet style */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mic status */}
            {!isMicEnabled && (
              <div className="w-6 h-6 rounded-full bg-[#ea4335] flex items-center justify-center">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
            <span
              className={cn(
                "font-medium text-white truncate",
                isCarouselItem ? "text-xs max-w-20" : "text-sm",
              )}
            >
              {displayName}
              {isLocal && <span className="text-gray-300 ml-1">(You)</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Fullscreen button (bottom right) - only for video enabled participants */}
      {canFullscreen && (
        <button
          onClick={() => onFullscreen(participant.identity)}
          className="absolute bottom-2 right-2 w-8 h-8 rounded bg-black/50 hover:bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          title="Full screen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

// Audio renderer for all remote participants
export function AudioRenderer() {
  const audioTracks = useTracks([Track.Source.Microphone], {
    onlySubscribed: true,
  });

  return (
    <>
      {audioTracks
        .filter((track) => !track.participant.isLocal)
        .map((track) => (
          <AudioTrack key={track.publication.trackSid} trackRef={track} />
        ))}
    </>
  );
}
