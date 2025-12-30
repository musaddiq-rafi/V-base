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
  participantIdentity: string
): Promise<string> {
  const response = await fetch("/api/livekit/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomName,
      participantName,
      participantIdentity,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch token");
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  useEffect(() => {
    const getToken = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedToken = await fetchToken(
          roomName,
          participantName,
          participantIdentity
        );
        setToken(fetchedToken);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    };

    getToken();
  }, [roomName, participantName, participantIdentity, onError]);

  const handleConnected = useCallback(() => {
    onConnected?.();
  }, [onConnected]);

  const handleDisconnected = useCallback(() => {
    onDisconnected?.();
  }, [onDisconnected]);

  const handleError = useCallback(
    (err: Error) => {
      setError(err);
      onError?.(err);
    },
    [onError]
  );

  if (!livekitUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1a1a1a]">
        <div className="text-center">
          <p className="text-red-400 mb-2">LiveKit URL not configured</p>
          <p className="text-gray-500 text-sm">
            Please set NEXT_PUBLIC_LIVEKIT_URL in your environment variables
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1a1a1a]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Connecting to meeting...</p>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1a1a1a]">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to connect</p>
          <p className="text-gray-500 text-sm">
            {error?.message || "Unable to get meeting token"}
          </p>
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
  const room = useRoomContext();
  return room;
}

// Connection state hook
export function useConnectionState() {
  const room = useRoomContext();
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    room?.state || ConnectionState.Disconnected
  );

  useEffect(() => {
    if (!room) return;

    const handleConnectionChange = () => {
      setConnectionState(room.state);
    };

    room.on(RoomEvent.ConnectionStateChanged, handleConnectionChange);
    return () => {
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionChange);
    };
  }, [room]);

  return connectionState;
}
