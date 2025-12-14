"use client";

import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useRoom, useSelf } from "@liveblocks/react/suspense";
import { EditorToolbar } from "./editor-toolbar";
import { DocumentHeader } from "./document-header";
import { Id } from "@/convex/_generated/dataModel";

interface CollaborativeEditorProps {
  documentId: Id<"documents">;
}

// Generate a consistent color for each user based on their ID
function generateUserColor(userId: string): string {
  const colors = [
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
  
  // Hash the user ID to get a consistent color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function CollaborativeEditor({ documentId }: CollaborativeEditorProps) {
  const room = useRoom();
  const userInfo = useSelf((me) => me.info);
  const [isSynced, setIsSynced] = useState(false);
  const [yProvider, setYProvider] = useState<any>(null);
  const [yDoc, setYDoc] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Yjs provider and document
  useEffect(() => {
    if (!room) return;

    try {
      console.log("Initializing Yjs provider for room:", room);
      const provider = getYjsProviderForRoom(room);
      console.log("Provider created:", provider);
      console.log("Provider synced status:", provider.synced);
      
      const doc = provider.getYDoc();
      console.log("Y.Doc retrieved:", doc);
      
      setYProvider(provider);
      setYDoc(doc);
      
      // Check if already synced
      if (provider.synced) {
        console.log("Provider already synced");
        setIsSynced(true);
      }
      
      // Listen for sync events
      const handleSync = (synced: boolean) => {
        console.log("Sync state changed:", synced);
        setIsSynced(synced);
      };
      
      provider.on("sync", handleSync);
      
      // Force sync after a short delay if not synced
      const timeoutId = setTimeout(() => {
        if (provider.synced) {
          console.log("Force setting synced state to true");
          setIsSynced(true);
        }
      }, 1000);
      
      return () => {
        clearTimeout(timeoutId);
        provider.off("sync", handleSync);
        provider.destroy();
      };
    } catch (err) {
      console.error("Error initializing collaborative editor:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize editor");
    }
  }, [room]);

  // Initialize Tiptap editor with collaboration
  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit,
        ...(yDoc && isSynced
          ? [
              Collaboration.configure({
                document: yDoc,
              }),
              CollaborationCursor.configure({
                provider: yProvider,
                user: {
                  name: userInfo?.name || "Anonymous",
                  color: generateUserColor(userInfo?.email || "default"),
                },
              }),
            ]
          : []),
        Placeholder.configure({
          placeholder: "Start typing your document...",
        }),
      ],
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-full p-8",
        },
      },
    },
    [yDoc, yProvider, userInfo, isSynced]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      yProvider?.destroy();
    };
  }, [yProvider]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error initializing editor</div>
          <div className="text-sm text-gray-400">{error}</div>
          <div className="text-xs text-gray-400 mt-2">
            Check console for details
          </div>
        </div>
      </div>
    );
  }

  if (!yProvider || !yDoc) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-pulse text-gray-500 mb-2">
            Initializing editor...
          </div>
          <div className="text-sm text-gray-400">Setting up collaboration</div>
        </div>
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Document Header */}
      <DocumentHeader documentId={documentId} />
      
      {/* Toolbar */}
      <EditorToolbar editor={editor} />
      
      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
