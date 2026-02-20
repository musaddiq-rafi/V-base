"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MoreVertical,
  Crown,
  Hand,
  ChevronDown,
} from "lucide-react";
import { RaisedHandInfo } from "./use-raised-hands";

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
  raisedHands: RaisedHandInfo[];
  isAdmin: boolean;
  currentUserId?: string;
  onLowerHand: (participantId: string) => void;
}

type TabType = "in-call" | "raised-hands";

export function ParticipantsList({
  participants,
  raisedHands,
  isAdmin,
  currentUserId,
  onLowerHand,
}: ParticipantsListProps) {
  const [activeTab, setActiveTab] = useState<TabType>(
    raisedHands.length > 0 ? "raised-hands" : "in-call",
  );

  return (
    <div className="flex flex-col h-full">
      {/* Tab Header */}
      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab("in-call")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "in-call"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            In Call ({participants.length})
            {activeTab === "in-call" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("raised-hands")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "raised-hands"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Hand className="w-3.5 h-3.5" />
              Raised Hands
              {raisedHands.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                  {raisedHands.length}
                </span>
              )}
            </span>
            {activeTab === "raised-hands" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === "in-call" ? (
          // In Call Tab
          <>
            {participants.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                showMediaStatus
              />
            ))}
          </>
        ) : (
          // Raised Hands Tab
          <>
            {raisedHands.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Hand className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No raised hands</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Participants can raise their hand to get your attention
                </p>
              </div>
            ) : (
              raisedHands.map((hand) => {
                const participant = participants.find(
                  (p) => p.id === hand.participantId,
                );
                const isSelf = hand.participantId === currentUserId;

                return (
                  <div
                    key={hand.participantId}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Queue Position */}
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {hand.queuePosition}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div className="relative">
                        {hand.participantAvatar ? (
                          <Image
                            src={hand.participantAvatar}
                            alt={hand.participantName}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {hand.participantName.charAt(0)}
                            </span>
                          </div>
                        )}
                        {/* Hand indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-background-secondary flex items-center justify-center">
                          <Hand className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>

                      {/* Name */}
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {hand.participantName}
                          {isSelf && (
                            <span className="text-muted-foreground ml-1">
                              (You)
                            </span>
                          )}
                        </span>
                        {participant?.isHost && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Crown className="w-3 h-3 text-yellow-500" />
                            Host
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin Lower Button */}
                    {isAdmin && !isSelf && (
                      <button
                        onClick={() => onLowerHand(hand.participantId)}
                        className="px-3 py-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                      >
                        Lower
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
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

// Extracted participant row component for In Call tab
function ParticipantRow({
  participant,
  showMediaStatus = true,
}: {
  participant: Participant;
  showMediaStatus?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          {participant.avatar ? (
            <Image
              src={participant.avatar}
              alt={participant.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {participant.name.charAt(0)}
              </span>
            </div>
          )}
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
      {showMediaStatus && (
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
      )}
    </div>
  );
}
