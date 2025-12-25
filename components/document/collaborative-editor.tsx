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
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      TextStyle,
      FontSize,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
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

  // Export handler
  const handleExport = useCallback(async (format: "pdf" | "html" | "txt" | "docx") => {
    if (!editor) return;

    const html = editor.getHTML();
    const text = editor.getText();
    const fileName = `document-${documentId}`;

    switch (format) {
      case "pdf": {
        // Dynamic import for html2pdf
        const html2pdf = (await import("html2pdf.js")).default;
        const element = document.createElement("div");
        element.innerHTML = html;
        element.style.fontFamily = "Arial, sans-serif";
        element.style.padding = "20px";
        element.style.width = `${PAGE_WIDTH - leftMargin - rightMargin}px`;
        
        const opt = {
          margin: [25.4, 25.4, 25.4, 25.4] as [number, number, number, number], // 1 inch margins in mm
          filename: `${fileName}.pdf`,
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
          },
          jsPDF: { 
            unit: "mm" as const, 
            format: "a4" as const, 
            orientation: "portrait" as const 
          },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] as const },
        };
        
        html2pdf().set(opt).from(element).save();
        break;
      }
      
      case "html": {
        const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${fileName}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: ${PAGE_WIDTH}px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>${html}</body>
</html>`;
        const blob = new Blob([fullHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.html`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      }
      
      case "txt": {
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      }
      
      case "docx": {
        // For DOCX, we'll create an HTML file that Word can open
        // A full DOCX would require a library like docx-js
        const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word" 
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${fileName}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Arial, sans-serif; }
    @page { size: A4; margin: 2.54cm; }
  </style>
</head>
<body>${html}</body>
</html>`;
        const blob = new Blob([wordHtml], { type: "application/msword" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.doc`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      }
    }
  }, [editor, documentId, leftMargin, rightMargin]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full bg-[#F9FBFD]">
        <div className="animate-pulse text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FBFD] print:bg-white">
      {/* Header - sticky at top */}
      <div className="sticky top-0 z-20 bg-[#F9FBFD] print:hidden">
        <DocumentHeader documentId={documentId} />
        
        {/* Toolbar Container */}
        <div className="flex justify-center px-4 pb-2">
          <Toolbar editor={editor} onExport={handleExport} />
        </div>
      </div>

      {/* Ruler */}
      <div className="sticky top-[104px] z-10 bg-[#F9FBFD] print:hidden">
        <Ruler
          leftMargin={leftMargin}
          rightMargin={rightMargin}
          onLeftMarginChange={setLeftMargin}
          onRightMarginChange={setRightMargin}
          pageWidth={PAGE_WIDTH}
        />
      </div>

      {/* Editor Container - A4 Paper Pages */}
      <div className="flex flex-col items-center pb-10 gap-4 print:p-0 print:gap-0">
        {/* Render pages dynamically based on content */}
        {Array.from({ length: pageCount }, (_, index) => (
          <div 
            key={index}
            className="page-container bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] print:shadow-none print:break-after-page"
            style={{
              width: `${PAGE_WIDTH}px`,
              minHeight: `${PAGE_HEIGHT}px`,
              ...(index > 0 && { display: 'none' }), // Hide additional page containers, content flows naturally
            }}
          >
            {/* Only render editor in first page container - content flows naturally */}
            {index === 0 && (
              <div 
                ref={editorContainerRef}
                className="print:py-0"
                style={{
                  paddingTop: `${PAGE_PADDING_TOP}px`,
                  paddingBottom: `${PAGE_PADDING_BOTTOM}px`,
                }}
              >
                <EditorContent 
                  editor={editor} 
                  className="prose prose-sm sm:prose max-w-none [&_.ProseMirror]:min-h-[calc(1123px-192px)]"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Page break indicator lines and Print Styles */}
      <style jsx global>{`
        /* A4 page sizing */
        @page {
          size: A4;
          margin: 25.4mm;
        }
        
        /* Page break styling for visual indication */
        .page-container {
          position: relative;
        }
        
        /* Visual page break indicator */
        .page-container::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 5px,
            #ccc 5px,
            #ccc 10px
          );
          pointer-events: none;
        }
        
        .page-container:last-child::after {
          display: none;
        }
        
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .ProseMirror {
            padding: 0 !important;
          }
          .page-container {
            width: 100% !important;
            min-height: auto !important;
            box-shadow: none !important;
            break-after: page;
          }
          .page-container::after {
            display: none !important;
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
