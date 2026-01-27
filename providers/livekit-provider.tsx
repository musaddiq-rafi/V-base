"use client";

import "@livekit/components-styles";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
} from "@livekit/components-react";
import { Room, RoomEvent, ConnectionState } from "livekit-client";
import { ReactNode, useCallback, useEffect, useState } from "react";

interface LiveKitProviderProps {
  children: ReactNode;
  roomName: string;
  participantName: string;
  participantIdentity: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
}

async function fetchToken(
  roomName: string,
  participantName: string,
  participantIdentity: string,
): Promise<string> {
  const params = new URLSearchParams({
    room: roomName,
    username: participantName,
    identity: participantIdentity,
  });

  console.log(
    "[LiveKit] Fetching token for room:",
    roomName,
    "identity:",
    participantIdentity,
  );

  const response = await fetch(`/api/livekit/token?${params.toString()}`);

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Failed to fetch token";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      errorMessage = `HTTP ${response.status}: ${errorText.substring(0, 100)}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.token;
}

export function LiveKitProvider({
  children,
  roomName,
  participantName,
  participantIdentity,
  onConnected,
  onDisconnected,
  onError,
  videoEnabled = true,
  audioEnabled = true,
}: LiveKitProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  useEffect(() => {
    if (!roomName || !participantIdentity) {
      console.error("[LiveKit] Missing roomName or participantIdentity");
      setError(new Error("Missing room name or participant identity"));
      setIsLoading(false);
      return;
    }

    console.log("[LiveKit] Initializing connection to room:", roomName);

    fetchToken(roomName, participantName, participantIdentity)
      .then((token) => {
        console.log("[LiveKit] Token received successfully");
        setToken(token);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("[LiveKit] Failed to fetch token:", err);
        setError(err);
        setIsLoading(false);
        onError?.(err);
      });
  }, [roomName, participantName, participantIdentity, onError]);

  const handleConnected = useCallback(() => {
    console.log("[LiveKit] Connected to room:", roomName);
    onConnected?.();
  }, [roomName, onConnected]);

  const handleDisconnected = useCallback(() => {
    console.log("[LiveKit] Disconnected from room:", roomName);
    onDisconnected?.();
  }, [roomName, onDisconnected]);

  const handleError = useCallback(
    (err: Error) => {
      console.error("[LiveKit] Room error:", err);
      setError(err);
      onError?.(err);
    },
    [onError],
  );

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Connecting to meeting...</p>
          <p className="text-muted-foreground/70 text-sm mt-2">Room: {roomName}</p>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Connection Failed
          </h2>
          <p className="text-muted-foreground text-sm">
            {error?.message || "Unable to get meeting token"}
          </p>
          <p className="text-muted-foreground/60 text-xs mt-2">Room: {roomName}</p>
        </div>
      </div>
    );
  }

  if (!livekitUrl) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Configuration Error
          </h2>
          <p className="text-muted-foreground text-sm">LiveKit URL is not configured</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      video={videoEnabled}
      audio={audioEnabled}
      onConnected={handleConnected}
      onDisconnected={handleDisconnected}
      onError={handleError}
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: true,
          videoCodec: "vp8",
        },
      }}
      className="h-full"
    >
      {children}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

// Hook to get the current room context
export function useLiveKitRoom() {
  return useRoomContext();
}

// Connection state hook
export function useConnectionState() {
  const room = useRoomContext();
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected,
  );

  useEffect(() => {
    if (!room) return;

    const handleConnectionStateChange = (state: ConnectionState) => {
      console.log("[LiveKit] Connection state changed:", state);
      setConnectionState(state);
    };

    setConnectionState(room.state);
    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChange);

    return () => {
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChange);
    };
  }, [room]);

  return connectionState;
}
