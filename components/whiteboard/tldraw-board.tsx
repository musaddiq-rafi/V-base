"use client";

import { Tldraw } from "tldraw";
import { useSelf } from "@liveblocks/react/suspense";
import "tldraw/tldraw.css";

interface TldrawBoardProps {
  roomId: string;
}

export function TldrawBoard({ roomId }: TldrawBoardProps) {
  const currentUser = useSelf();

  return (
    <div className="h-screen w-full">
      <Tldraw
        autoFocus
      />
    </div>
  );
}
