"use client";

import { MicOff, Pin, MoreVertical } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  isSelf: boolean;
}

interface ParticipantGridProps {
  participants: Participant[];
  isScreenSharing: boolean;
}

export function ParticipantGrid({
  participants,
  isScreenSharing,
}: ParticipantGridProps) {
  // Determine grid layout based on participant count
  const getGridClass = () => {
    const count = participants.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    if (count <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  // If someone is screen sharing, show different layout
  if (isScreenSharing) {
    return (
      <div className="h-full flex gap-4">
        {/* Main screen share view */}
        <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Pin className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400">Screen sharing preview</p>
              <p className="text-sm text-gray-500 mt-1">
                Your screen will appear here when sharing
              </p>
            </div>
          </div>
        </div>

        {/* Participants sidebar */}
        <div className="w-48 flex flex-col gap-2">
          {participants.map((participant) => (
            <ParticipantTile
              key={participant.id}
              participant={participant}
              size="small"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full grid ${getGridClass()} gap-4 auto-rows-fr`}>
      {participants.map((participant) => (
        <ParticipantTile key={participant.id} participant={participant} />
      ))}
    </div>
  );
}

interface ParticipantTileProps {
  participant: Participant;
  size?: "normal" | "small";
}

function ParticipantTile({
  participant,
  size = "normal",
}: ParticipantTileProps) {
  const isSmall = size === "small";

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden group">
      {/* Video or Avatar */}
      <div className="absolute inset-0 flex items-center justify-center">
        {participant.isVideoEnabled ? (
          // Placeholder for actual video stream
          <div
            className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${
              isSmall ? "w-12 h-12" : "w-24 h-24"
            }`}
          >
            <span
              className={`font-bold text-white ${
                isSmall ? "text-lg" : "text-3xl"
              }`}
            >
              {participant.name.charAt(0)}
            </span>
          </div>
        ) : (
          <div
            className={`rounded-full bg-gray-700 flex items-center justify-center ${
              isSmall ? "w-12 h-12" : "w-24 h-24"
            }`}
          >
            <span
              className={`font-bold text-gray-400 ${
                isSmall ? "text-lg" : "text-3xl"
              }`}
            >
              {participant.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Overlay Controls - Show on hover */}
      {!isSmall && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Muted Indicator */}
      {!participant.isAudioEnabled && (
        <div
          className={`absolute ${
            isSmall ? "top-1 right-1" : "top-3 right-3"
          } p-1.5 rounded-full bg-red-500/20 backdrop-blur-sm`}
        >
          <MicOff
            className={`text-red-500 ${isSmall ? "w-3 h-3" : "w-4 h-4"}`}
          />
        </div>
      )}

      {/* Name Tag */}
      <div
        className={`absolute ${
          isSmall ? "bottom-1 left-1 right-1" : "bottom-3 left-3"
        }`}
      >
        <span
          className={`px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-white font-medium ${
            isSmall ? "text-xs" : "text-sm"
          }`}
        >
          {participant.isSelf ? "You" : participant.name}
        </span>
      </div>

      {/* Speaking Indicator Border */}
      {participant.isAudioEnabled && (
        <div className="absolute inset-0 rounded-xl border-2 border-transparent hover:border-blue-500/50 transition-colors" />
      )}
    </div>
  );
}
