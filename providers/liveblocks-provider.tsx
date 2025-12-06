"use client";

import { ReactNode } from "react";
import { LiveblocksProvider as Provider } from "@liveblocks/react/suspense";

interface LiveblocksProviderProps {
  children: ReactNode;
}

export function LiveblocksProvider({ children }: LiveblocksProviderProps) {
  return (
    <Provider
      authEndpoint="/api/liveblocks-auth"
      // Throttle presence updates to reduce network traffic
      throttle={100}
    >
      {children}
    </Provider>
  );
}
