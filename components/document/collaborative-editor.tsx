"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import { Extension } from "@tiptap/core";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import { useErrorListener, useStatus, useSyncStatus } from "@liveblocks/react/suspense";
import { Toolbar } from "./toolbar";
import { Ruler } from "./ruler";
import { DocumentHeader } from "./document-header";
import { Id } from "@/convex/_generated/dataModel";

// Custom extension to add fontSize support to TextStyle
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
});

// A4 dimensions in pixels at 96 DPI
// A4 = 210mm × 297mm = 794px × 1123px at 96 DPI
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const PAGE_PADDING_TOP = 96; // ~1 inch
const PAGE_PADDING_BOTTOM = 96;
const CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM;

interface CollaborativeEditorProps {
  documentId: Id<"documents">;
}

export function CollaborativeEditor({ documentId }: CollaborativeEditorProps) {
  // Margin state for ruler
  const [leftMargin, setLeftMargin] = useState(56);
  const [rightMargin, setRightMargin] = useState(56);
  const [pageCount, setPageCount] = useState(1);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [showRuler, setShowRuler] = useState(true);
  const [showPageBreaks, setShowPageBreaks] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  // Initialize Tiptap editor with collaboration and all extensions
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      liveblocks,
      StarterKit.configure({
        // Liveblocks handles undo/redo via collaborative editing
      }),
      Placeholder.configure({
        placeholder: "Start typing your document...",
      }),
      // TextStyle must come before Color and FontFamily
      TextStyle.configure({
        HTMLAttributes: {},
      }),
      FontSize,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    editorProps: {
      attributes: {
        class: "focus:outline-none print:border-0",
        style: `padding-left: ${leftMargin}px; padding-right: ${rightMargin}px;`,
      },
    },
    onUpdate: () => {
      // Recalculate page count when content changes
      calculatePageCount();
    },
  });

  // Calculate page count based on content height
  const calculatePageCount = useCallback(() => {
    if (editorContainerRef.current) {
      const contentHeight = editorContainerRef.current.scrollHeight;
      const pages = Math.max(1, Math.ceil(contentHeight / CONTENT_HEIGHT));
      setPageCount(pages);
    }
  }, []);

  // Update page count when editor content changes
  useEffect(() => {
    if (editor) {
      calculatePageCount();
      // Also recalculate on window resize
      window.addEventListener('resize', calculatePageCount);
      return () => window.removeEventListener('resize', calculatePageCount);
    }
  }, [editor, calculatePageCount]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    onFullscreenChange();

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  // Update editor padding when margins change
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: "focus:outline-none print:border-0",
            style: `padding-left: ${leftMargin}px; padding-right: ${rightMargin}px;`,
          },
        },
      });
    }
  }, [editor, leftMargin, rightMargin]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full bg-[#F9FBFD]">
        <div className="animate-pulse text-gray-500">Loading editor...</div>
      </div>
    );
  }

  const handleToggleFullScreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (!rootRef.current?.requestFullscreen) return;
      await rootRef.current.requestFullscreen();
    } catch {
      // Ignore (fullscreen may be blocked)
    }
  };

  return (
    <div ref={rootRef} className="min-h-screen bg-[#F9FBFD] print:bg-white">
      {/* Header - sticky at top */}
      <div className="sticky top-0 z-20 bg-[#F9FBFD] print:hidden">
        <DocumentHeader
          documentId={documentId}
          editor={editor}
          showRuler={showRuler}
          onShowRulerChange={setShowRuler}
          showPageBreaks={showPageBreaks}
          onShowPageBreaksChange={setShowPageBreaks}
          showPageNumbers={showPageNumbers}
          onShowPageNumbersChange={setShowPageNumbers}
          isFullScreen={isFullScreen}
          onToggleFullScreen={handleToggleFullScreen}
          zoom={zoom}
          onZoomChange={setZoom}
        />
        
        {/* Toolbar Container */}
        <div className="flex justify-center px-4 pb-2">
          <Toolbar editor={editor} />
        </div>
      </div>

      {/* Ruler */}
      {showRuler && (
        <div className="sticky top-[104px] z-10 bg-[#F9FBFD] print:hidden">
          <Ruler
            leftMargin={leftMargin}
            rightMargin={rightMargin}
            onLeftMarginChange={setLeftMargin}
            onRightMarginChange={setRightMargin}
            pageWidth={PAGE_WIDTH}
          />
        </div>
      )}

      {/* Editor Container - A4 Paper Pages */}
      <div className="flex flex-col items-center py-6 gap-0 print:p-0 print:py-0">
        {/* Pages wrapper - creates visual separation between pages */}
        <div 
          className="relative editor-zoom-wrapper"
          style={{
            width: `${PAGE_WIDTH}px`,
            ...(zoom !== 1 ? ({ zoom } as any) : {}),
          }}
        >
          {/* Page backgrounds - visually separate white cards */}
          {Array.from({ length: pageCount }, (_, index) => (
            <div
              key={`page-${index}`}
              className={
                showPageBreaks
                  ? "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] mb-6 last:mb-0 print:shadow-none print:mb-0 pointer-events-none print:hidden"
                  : "bg-white shadow-none mb-0 pointer-events-none print:hidden"
              }
              style={{
                width: `${PAGE_WIDTH}px`,
                height: `${PAGE_HEIGHT}px`,
              }}
            />
          ))}
          
          {/* Editor overlay - positioned absolutely over the pages */}
          <div 
            ref={editorContainerRef}
            className="absolute top-0 left-0 right-0 print:static print:m-0 print:h-auto print:overflow-visible"
            style={{
              paddingTop: `${PAGE_PADDING_TOP}px`,
              paddingLeft: `${leftMargin}px`,
              paddingRight: `${rightMargin}px`,
            }}
          >
            <EditorContent 
              editor={editor} 
              className="prose prose-sm sm:prose max-w-none [&_.ProseMirror]:min-h-[calc(1123px-192px)]"
            />
          </div>
          
          {/* Page number indicators */}
          {showPageNumbers &&
            Array.from({ length: pageCount }, (_, index) => (
              <div
                key={`page-num-${index}`}
                className="absolute text-xs text-gray-400 print:hidden pointer-events-none"
                style={{
                  top: `${index * (PAGE_HEIGHT + 24) + PAGE_HEIGHT + 4}px`,
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                {index + 1}
              </div>
            ))}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        /* A4 page sizing */
        @page {
          size: A4;
          margin: 25.4mm;
        }
        
        @media print {
          body {
            background: white !important;
          }
          .editor-zoom-wrapper {
            zoom: 1 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .ProseMirror {
            padding: 0 !important;
          }
        }
        
        /* Font family styling for editor content */
        .ProseMirror [style*="font-family"] {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
