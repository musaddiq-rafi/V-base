"use client";

import { useEffect, useRef, useCallback } from "react";
import { ConnectionState, RoomEvent, Room } from "livekit-client";

/**
 * Plays a soft two-tone chime using the Web Audio API.
 * Frequencies chosen to mimic a Google Meet-style "ding" sound.
 */
function playChime() {
  try {
    const ctx = new AudioContext();

    // First tone — soft high note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 830;
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Second tone — slightly higher, delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 1050;
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.55);

    // Close context after sounds finish
    setTimeout(() => ctx.close(), 700);
  } catch {
    // AudioContext may be blocked by browser autoplay policy — silently ignore
  }
}

/**
 * Hook that plays a soft chime when:
 * 1. The local user's room connection is established
 * 2. A remote participant joins the room
 */
export function useJoinChime(room: Room | undefined) {
  const hasPlayedJoinChime = useRef(false);

  const handlePlayChime = useCallback(() => {
    playChime();
  }, []);

  // Play chime once when the local user's connection is fully established
  useEffect(() => {
    if (!room || hasPlayedJoinChime.current) return;

    const playOnceConnected = () => {
      if (hasPlayedJoinChime.current) return;
      hasPlayedJoinChime.current = true;
      // Small delay so it plays after the UI settles
      setTimeout(handlePlayChime, 300);
    };

    // If already connected (e.g. component mounted after connection), play immediately
    if (room.state === ConnectionState.Connected) {
      playOnceConnected();
    } else {
      // Wait for the room to finish connecting
      room.on(RoomEvent.Connected, playOnceConnected);
      return () => {
        room.off(RoomEvent.Connected, playOnceConnected);
      };
    }
  }, [room, handlePlayChime]);

  // Play chime when a remote participant connects
  useEffect(() => {
    if (!room) return;

    const onParticipantConnected = () => {
      handlePlayChime();
    };

    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    return () => {
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
    };
  }, [room, handlePlayChime]);
}
