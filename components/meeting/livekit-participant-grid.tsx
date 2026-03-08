"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import {
  useParticipants,
  useLocalParticipant,
  useTracks,
  VideoTrack,
  AudioTrack,
  useIsSpeaking,
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
  MonitorUp,
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
  const gridContainerRef = useRef<HTMLDivElement>(null);

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

  // Smart grid layout calculation - Discord style
  const getGridLayout = useCallback((count: number) => {
    if (count === 1) return { cols: 1, rows: 1, maxW: "max-w-3xl" };
    if (count === 2) return { cols: 2, rows: 1, maxW: "max-w-5xl" };
    if (count === 3) return { cols: 3, rows: 1, maxW: "max-w-6xl" };
    if (count === 4) return { cols: 2, rows: 2, maxW: "" };
    if (count <= 6) return { cols: 3, rows: 2, maxW: "" };
    if (count <= 9) return { cols: 3, rows: 3, maxW: "" };
    return { cols: 4, rows: Math.ceil(count / 4), maxW: "" };
  }, []);

  // Regular grid layout (no staging)
  if (!stagedParticipantId) {
    const count = participants.length;
    const layout = getGridLayout(count);

    return (
      <div
        ref={gridContainerRef}
        className={cn(
          "grid h-full w-full p-3 gap-2 mx-auto place-content-center",
          layout.maxW,
        )}
        style={{
          gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
          gridAutoRows: "1fr",
        }}
      >
        <AnimatePresence mode="popLayout">
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
        </AnimatePresence>
      </div>
    );
  }

  // Staged layout (pinned participant)
  return (
    <div className="flex flex-col h-full gap-2 p-3">
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
        <div className="relative flex-shrink-0 h-36">
          {/* Left scroll button */}
          <button
            onClick={() => scrollCarousel("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Carousel container */}
          <div
            ref={carouselRef}
            className="flex gap-2 overflow-x-auto px-9 h-full"
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
                  className="flex-shrink-0 w-52 h-full"
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
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white flex items-center justify-center transition-colors"
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
  const isSpeaking = useIsSpeaking(participant);

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
  const canFullscreen = showVideo;

  return (
    <motion.div
      id={`participant-tile-${participant.identity}`}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "relative rounded-xl overflow-hidden group transition-shadow duration-200",
        isCarouselItem ? "h-full" : "min-h-[100px]",
        // Discord-style speaking glow
        isSpeaking
          ? "ring-2 ring-[#23a559] shadow-[0_0_12px_rgba(35,165,89,0.3)]"
          : isStaged
            ? "ring-2 ring-[#5865f2]"
            : "ring-1 ring-white/[0.06]",
        "bg-[#1e1f22]",
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
        <div className="absolute inset-0 flex items-center justify-center bg-[#2b2d31]">
          {avatarUrl ? (
            <div
              className={cn(
                "rounded-full overflow-hidden ring-4 ring-transparent",
                isSpeaking && "ring-[#23a559]/40",
                isCarouselItem
                  ? "w-14 h-14"
                  : isStaged
                    ? "w-28 h-28"
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
                "rounded-full flex items-center justify-center",
                isSpeaking
                  ? "bg-[#5865f2] ring-4 ring-[#23a559]/40"
                  : "bg-[#5865f2]",
                isCarouselItem
                  ? "w-14 h-14"
                  : isStaged
                    ? "w-28 h-28"
                    : "w-20 h-20",
              )}
            >
              <span
                className={cn(
                  "font-semibold text-white",
                  isCarouselItem
                    ? "text-lg"
                    : isStaged
                      ? "text-3xl"
                      : "text-xl",
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
        <div className="absolute top-2 left-2 px-2 py-1 bg-[#5865f2] rounded-md text-[11px] text-white font-medium flex items-center gap-1">
          <MonitorUp className="w-3 h-3" />
          Screen
        </div>
      )}

      {/* Pinned indicator */}
      {isStaged && !isScreenSharing && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-[#5865f2] rounded-md text-[11px] text-white font-medium flex items-center gap-1">
          <Pin className="w-3 h-3" />
          Pinned
        </div>
      )}

      {/* Hover actions container - top right corner */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
        {/* Raised Hand Indicator */}
        {isHandRaised && handRaisedPosition !== null && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex items-center gap-1 px-2 py-1 bg-[#fee75c] rounded-md">
              <span className="text-[11px] font-bold text-[#1e1f22]">
                {handRaisedPosition}
              </span>
              <Hand className="w-3 h-3 text-[#1e1f22]" />
            </div>
          </motion.div>
        )}

        {/* Three dot menu */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 rounded-md bg-black/60 hover:bg-black/80 flex items-center justify-center text-white/80 hover:text-white transition-colors">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => onStageToggle(participant.identity)}
                className="flex items-center gap-2 text-sm"
              >
                {isStaged ? (
                  <>
                    <PinOff className="w-3.5 h-3.5" />
                    <span>Unpin</span>
                  </>
                ) : (
                  <>
                    <Pin className="w-3.5 h-3.5" />
                    <span>Pin</span>
                  </>
                )}
              </DropdownMenuItem>
              {canFullscreen && (
                <DropdownMenuItem
                  onClick={() => onFullscreen(participant.identity)}
                  className="flex items-center gap-2 text-sm"
                >
                  <Maximize className="w-3.5 h-3.5" />
                  <span>Full screen</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bottom info bar - Discord style */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Mic indicator */}
            <div
              className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center",
                !isMicEnabled
                  ? "bg-[#ed4245]"
                  : isSpeaking
                    ? "bg-[#23a559]"
                    : "bg-black/50",
              )}
            >
              {!isMicEnabled ? (
                <MicOff className="w-3 h-3 text-white" />
              ) : (
                <Mic className="w-3 h-3 text-white" />
              )}
            </div>
            <span
              className={cn(
                "font-medium text-white truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
                isCarouselItem ? "text-xs max-w-24" : "text-[13px]",
              )}
            >
              {displayName}
              {isLocal && (
                <span className="text-white/50 ml-1 text-xs">(You)</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Fullscreen button (bottom right) */}
      {canFullscreen && (
        <button
          onClick={() => onFullscreen(participant.identity)}
          className="absolute bottom-2 right-2 w-7 h-7 rounded-md bg-black/50 hover:bg-black/70 flex items-center justify-center text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
          title="Full screen"
        >
          <Maximize className="w-3.5 h-3.5" />
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
