"use client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MoreVertical,
  Crown,
} from "lucide-react";

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  isSelf: boolean;
  isHost: boolean;
}

interface ParticipantsListProps {
  participants: Participant[];
}

export function ParticipantsList({ participants }: ParticipantsListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <p className="text-sm text-muted-foreground">
          {participants.length} participant
          {participants.length !== 1 ? "s" : ""} in the meeting
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {participant.name.charAt(0)}
                  </span>
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background-secondary" />
              </div>

              {/* Name & Role */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {participant.isSelf
                      ? `${participant.name} (You)`
                      : participant.name}
                  </span>
                  {participant.isHost && (
                    <Crown className="w-3.5 h-3.5 text-yellow-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {participant.isHost ? "Host" : "Participant"}
                </p>
              </div>
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded ${
                  participant.isAudioEnabled
                    ? "text-muted-foreground"
                    : "text-red-500 bg-red-500/10"
                }`}
              >
                {participant.isAudioEnabled ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </div>
              <div
                className={`p-1.5 rounded ${
                  participant.isVideoEnabled
                    ? "text-muted-foreground"
                    : "text-red-500 bg-red-500/10"
                }`}
              >
                {participant.isVideoEnabled ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <VideoOff className="w-4 h-4" />
                )}
              </div>
              <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Section */}
      <div className="p-4 border-t border-border">
        <button className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl transition-colors text-sm">
          Invite Participants
        </button>
      </div>
    </div>
  );
}
