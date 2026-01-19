"use client";

import {
  useParticipants,
  useLocalParticipant,
  useTracks,
  VideoTrack,
  AudioTrack,
} from "@livekit/components-react";
import { Track, Participant, TrackPublication } from "livekit-client";
import { Mic, MicOff, VideoOff, Pin, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function LiveKitParticipantGrid() {
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
}

function ParticipantTile({
  participant,
  isLocal,
  cameraTrack,
  screenShareTrack,
}: ParticipantTileProps) {
  const isCameraEnabled = participant.isCameraEnabled;
  const isMicEnabled = participant.isMicrophoneEnabled;
  const isScreenSharing = participant.isScreenShareEnabled;

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
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>
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

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
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

      {/* Hover actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
