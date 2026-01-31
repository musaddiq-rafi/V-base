import { LiveMap, LiveObject } from "@liveblocks/client";

// Define the Cell type outside the global declaration
export type Cell = {
  value: string;
  formula?: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    color?: string;
    align?: "left" | "center" | "right";
  };
};

declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor: { x: number; y: number } | null;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      // Empty for Yjs documents - managed by @liveblocks/react-tiptap

      // Collaborative Spreadsheet
      spreadsheet?: LiveMap<string, LiveObject<Cell>>; // Key: "row,col", Value: Cell
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        name: string;
        email: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events for broadcasting drawing updates
    RoomEvent: {
      type: "DRAW";
      elements: any[];
    };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {};

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {};
  }
}

export { };
