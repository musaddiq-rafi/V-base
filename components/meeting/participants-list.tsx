"use client";

import { useState } from "react";
import Image from "next/image";
import { MicOff, VideoOff, MoreVertical, Crown, Hand } from "lucide-react";
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
    <div className="flex flex-col h-full bg-[#2b2d31]">
      {/* Tab Header */}
      <div className="border-b border-[#1e1f22]">
        <div className="flex">
          <button
            onClick={() => setActiveTab("in-call")}
            className={`flex-1 px-4 py-2.5 text-[13px] font-medium transition-colors relative ${
              activeTab === "in-call"
                ? "text-[#f2f3f5]"
                : "text-[#b5bac1] hover:text-[#f2f3f5]"
            }`}
          >
            In call ({participants.length})
            {activeTab === "in-call" && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#5865f2] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("raised-hands")}
            className={`flex-1 px-4 py-2.5 text-[13px] font-medium transition-colors relative ${
              activeTab === "raised-hands"
                ? "text-[#f2f3f5]"
                : "text-[#b5bac1] hover:text-[#f2f3f5]"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Hand className="w-3.5 h-3.5" />
              Raised
              {raisedHands.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-[#fee75c] text-[#1e1f22] rounded-full">
                  {raisedHands.length}
                </span>
              )}
            </span>
            {activeTab === "raised-hands" && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#fee75c] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-1.5">
        {activeTab === "in-call" ? (
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
          <>
            {raisedHands.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Hand className="w-10 h-10 text-[#4e5058] mb-3" />
                <p className="text-sm text-[#b5bac1]">No raised hands</p>
                <p className="text-xs text-[#4e5058] mt-1">
                  Participants can raise their hand to get attention
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
                    className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#35373c] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Queue Position */}
                      <div className="w-5 h-5 rounded bg-[#fee75c] flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-[#1e1f22]">
                          {hand.queuePosition}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div className="relative">
                        {hand.participantAvatar ? (
                          <Image
                            src={hand.participantAvatar}
                            alt={hand.participantName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center">
                            <span className="text-xs font-semibold text-white">
                              {hand.participantName.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#fee75c] border-2 border-[#2b2d31] flex items-center justify-center">
                          <Hand className="w-2 h-2 text-[#1e1f22]" />
                        </div>
                      </div>

                      {/* Name */}
                      <div>
                        <span className="text-[13px] font-medium text-[#f2f3f5]">
                          {hand.participantName}
                          {isSelf && (
                            <span className="text-[#b5bac1] ml-1">(You)</span>
                          )}
                        </span>
                        {participant?.isHost && (
                          <div className="flex items-center gap-1 text-[11px] text-[#b5bac1]">
                            <Crown className="w-3 h-3 text-[#fee75c]" />
                            Host
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin Lower Button */}
                    {isAdmin && !isSelf && (
                      <button
                        onClick={() => onLowerHand(hand.participantId)}
                        className="px-2.5 py-1 text-xs font-medium text-[#b5bac1] hover:text-[#f2f3f5] hover:bg-[#3f4147] rounded-md transition-colors"
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
    </div>
  );
}

function ParticipantRow({
  participant,
  showMediaStatus = true,
}: {
  participant: Participant;
  showMediaStatus?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#35373c] transition-colors group">
      <div className="flex items-center gap-2.5">
        {/* Avatar */}
        <div className="relative">
          {participant.avatar ? (
            <Image
              src={participant.avatar}
              alt={participant.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center">
              <span className="text-xs font-semibold text-white">
                {participant.name.charAt(0)}
              </span>
            </div>
          )}
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#23a559] border-2 border-[#2b2d31]" />
        </div>

        {/* Name & Role */}
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium text-[#f2f3f5]">
              {participant.isSelf
                ? `${participant.name} (You)`
                : participant.name}
            </span>
            {participant.isHost && <Crown className="w-3 h-3 text-[#fee75c]" />}
          </div>
          {participant.isHost && (
            <p className="text-[11px] text-[#b5bac1]">Host</p>
          )}
        </div>
      </div>

      {/* Status Icons */}
      {showMediaStatus && (
        <div className="flex items-center gap-0.5">
          {!participant.isAudioEnabled && (
            <div className="p-1 rounded">
              <MicOff className="w-3.5 h-3.5 text-[#ed4245]" />
            </div>
          )}
          {!participant.isVideoEnabled && (
            <div className="p-1 rounded">
              <VideoOff className="w-3.5 h-3.5 text-[#ed4245]" />
            </div>
          )}
          <button className="p-1 rounded text-[#4e5058] hover:text-[#b5bac1] hover:bg-[#3f4147] opacity-0 group-hover:opacity-100 transition-all">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
