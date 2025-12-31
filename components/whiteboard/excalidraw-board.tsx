"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useRef } from "react";
import { useBroadcastEvent, useEventListener, useOthers, useUpdateMyPresence } from "@liveblocks/react/suspense";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import "@excalidraw/excalidraw/index.css";

interface WhiteboardProps {
  roomId: string;
  whiteboardId?: Id<"whiteboards">;
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

export function Whiteboard({ roomId, whiteboardId }: WhiteboardProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();
  const broadcast = useBroadcastEvent();
  const isReceivingUpdate = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useUser();
  
  // Fetch whiteboard content from database
  const whiteboard = useQuery(
    api.whiteboards.getWhiteboardById,
    whiteboardId ? { whiteboardId } : "skip"
  );
  const saveContent = useMutation(api.whiteboards.saveWhiteboardContent);
  const [hasLoadedInitialContent, setHasLoadedInitialContent] = useState(false);

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

  // Load initial content from database
  useEffect(() => {
    if (excalidrawAPI && whiteboard && whiteboard.content && !hasLoadedInitialContent) {
      try {
        console.log("Loading whiteboard content from database...");
        const elements = JSON.parse(whiteboard.content);
        excalidrawAPI.updateScene({ elements });
        setHasLoadedInitialContent(true);
        console.log("Loaded", elements.length, "elements");
      } catch (error) {
        console.error("Failed to load whiteboard content:", error);
        setHasLoadedInitialContent(true); // Set true even on error to prevent infinite retries
      }
    } else if (excalidrawAPI && !whiteboard?.content && !hasLoadedInitialContent) {
      // No saved content, mark as loaded
      setHasLoadedInitialContent(true);
    }
  }, [excalidrawAPI, whiteboard, hasLoadedInitialContent]);

  // Handle drawing changes - broadcast to others and save to database
  const onChange = useCallback(
    (elements: readonly any[], appState: any) => {
      if (isReceivingUpdate.current) return;
      if (!hasLoadedInitialContent) return; // Don't save during initial load
      
      // Broadcast to other users in real-time
      broadcast({
        type: "DRAW",
        elements: elements,
      } as any);

      // Auto-save to database (debounced)
      if (whiteboardId && user && elements.length > 0) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
          const content = JSON.stringify(elements);
          console.log("Saving whiteboard content...", elements.length, "elements");
          saveContent({
            whiteboardId,
            content,
            userId: user.id,
          })
            .then(() => {
              console.log("Whiteboard saved successfully");
            })
            .catch((error) => {
              console.error("Failed to save whiteboard:", error);
            });
        }, 2000); // Save 2 seconds after last change
      }
    },
    [broadcast, whiteboardId, user, saveContent, hasLoadedInitialContent]
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
