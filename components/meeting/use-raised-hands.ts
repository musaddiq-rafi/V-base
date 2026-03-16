"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { Participant, DataPacket_Kind, RoomEvent } from "livekit-client";

export interface RaisedHandInfo {
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  raisedAt: number;
  queuePosition: number;
}

interface ParticipantMetadata {
  avatar?: string;
  handRaised?: boolean;
  handRaisedAt?: number;
}

interface LowerHandMessage {
  type: "lower_hand";
  targetParticipantId: string;
}

/**
 * Parse participant metadata safely
 */
function parseMetadata(participant: Participant): ParticipantMetadata {
  try {
    if (!participant.metadata) return {};
    return JSON.parse(participant.metadata) as ParticipantMetadata;
  } catch {
    return {};
  }
}

/**
 * Hook to manage raised hands state across all meeting participants
 * Uses LiveKit participant metadata for real-time sync
 */
export function useRaisedHands() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [isLocalHandRaised, setIsLocalHandRaised] = useState(false);

  // Compute raised hands queue from all participants' metadata
  const raisedHands = useMemo((): RaisedHandInfo[] => {
    const hands: RaisedHandInfo[] = [];

    for (const participant of participants) {
      const metadata = parseMetadata(participant);
      if (metadata.handRaised && metadata.handRaisedAt) {
        hands.push({
          participantId: participant.identity,
          participantName: participant.name || participant.identity,
          participantAvatar: metadata.avatar,
          raisedAt: metadata.handRaisedAt,
          queuePosition: 0, // Will be set after sorting
        });
      }
    }

    // Sort by timestamp (earliest first) and assign queue positions
    hands.sort((a, b) => a.raisedAt - b.raisedAt);
    hands.forEach((hand, index) => {
      hand.queuePosition = index + 1;
    });

    return hands;
  }, [participants]);

  // Sync local state with metadata (in case of re-renders or reconnects)
  useEffect(() => {
    if (localParticipant) {
      const metadata = parseMetadata(localParticipant);
      setIsLocalHandRaised(metadata.handRaised === true);
    }
  }, [localParticipant]);

  // Lower own hand (used internally)
  const lowerOwnHand = useCallback(async () => {
    if (!localParticipant) return;

    const currentMetadata = parseMetadata(localParticipant);
    const newMetadata: ParticipantMetadata = {
      ...currentMetadata,
      handRaised: false,
      handRaisedAt: undefined,
    };

    try {
      await localParticipant.setMetadata(JSON.stringify(newMetadata));
      setIsLocalHandRaised(false);
    } catch (error) {
      console.error("[RaiseHand] Failed to lower hand:", error);
    }
  }, [localParticipant]);

  // Listen for "lower_hand" data messages from admin
  useEffect(() => {
    if (!room || !localParticipant) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: Participant,
    ) => {
      try {
        const decoder = new TextDecoder();
        const message = JSON.parse(decoder.decode(payload)) as LowerHandMessage;

        if (
          message.type === "lower_hand" &&
          message.targetParticipantId === localParticipant.identity
        ) {
          console.log("[RaiseHand] Admin requested to lower hand");
          lowerOwnHand();
        }
      } catch {
        // Not a JSON message or not our message type
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, localParticipant, lowerOwnHand]);

  // Toggle raise hand for local participant
  const toggleRaiseHand = useCallback(async () => {
    if (!localParticipant) return;

    const currentMetadata = parseMetadata(localParticipant);
    const newHandRaised = !currentMetadata.handRaised;

    const newMetadata: ParticipantMetadata = {
      ...currentMetadata,
      handRaised: newHandRaised,
      handRaisedAt: newHandRaised ? Date.now() : undefined,
    };

    try {
      await localParticipant.setMetadata(JSON.stringify(newMetadata));
      setIsLocalHandRaised(newHandRaised);
    } catch (error) {
      console.error("[RaiseHand] Failed to update metadata:", error);
    }
  }, [localParticipant]);

  // Get queue position for a specific participant
  const getQueuePosition = useCallback(
    (participantId: string): number | null => {
      const found = raisedHands.find((h) => h.participantId === participantId);
      return found ? found.queuePosition : null;
    },
    [raisedHands],
  );

  // Check if a specific participant has raised hand
  const isHandRaised = useCallback(
    (participantId: string): boolean => {
      return raisedHands.some((h) => h.participantId === participantId);
    },
    [raisedHands],
  );

  // Admin: Request another participant to lower their hand
  const requestLowerHand = useCallback(
    async (targetParticipantId: string) => {
      if (!localParticipant) return;

      const message: LowerHandMessage = {
        type: "lower_hand",
        targetParticipantId,
      };

      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(message));

      try {
        await localParticipant.publishData(data, {
          reliable: true,
        });
        console.log(
          "[RaiseHand] Sent lower hand request to:",
          targetParticipantId,
        );
      } catch (error) {
        console.error("[RaiseHand] Failed to send lower hand request:", error);
      }
    },
    [localParticipant],
  );

  return {
    raisedHands,
    isLocalHandRaised,
    toggleRaiseHand,
    getQueuePosition,
    isHandRaised,
    requestLowerHand,
    totalRaisedHands: raisedHands.length,
  };
}
