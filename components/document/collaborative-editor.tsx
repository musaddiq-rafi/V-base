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
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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
        style: "font-family: Arial, sans-serif; line-height: 1.6; color: #202124;",
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
    <div className="relative flex flex-col h-full bg-[#f9fbfd]">
      {/* Document Header */}
      <DocumentHeader documentId={documentId} />
      
      {/* Toolbar */}
      <EditorToolbar editor={editor} />
      
      {/* Editor Content - Google Docs style */}
      <div className="flex-1 overflow-y-auto bg-[#f9fbfd]">
        <div className="max-w-[850px] mx-auto py-12 px-6">
          <div className="bg-white shadow-lg min-h-[1056px] p-24">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
