"use client";

import { useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";

interface WhiteboardProps {
  roomId: string;
}

export function Whiteboard({ roomId }: WhiteboardProps) {
  const [excalidrawData, setExcalidrawData] = useState<any>(null);

  const handleChange = (elements: any, appState: any) => {
    // Store data locally for now
    setExcalidrawData({ elements, appState });
  };

  return (
    <div className="h-full w-full">
      <Excalidraw
        onChange={handleChange}
        initialData={{
          elements: [],
          appState: {},
        }}
      />
    </div>
  );
}
