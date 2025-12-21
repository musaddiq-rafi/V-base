"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import { useErrorListener, useStatus, useSyncStatus } from "@liveblocks/react/suspense";
import { EditorToolbar } from "./editor-toolbar";
import { DocumentHeader } from "./document-header";
import { Id } from "@/convex/_generated/dataModel";

interface CollaborativeEditorProps {
  documentId: Id<"documents">;
}

export function CollaborativeEditor({ documentId }: CollaborativeEditorProps) {
  // Connection status (WebSocket) and sync status (storage)
  const status = useStatus();
  const syncStatus = useSyncStatus({ smooth: true });

  useErrorListener((err) => {
    console.error("❌ Liveblocks error:", err);
  });

  useEffect(() => {
    console.log("📡 Liveblocks:", { status, syncStatus });
  }, [status, syncStatus]);

  // Set up Liveblocks collaborative extension
  const liveblocks = useLiveblocksExtension();

  // Initialize Tiptap editor with collaboration
  const editor = useEditor({
    immediatelyRender: false, // Required for Next.js SSR to avoid hydration mismatches
    extensions: [
      liveblocks,
      StarterKit.configure({
        // The Liveblocks extension comes with its own history handling
        undoRedo: false,
      }),
      Placeholder.configure({
        placeholder: "Start typing your document...",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-base max-w-none focus:outline-none outline-none",
      },
    },
  });
  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col bg-muted/30">
      <div className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <DocumentHeader documentId={documentId} />
        <EditorToolbar editor={editor} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[900px] px-4 py-10 sm:px-6">
          <div className="rounded-md border bg-card shadow-sm">
            <div className="min-h-[1056px] px-10 py-12 sm:px-16 sm:py-14">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
