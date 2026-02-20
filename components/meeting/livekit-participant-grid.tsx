"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  useParticipants,
  useLocalParticipant,
  useTracks,
  VideoTrack,
  AudioTrack,
} from "@livekit/components-react";
import { Track, Participant, TrackPublication } from "livekit-client";
import { Mic, MicOff, VideoOff, Pin, MoreVertical, Hand } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

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

  // Get all video tracks (camera + screen share) - subscribe to all
  const videoTracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    {
      onlySubscribed: false, // Allow unsubscribed tracks to trigger subscription
    },
  );

  // Debug: Log participants and tracks
  useEffect(() => {
    console.log("[LiveKit Grid] Participants:", participants.length);
    console.log("[LiveKit Grid] Video tracks:", videoTracks.length);
    participants.forEach((p) => {
      console.log(
        `[LiveKit Grid] Participant ${p.identity}: camera=${p.isCameraEnabled}, mic=${p.isMicrophoneEnabled}, local=${p.isLocal}`,
      );
    });
  }, [participants, videoTracks]);

  // Calculate grid layout based on participant count
  const getGridClass = () => {
    const count = participants.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    if (count <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  return (
    <div className={`grid ${getGridClass()} gap-3 h-full auto-rows-fr`}>
      {participants.map((participant) => {
        // Find tracks for this participant
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
          />
        );
      })}
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
}

function ParticipantTile({
  participant,
  isLocal,
  cameraTrack,
  screenShareTrack,
  handRaisedPosition,
  isHandRaised,
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

  // Debug logging for track state
  useEffect(() => {
    console.log(
      `[Tile ${participant.identity}] Camera enabled: ${isCameraEnabled}, Track exists: ${!!cameraTrack}`,
    );
    if (cameraTrack) {
      console.log(
        `[Tile ${participant.identity}] Track subscribed: ${cameraTrack.publication.isSubscribed}, Track: `,
        cameraTrack.publication.track,
      );
    }
  }, [participant.identity, isCameraEnabled, cameraTrack]);

  // Determine what to show - prefer screen share if active
  const activeTrack = screenShareTrack || cameraTrack;
  const showVideo = activeTrack && (isScreenSharing || isCameraEnabled);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-gray-900 rounded-xl overflow-hidden group min-h-[200px]"
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
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          {avatarUrl ? (
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-gray-700/50 shadow-xl">
              <Image
                src={avatarUrl}
                alt={displayName}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-4 ring-gray-700/50 shadow-xl">
              <span className="text-3xl font-bold text-white">{initials}</span>
            </div>
          )}
        </div>
      )}

      {/* Screen share indicator */}
      {isScreenSharing && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 rounded text-xs text-white font-medium flex items-center gap-1">
          <Pin className="w-3 h-3" />
          Presenting
        </div>
      )}

      {/* Camera off indicator */}
      {!isCameraEnabled && !isScreenSharing && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-gray-700/80 rounded text-xs text-gray-300 font-medium flex items-center gap-1">
          <VideoOff className="w-3 h-3" />
          Camera off
        </div>
      )}

      {/* Raised Hand Indicator - Google Meet style */}
      {isHandRaised && handRaisedPosition !== null && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute top-2 right-2 z-10"
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500 rounded-full shadow-lg">
            <span className="text-xs font-bold text-white">
              {handRaisedPosition}
            </span>
            <Hand className="w-3.5 h-3.5 text-white" />
          </div>
        </motion.div>
      )}

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex flex-col gap-1.5">
          {/* Raised hand banner (alternative position at bottom) */}
          {isHandRaised && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-1.5"
            >
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-500/90 rounded-lg">
                <Hand className="w-3 h-3 text-white" />
                <span className="text-xs font-medium text-white">
                  Hand raised
                </span>
              </div>
            </motion.div>
          )}

          {/* Name and mic status row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white truncate">
                {displayName}
                {isLocal && <span className="text-gray-400 ml-1">(You)</span>}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {isMicEnabled ? (
                <div className="w-6 h-6 rounded-full bg-gray-700/80 flex items-center justify-center">
                  <Mic className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hover actions */}
      <div
        className={`absolute top-2 ${isHandRaised ? "right-16" : "right-2"} opacity-0 group-hover:opacity-100 transition-opacity`}
      >
        <button className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Audio renderer for all remote participants - renders audio elements for each remote track
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
