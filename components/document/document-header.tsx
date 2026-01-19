"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { Editor } from "@tiptap/react";
import {
  FileText,
  FilePlus,
  FilePen,
  FileJson,
  Globe,
  Text as TextIcon,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  RemoveFormatting,
  Star,
  CloudOff,
  Cloud,
  MoreVertical,
  Share2,
  Trash,
  Printer,
  Undo2,
  Redo2,
} from "lucide-react";
import { BsFilePdf } from "react-icons/bs";
import { useUser } from "@clerk/nextjs";
import { ActiveUsersAvatars } from "@/components/liveblocks/active-users";
import { useStatus } from "@liveblocks/react/suspense";
import { Button } from "@/components/ui/button";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  MenubarShortcut,
} from "@/components/ui/menubar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentHeaderProps {
  documentId: Id<"documents">;
  editor: Editor;
  showRuler: boolean;
  onShowRulerChange: (value: boolean) => void;
  showPageBreaks: boolean;
  onShowPageBreaksChange: (value: boolean) => void;
  showPageNumbers: boolean;
  onShowPageNumbersChange: (value: boolean) => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  zoom: number;
  onZoomChange: (value: number) => void;
}

function onDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DocumentHeader({
  documentId,
  editor,
  showRuler,
  onShowRulerChange,
  showPageBreaks,
  onShowPageBreaksChange,
  showPageNumbers,
  onShowPageNumbersChange,
  isFullScreen,
  onToggleFullScreen,
  zoom,
  onZoomChange,
}: DocumentHeaderProps) {
  const document = useQuery(api.documents.getDocumentById, { documentId });
  const updateDocumentName = useMutation(api.documents.updateDocumentName);
  const updateLastEdited = useMutation(api.documents.updateLastEdited);
  const { user } = useUser();
  const status = useStatus();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (document) {
      setName(document.name);
    }
  }, [document]);

  // Update last edited periodically
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      updateLastEdited({
        documentId,
        userId: user.id,
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [documentId, user, updateLastEdited]);

  const handleSaveName = async () => {
    if (!name.trim() || name === document?.name) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateDocumentName({
        documentId,
        name: name.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update document name:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setName(document?.name || "");
      setIsEditing(false);
    }
  };

  const onSaveJson = () => {
    const json = editor.getJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: "application/json",
    });
    onDownload(blob, "document.json");
  };

  const onSaveHtml = () => {
    const html = editor.getHTML();
    const blob = new Blob([html], { type: "text/html" });
    onDownload(blob, "document.html");
  };

  const onSaveText = () => {
    const text = editor.getText();
    const blob = new Blob([text], { type: "text/plain" });
    onDownload(blob, "document.txt");
  };

  const onSavePdf = () => {
    window.print();
  };

  if (!document) {
    return (
      <div className="h-[52px] bg-[#F9FBFD] flex items-center justify-center">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-[#F9FBFD] print:hidden">
      {/* Left Section - Logo and Document Name */}
      <div className="flex items-center gap-2">
        {/* Docs Logo */}
        <div className="flex items-center justify-center w-10 h-10 shrink-0">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>

        {/* Document Info */}
        <div className="flex flex-col">
          {/* Document Name */}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleSaveName}
                className="text-lg font-medium text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none px-0.5 -ml-0.5"
                autoFocus
                disabled={isSaving}
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-lg font-medium text-gray-900 hover:bg-gray-100 px-1 -ml-1 rounded transition-colors truncate max-w-[300px]"
              >
                {document.name}
              </button>
            )}
            {isSaving && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            )}
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Star className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Menu Bar */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Menubar className="h-auto border-0 bg-transparent p-0 shadow-none">
              <MenubarMenu>
                <MenubarTrigger className="text-sm font-normal py-0.5 px-[7px] rounded-sm hover:bg-muted h-auto">
                  File
                </MenubarTrigger>
                <MenubarContent className="w-[240px]">
                  <MenubarItem className="gap-2" onClick={() => {}}>
                    <FilePlus className="h-4 w-4" />
                    New Document
                  </MenubarItem>

                  <MenubarSub>
                    <MenubarSubTrigger className="gap-2">
                      <FilePen className="h-4 w-4" />
                      Save
                    </MenubarSubTrigger>
                    <MenubarSubContent className="w-[220px]">
                      <MenubarItem className="gap-2" onClick={onSaveJson}>
                        <FileJson className="h-4 w-4" />
                        JSON
                      </MenubarItem>
                      <MenubarItem className="gap-2" onClick={onSaveHtml}>
                        <Globe className="h-4 w-4" />
                        HTML
                      </MenubarItem>
                      <MenubarItem className="gap-2" onClick={onSavePdf}>
                        <BsFilePdf className="h-4 w-4" />
                        PDF
                      </MenubarItem>
                      <MenubarItem className="gap-2" onClick={onSaveText}>
                        <FileText className="h-4 w-4" />
                        Text
                      </MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>

                  <MenubarSeparator />

                  <MenubarItem className="gap-2" onClick={() => setIsEditing(true)}>
                    <FilePen className="h-4 w-4" />
                    Rename
                  </MenubarItem>
                  <MenubarItem className="gap-2" onClick={() => {}}>
                    <Trash className="h-4 w-4" />
                    Remove
                  </MenubarItem>

                  <MenubarSeparator />

                  <MenubarItem className="gap-2" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" />
                    Print
                    <MenubarShortcut>Ctrl+P</MenubarShortcut>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger className="text-sm font-normal py-0.5 px-[7px] rounded-sm hover:bg-muted h-auto">
                  Edit
                </MenubarTrigger>
                <MenubarContent className="w-[240px]">
                  <MenubarItem
                    className="gap-2"
                    onClick={() => {
                      if (!editor) return;
                      editor.chain().focus().undo().run();
                    }}
                  >
                    <Undo2 className="h-4 w-4" />
                    Undo
                    <MenubarShortcut>Ctrl+Z</MenubarShortcut>
                  </MenubarItem>

                  <MenubarItem
                    className="gap-2"
                    onClick={() => {
                      if (!editor) return;
                      editor.chain().focus().redo().run();
                    }}
                  >
                    <Redo2 className="h-4 w-4" />
                    Redo
                    <MenubarShortcut>Ctrl+Y</MenubarShortcut>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger className="text-sm font-normal py-0.5 px-[7px] rounded-sm hover:bg-muted h-auto">
                  View
                </MenubarTrigger>
                <MenubarContent className="w-[240px]">
                  <MenubarCheckboxItem
                    checked={showRuler}
                    onCheckedChange={(checked) => onShowRulerChange(Boolean(checked))}
                  >
                    Ruler
                  </MenubarCheckboxItem>

                  <MenubarCheckboxItem
                    checked={showPageBreaks}
                    onCheckedChange={(checked) => onShowPageBreaksChange(Boolean(checked))}
                  >
                    Page breaks
                  </MenubarCheckboxItem>

                  <MenubarCheckboxItem
                    checked={showPageNumbers}
                    onCheckedChange={(checked) => onShowPageNumbersChange(Boolean(checked))}
                  >
                    Page numbers
                  </MenubarCheckboxItem>

                  <MenubarCheckboxItem checked={isFullScreen} onCheckedChange={() => onToggleFullScreen()}>
                    Full screen
                  </MenubarCheckboxItem>

                  <MenubarSeparator />

                  <MenubarSub>
                    <MenubarSubTrigger>Zoom</MenubarSubTrigger>
                    <MenubarSubContent className="w-[220px]">
                      <MenubarRadioGroup
                        value={String(zoom)}
                        onValueChange={(value) => {
                          const nextZoom = Number(value);
                          if (!Number.isFinite(nextZoom)) return;
                          onZoomChange(nextZoom);
                        }}
                      >
                        <MenubarRadioItem value={String(0.5)}>50%</MenubarRadioItem>
                        <MenubarRadioItem value={String(0.75)}>75%</MenubarRadioItem>
                        <MenubarRadioItem value={String(1)}>100%</MenubarRadioItem>
                        <MenubarRadioItem value={String(1.25)}>125%</MenubarRadioItem>
                        <MenubarRadioItem value={String(1.5)}>150%</MenubarRadioItem>
                      </MenubarRadioGroup>
                    </MenubarSubContent>
                  </MenubarSub>
                </MenubarContent>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger className="text-sm font-normal py-0.5 px-[7px] rounded-sm hover:bg-muted h-auto">
                  Insert
                </MenubarTrigger>
                <MenubarContent className="w-[240px]">
                  <MenubarSub>
                    <MenubarSubTrigger>Table</MenubarSubTrigger>
                    <MenubarSubContent className="w-[220px]">
                      <MenubarItem
                        onClick={() => {
                          if (!editor) return;
                          (editor as any)
                            .chain()
                            .focus()
                            .insertTable({
                              rows: 1,
                              cols: 1,
                              withHeaderRow: false,
                            })
                            .run();
                        }}
                      >
                        1 x 1
                      </MenubarItem>
                      <MenubarItem
                        onClick={() => {
                          if (!editor) return;
                          (editor as any)
                            .chain()
                            .focus()
                            .insertTable({
                              rows: 2,
                              cols: 2,
                              withHeaderRow: false,
                            })
                            .run();
                        }}
                      >
                        2 x 2
                      </MenubarItem>
                      <MenubarItem
                        onClick={() => {
                          if (!editor) return;
                          (editor as any)
                            .chain()
                            .focus()
                            .insertTable({
                              rows: 3,
                              cols: 3,
                              withHeaderRow: false,
                            })
                            .run();
                        }}
                      >
                        3 x 3
                      </MenubarItem>
                      <MenubarItem
                        onClick={() => {
                          if (!editor) return;
                          (editor as any)
                            .chain()
                            .focus()
                            .insertTable({
                              rows: 4,
                              cols: 4,
                              withHeaderRow: false,
                            })
                            .run();
                        }}
                      >
                        4 x 4
                      </MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                </MenubarContent>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger className="text-sm font-normal py-0.5 px-[7px] rounded-sm hover:bg-muted h-auto">
                  Format
                </MenubarTrigger>
                <MenubarContent className="w-[240px]">
                  <MenubarSub>
                    <MenubarSubTrigger className="gap-2">
                      <TextIcon className="h-4 w-4" />
                      Text
                    </MenubarSubTrigger>
                    <MenubarSubContent className="w-[240px]">
                      <MenubarItem
                        className="gap-2"
                        onClick={() => {
                          if (!editor) return;
                          editor.chain().focus().toggleBold().run();
                        }}
                      >
                        <Bold className="h-4 w-4" />
                        Bold
                        <MenubarShortcut>Ctrl+B</MenubarShortcut>
                      </MenubarItem>

                      <MenubarItem
                        className="gap-2"
                        onClick={() => {
                          if (!editor) return;
                          editor.chain().focus().toggleItalic().run();
                        }}
                      >
                        <Italic className="h-4 w-4" />
                        Italic
                        <MenubarShortcut>Ctrl+I</MenubarShortcut>
                      </MenubarItem>

                      <MenubarItem
                        className="gap-2"
                        onClick={() => {
                          if (!editor) return;
                          (editor as any).chain().focus().toggleUnderline().run();
                        }}
                      >
                        <Underline className="h-4 w-4" />
                        Underline
                        <MenubarShortcut>Ctrl+U</MenubarShortcut>
                      </MenubarItem>

                      <MenubarItem
                        className="gap-2"
                        onClick={() => {
                          if (!editor) return;
                          editor.chain().focus().toggleStrike().run();
                        }}
                      >
                        <Strikethrough className="h-4 w-4" />
                        Strikethrough
                        <MenubarShortcut>Ctrl+Shift+X</MenubarShortcut>
                      </MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>

                  <MenubarSeparator />

                  <MenubarItem
                    className="gap-2"
                    onClick={() => {
                      if (!editor) return;
                      editor.chain().focus().unsetAllMarks().run();
                    }}
                  >
                    <RemoveFormatting className="h-4 w-4" />
                    Clear formatting
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        </div>
      </div>

      {/* Right Section - Status and Actions */}
      <div className="flex items-center gap-2">
        {/* Sync Status */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-2">
          {status === "connected" ? (
            <>
              <Cloud className="w-4 h-4 text-green-600" />
              <span className="hidden sm:inline">Saved to cloud</span>
            </>
          ) : (
            <>
              <CloudOff className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Connecting...</span>
            </>
          )}
        </div>

        {/* Active Collaborators */}
        <ActiveUsersAvatars />

        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem className="cursor-pointer">
              Version history
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              Download
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-red-600">
              Move to trash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
