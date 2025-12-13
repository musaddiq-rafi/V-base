"use client";

import dynamic from "next/dynamic";
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
  return (
    <div className="absolute inset-0">
      <ExcalidrawWrapper />
    </div>
  );
}
