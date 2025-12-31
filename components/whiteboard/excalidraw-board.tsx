"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useRef } from "react";
import { useBroadcastEvent, useEventListener, useOthers, useUpdateMyPresence } from "@liveblocks/react/suspense";
import "@excalidraw/excalidraw/index.css";

interface WhiteboardProps {
  roomId: string;
}

// Dynamically import Excalidraw to avoid SSR issues
const ExcalidrawWrapper = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-500">Loading whiteboard...</div>
      </div>
    ),
  }
);

export function Whiteboard({ roomId }: WhiteboardProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();
  const broadcast = useBroadcastEvent();
  const isReceivingUpdate = useRef(false);

  // Listen for drawing events from other users
  useEventListener(({ event }: any) => {
    if (event.type === "DRAW" && excalidrawAPI && !isReceivingUpdate.current) {
      isReceivingUpdate.current = true;
      
      const sceneData = excalidrawAPI.getSceneElements();
      const newElements = event.elements || [];
      
      // Merge elements properly
      const elementMap = new Map(sceneData.map((el: any) => [el.id, el]));
      newElements.forEach((el: any) => {
        elementMap.set(el.id, el);
      });
      
      excalidrawAPI.updateScene({
        elements: Array.from(elementMap.values()),
      });
      
      setTimeout(() => {
        isReceivingUpdate.current = false;
      }, 100);
    }
  });

  // Handle drawing changes - broadcast to others
  const onChange = useCallback(
    (elements: readonly any[], appState: any) => {
      if (isReceivingUpdate.current) return;
      
      broadcast({
        type: "DRAW",
        elements: elements,
      } as any);
    },
    [broadcast]
  );

  // Handle cursor updates
  const onPointerUpdate = useCallback(
    (payload: any) => {
      updateMyPresence({
        cursor: {
          x: payload.pointer.x,
          y: payload.pointer.y,
        },
      });
    },
    [updateMyPresence]
  );

  // Show other users' cursors
  useEffect(() => {
    if (!excalidrawAPI) return;

    const collaborators = new Map(
      others.map((other) => {
        const hue = Math.abs(other.id.toString().split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
        const color = `hsl(${hue}, 70%, 50%)`;
        
        return [
          other.id,
          {
            username: other.info?.name || "User",
            color: { background: color, stroke: color },
            pointer: other.presence?.cursor || undefined,
          },
        ];
      })
    );

    excalidrawAPI.updateScene({ collaborators });
  }, [others, excalidrawAPI]);

  return (
    <div className="absolute inset-0">
      <ExcalidrawWrapper
        excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
        onChange={onChange}
        onPointerUpdate={onPointerUpdate}
      />
    </div>
  );
}
