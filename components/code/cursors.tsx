"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelf } from "@liveblocks/react/suspense";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";

// User colors for cursor presence
const USER_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FFA07A", // Light Salmon
  "#98D8C8", // Mint
  "#F7DC6F", // Yellow
  "#BB8FCE", // Purple
  "#85C1E2", // Sky Blue
  "#F8B739", // Orange
  "#52B788", // Green
];

function getUserColor(clientId: number): string {
  return USER_COLORS[clientId % USER_COLORS.length];
}

// Types for awareness state
type UserAwareness = {
  user?: {
    name: string;
    color: string;
  };
};

type AwarenessList = [number, UserAwareness][];

interface CursorsProps {
  yProvider: LiveblocksYjsProvider;
}

export function Cursors({ yProvider }: CursorsProps) {
  // Get user info from Liveblocks authentication endpoint
  const userInfo = useSelf((me) => me.info);
  const self = useSelf();

  const [awarenessUsers, setAwarenessUsers] = useState<AwarenessList>([]);

  useEffect(() => {
    let isDestroyed = false;

    // Add user info to Yjs awareness with generated color
    if (userInfo && self) {
      const color = getUserColor(self.connectionId);
      try {
        yProvider.awareness.setLocalStateField("user", {
          name: userInfo.name,
          color: color,
        });
      } catch (e) {
        // Ignore if provider is already destroyed
      }
    }

    // On changes, update `awarenessUsers`
    function setUsers() {
      if (!isDestroyed) {
        try {
          setAwarenessUsers([
            ...yProvider.awareness.getStates(),
          ] as AwarenessList);
        } catch (e) {
          // Ignore if provider is already destroyed
        }
      }
    }

    try {
      yProvider.awareness.on("change", setUsers);
      setUsers();
    } catch (e) {
      // Ignore if provider is already destroyed
    }

    return () => {
      isDestroyed = true;
      try {
        yProvider.awareness.off("change", setUsers);
      } catch (e) {
        // Ignore cleanup errors during HMR
      }
    };
  }, [yProvider, userInfo, self]);

  // Insert awareness info into cursors with styles
  const styleSheet = useMemo(() => {
    let cursorStyles = "";

    for (const [clientId, client] of awarenessUsers) {
      if (client?.user) {
        cursorStyles += `
          .yRemoteSelection-${clientId},
          .yRemoteSelectionHead-${clientId}  {
            --user-color: ${client.user.color || getUserColor(clientId)};
          }

          .yRemoteSelectionHead-${clientId}::after {
            content: "${client.user.name || "Anonymous"}";
          }
        `;
      }
    }

    return { __html: cursorStyles };
  }, [awarenessUsers]);

  return <style dangerouslySetInnerHTML={styleSheet} />;
}
