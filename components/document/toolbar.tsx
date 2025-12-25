"use client";

import { useState, useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Printer,
  SpellCheck,
  ChevronDown,
  Link2,
  Image,
  MessageSquare,
  Highlighter,
  Download,
  FileText,
  FileType,
  RemoveFormatting,
  Superscript,
  Subscript,
  Minus,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

interface ToolbarProps {
  editor: Editor;
  onExport?: (format: "pdf" | "html" | "txt" | "docx") => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex items-center justify-center h-7 min-w-7 px-1.5 rounded-sm hover:bg-neutral-200/80 transition-colors",
        isActive && "bg-neutral-200/80",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      {children}
    </button>
  );
}

// Font families for dropdown
const FONT_FAMILIES = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
  { label: "Impact", value: "Impact, sans-serif" },
  { label: "Lucida Console", value: "'Lucida Console', monospace" },
];

// Heading levels for dropdown
const HEADING_LEVELS = [
  { label: "Normal text", value: 0, fontSize: "11pt" },
  { label: "Heading 1", value: 1, fontSize: "24pt" },
  { label: "Heading 2", value: 2, fontSize: "18pt" },
  { label: "Heading 3", value: 3, fontSize: "14pt" },
  { label: "Heading 4", value: 4, fontSize: "12pt" },
  { label: "Heading 5", value: 5, fontSize: "10pt" },
  { label: "Heading 6", value: 6, fontSize: "8pt" },
];

// Font sizes (in pt like Google Docs)
const FONT_SIZES = [
  "8", "9", "10", "11", "12", "14", "16", "18", "20", "22", "24", "26", "28", "36", "48", "72"
];

// Highlight colors
const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#ffff00" },
  { label: "Green", value: "#00ff00" },
  { label: "Cyan", value: "#00ffff" },
  { label: "Pink", value: "#ff00ff" },
  { label: "Red", value: "#ff0000" },
  { label: "Blue", value: "#0000ff" },
];

// Text colors
const TEXT_COLORS = [
  { label: "Black", value: "#000000" },
  { label: "Dark Gray", value: "#666666" },
  { label: "Gray", value: "#999999" },
  { label: "Red", value: "#ff0000" },
  { label: "Orange", value: "#ff9900" },
  { label: "Yellow", value: "#ffff00" },
  { label: "Green", value: "#00ff00" },
  { label: "Cyan", value: "#00ffff" },
  { label: "Blue", value: "#0000ff" },
  { label: "Purple", value: "#9900ff" },
];

export function Toolbar({ editor, onExport }: ToolbarProps) {
  const [currentFont, setCurrentFont] = useState("Arial");
  const [currentFontSize, setCurrentFontSize] = useState("11");

  // Get current heading level
  const getCurrentHeading = () => {
    for (let level = 1; level <= 6; level++) {
      if (editor.isActive("heading", { level })) {
        return `Heading ${level}`;
      }
    }
    return "Normal text";
  };

  // Set font family
  const setFontFamily = useCallback((font: string, displayName: string) => {
    editor.chain().focus().setFontFamily(font).run();
    setCurrentFont(displayName);
  }, [editor]);

  // Set font size - applies to current selection or typing
  const setFontSize = useCallback((size: string) => {
    editor.chain().focus().setMark('textStyle', { fontSize: `${size}pt` }).run();
    setCurrentFontSize(size);
  }, [editor]);

  return (
    <div className="bg-[#F1F4F9] px-2.5 py-0.5 rounded-[24px] min-h-[40px] flex items-center gap-0.5 overflow-x-auto print:hidden">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => window.print()}
        title="Print (Ctrl+P)"
      >
        <Printer className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton onClick={() => {}} title="Spelling and grammar check">
        <SpellCheck className="h-4 w-4" />
      </ToolbarButton>

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center h-7 min-w-7 px-1.5 rounded-sm hover:bg-neutral-200/80 transition-colors" title="Download">
            <Download className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          <DropdownMenuItem onClick={() => onExport?.("pdf")} className="cursor-pointer gap-2">
            <FileText className="h-4 w-4" />
            Download as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport?.("docx")} className="cursor-pointer gap-2">
            <FileType className="h-4 w-4" />
            Download as Word (.docx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport?.("html")} className="cursor-pointer gap-2">
            <Code className="h-4 w-4" />
            Download as HTML
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport?.("txt")} className="cursor-pointer gap-2">
            <FileText className="h-4 w-4" />
            Download as Plain Text
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 mx-0.5 bg-neutral-300" />

      {/* Heading Level Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 h-7 px-2 rounded-sm hover:bg-neutral-200/80 text-sm min-w-[100px] justify-between">
            <span className="truncate">{getCurrentHeading()}</span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[180px]">
          {HEADING_LEVELS.map((heading) => (
            <DropdownMenuItem
              key={heading.value}
              onClick={() => {
                if (heading.value === 0) {
                  editor.chain().focus().setParagraph().run();
                } else {
                  editor.chain().focus().toggleHeading({ level: heading.value as 1 | 2 | 3 | 4 | 5 | 6 }).run();
                }
              }}
              className={cn(
                "cursor-pointer",
                (heading.value === 0 && !editor.isActive("heading")) ||
                editor.isActive("heading", { level: heading.value }) ? "bg-neutral-100" : ""
              )}
            >
              <span style={{ fontSize: heading.fontSize }}>{heading.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 mx-0.5 bg-neutral-300" />

      {/* Font Family Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 h-7 px-2 rounded-sm hover:bg-neutral-200/80 text-sm min-w-[100px] justify-between">
            <span className="truncate">{currentFont}</span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[180px] max-h-[300px] overflow-y-auto">
          {FONT_FAMILIES.map((font) => (
            <DropdownMenuItem
              key={font.value}
              onClick={() => setFontFamily(font.value, font.label)}
              className={cn(
                "cursor-pointer",
                currentFont === font.label ? "bg-neutral-100" : ""
              )}
              style={{ fontFamily: font.value }}
            >
              {font.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 mx-0.5 bg-neutral-300" />

      {/* Font Size Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-0.5 h-7 px-1.5 rounded-sm hover:bg-neutral-200/80 text-sm w-[52px] justify-center">
            <span>{currentFontSize}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[80px] max-h-[300px] overflow-y-auto">
          {FONT_SIZES.map((size) => (
            <DropdownMenuItem
              key={size}
              onClick={() => setFontSize(size)}
              className={cn(
                "cursor-pointer justify-center",
                currentFontSize === size ? "bg-neutral-100" : ""
              )}
            >
              {size}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 mx-0.5 bg-neutral-300" />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      {/* Text Color */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center h-7 min-w-7 px-1 rounded-sm hover:bg-neutral-200/80 transition-colors" title="Text color">
            <span className="text-sm font-bold">A</span>
            <div className="w-3 h-1 bg-black mt-0.5 ml-0.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[180px]">
          {TEXT_COLORS.map((color) => (
            <DropdownMenuItem
              key={color.value}
              onClick={() => {
                try {
                  editor.chain().focus().setColor(color.value).run();
                } catch (e) {
                  console.error('Error setting color:', e);
                }
              }}
              className="cursor-pointer gap-2"
            >
              <div className="w-4 h-4 rounded border" style={{ backgroundColor: color.value }} />
              {color.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              try {
                editor.chain().focus().unsetColor().run();
              } catch (e) {
                console.error('Error unsetting color:', e);
              }
            }}
            className="cursor-pointer"
          >
            Remove color
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Highlight Color */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center h-7 min-w-7 px-1.5 rounded-sm hover:bg-neutral-200/80 transition-colors" title="Highlight color">
            <Highlighter className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[180px]">
          {HIGHLIGHT_COLORS.map((color) => (
            <DropdownMenuItem
              key={color.value}
              onClick={() => {
                try {
                  editor.chain().focus().toggleHighlight({ color: color.value }).run();
                } catch (e) {
                  console.error('Error setting highlight:', e);
                }
              }}
              className="cursor-pointer gap-2"
            >
              <div className="w-4 h-4 rounded border" style={{ backgroundColor: color.value }} />
              {color.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              try {
                editor.chain().focus().unsetHighlight().run();
              } catch (e) {
                console.error('Error unsetting highlight:', e);
              }
            }}
            className="cursor-pointer"
          >
            Remove highlight
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 mx-0.5 bg-neutral-300" />

      {/* Text Alignment */}
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('left').run()} 
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align left"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('center').run()} 
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align center"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('right').run()} 
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align right"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
        isActive={editor.isActive({ textAlign: 'justify' })}
        title="Justify"
      >
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-0.5 bg-neutral-300" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-0.5 bg-neutral-300" />

      {/* Insert Link */}
      <ToolbarButton 
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }} 
        isActive={editor.isActive('link')}
        title="Insert link (Ctrl+K)"
      >
        <Link2 className="h-4 w-4" />
      </ToolbarButton>

      {/* Insert Image */}
      <ToolbarButton 
        onClick={() => {
          const url = window.prompt('Enter image URL:');
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }} 
        title="Insert image"
      >
        <Image className="h-4 w-4" />
      </ToolbarButton>

      {/* Horizontal Rule */}
      <ToolbarButton 
        onClick={() => editor.chain().focus().setHorizontalRule().run()} 
        title="Horizontal line"
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      {/* Clear Formatting */}
      <ToolbarButton 
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} 
        title="Clear formatting"
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
