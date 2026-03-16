"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Table,
    FilePlus,
    FileText,
    Save,
    Trash,
    Printer,
    Undo2,
    Redo2,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    RemoveFormatting,
    Star,
    Cloud,
    CloudOff,
    MoreVertical,
    Minus,
    Plus
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { ActiveUsersAvatars } from "@/components/liveblocks/active-users";
import { useStatus } from "@liveblocks/react/suspense";
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
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

interface SpreadsheetHeaderProps {
    spreadsheetId: Id<"spreadsheets">;
    onUndo?: () => void;
    onRedo?: () => void;
    onZoomChange?: (zoom: number) => void;
    zoom?: number;
    onInsertRow?: (direction: "above" | "below") => void;
    onInsertColumn?: (direction: "left" | "right") => void;
    onDeleteRow?: () => void;
    onDeleteColumn?: () => void;
}

export function SpreadsheetHeader({
    spreadsheetId,
    onUndo,
    onRedo,
    onZoomChange,
    zoom = 1,
    onInsertRow,
    onInsertColumn,
    onDeleteRow,
    onDeleteColumn,
}: SpreadsheetHeaderProps) {
    const spreadsheet = useQuery(api.spreadsheets.getSpreadsheetById, { spreadsheetId });
    // Note: We might need to add updateName mutation for spreadsheets in backend if not exists
    // Assuming same pattern as documents for now, but will check backend file later
    // const updateSpreadsheetName = useMutation(api.spreadsheets.updateName); 
    const { user } = useUser();
    const status = useStatus();

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (spreadsheet) {
            setName(spreadsheet.name);
        }
    }, [spreadsheet]);

    // TODO: Add backend mutation for renaming spreadsheet
    const handleSaveName = async () => {
        if (!name.trim() || name === spreadsheet?.name) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            // await updateSpreadsheetName({
            //   spreadsheetId,
            //   name: name.trim(),
            // });
            console.log("Renaming not implemented yet");
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update spreadsheet name:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSaveName();
        } else if (e.key === "Escape") {
            setName(spreadsheet?.name || "");
            setIsEditing(false);
        }
    };

    if (!spreadsheet) {
        return (
            <div className="h-[52px] bg-[#F9FBFD] flex items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between px-3 py-2 bg-[#F9FBFD] dark:bg-background print:hidden border-b border-border">
            {/* Left Section - Logo and Name */}
            <div className="flex items-center gap-2">
                {/* Logo */}
                <div className="flex items-center justify-center w-10 h-10 shrink-0">
                    <Table className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
                </div>

                {/* Info */}
                <div className="flex flex-col">
                    {/* Name */}
                    <div className="flex items-center gap-1">
                        {isEditing ? (
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={handleKeyPress}
                                onBlur={handleSaveName}
                                className="text-lg font-medium text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-emerald-500 outline-none px-0.5 -ml-0.5"
                                autoFocus
                                disabled={isSaving}
                            />
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-lg font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-accent px-1 -ml-1 rounded transition-colors truncate max-w-[300px]"
                            >
                                {spreadsheet.name}
                            </button>
                        )}
                        {isSaving && (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
                        )}
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-accent rounded transition-colors">
                            <Star className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Menu Bar */}
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Menubar className="h-auto border-0 bg-transparent p-0 shadow-none">
                            <MenubarMenu>
                                <MenubarTrigger className="text-sm font-normal py-0.5 px-[7px] rounded-sm hover:bg-muted h-auto dark:text-gray-300 dark:hover:text-white">
                                    File
                                </MenubarTrigger>
                                <MenubarContent className="w-[240px]">
                                    <MenubarItem className="gap-2">
                                        <FilePlus className="h-4 w-4" />
                                        New Spreadsheet
                                    </MenubarItem>
                                    <MenubarItem className="gap-2">
                                        <FileText className="h-4 w-4" />
                                        Make a copy
                                    </MenubarItem>
                                    <MenubarSeparator />
                                    <MenubarItem className="gap-2">
                                        <Trash className="h-4 w-4" />
                                        Move to trash
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
                                    <MenubarItem className="gap-2" onClick={onUndo}>
                                        <Undo2 className="h-4 w-4" />
                                        Undo
                                        <MenubarShortcut>Ctrl+Z</MenubarShortcut>
                                    </MenubarItem>
                                    <MenubarItem className="gap-2" onClick={onRedo}>
                                        <Redo2 className="h-4 w-4" />
                                        Redo
                                        <MenubarShortcut>Ctrl+Y</MenubarShortcut>
                                    </MenubarItem>
                                    <MenubarSeparator />
                                    <MenubarItem onClick={onDeleteRow} className="text-red-500 hover:text-red-600 gap-2">
                                        <Trash className="h-4 w-4" /> Delete Row
                                    </MenubarItem>
                                    <MenubarItem onClick={onDeleteColumn} className="text-red-500 hover:text-red-600 gap-2">
                                        <Trash className="h-4 w-4" /> Delete Column
                                    </MenubarItem>
                                </MenubarContent>
                            </MenubarMenu>

                            <MenubarMenu>
                                <MenubarTrigger className="text-sm font-normal py-0.5 px-[7px] rounded-sm hover:bg-muted h-auto">
                                    View
                                </MenubarTrigger>
                                <MenubarContent className="w-[240px]">
                                    <MenubarItem className="gap-2" onClick={() => onZoomChange?.(zoom + 0.1)}>
                                        <Plus className="h-4 w-4" />
                                        Zoom In
                                    </MenubarItem>
                                    <MenubarItem className="gap-2" onClick={() => onZoomChange?.(zoom - 0.1)}>
                                        <Minus className="h-4 w-4" />
                                        Zoom Out
                                    </MenubarItem>
                                    <MenubarItem className="gap-2" onClick={() => onZoomChange?.(1)}>
                                        Reset Zoom
                                    </MenubarItem>
                                </MenubarContent>
                            </MenubarMenu>

                            <MenubarMenu>
                                <MenubarTrigger className="text-sm font-normal py-0.5 px-[7px] rounded-sm hover:bg-muted h-auto">
                                    Insert
                                </MenubarTrigger>
                                <MenubarContent className="w-[240px]">
                                    <MenubarItem onClick={() => onInsertRow?.("above")}>Row Above</MenubarItem>
                                    <MenubarItem onClick={() => onInsertRow?.("below")}>Row Below</MenubarItem>
                                    <MenubarSeparator />
                                    <MenubarItem onClick={() => onInsertColumn?.("left")}>Column Left</MenubarItem>
                                    <MenubarItem onClick={() => onInsertColumn?.("right")}>Column Right</MenubarItem>
                                </MenubarContent>
                            </MenubarMenu>

                            <MenubarMenu>
                                <MenubarTrigger className="text-sm font-normal py-0.5 px-[7px] rounded-sm hover:bg-muted h-auto">
                                    Format
                                </MenubarTrigger>
                                <MenubarContent className="w-[240px]">
                                    <MenubarItem className="gap-2"><Bold className="w-4 h-4" /> Bold</MenubarItem>
                                    <MenubarItem className="gap-2"><Italic className="w-4 h-4" /> Italic</MenubarItem>
                                    <MenubarItem className="gap-2"><Underline className="w-4 h-4" /> Underline</MenubarItem>
                                    <MenubarItem className="gap-2"><Strikethrough className="w-4 h-4" /> Strikethrough</MenubarItem>
                                    <MenubarSeparator />
                                    <MenubarItem className="gap-2"><RemoveFormatting className="w-4 h-4" /> Clear formatting</MenubarItem>
                                </MenubarContent>
                            </MenubarMenu>

                        </Menubar>
                    </div>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
                {/* Sync Status */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mr-2">
                    {status === "connected" ? (
                        <>
                            <Cloud className="w-4 h-4 text-green-600" />
                            <span className="hidden sm:inline">Saved</span>
                        </>
                    ) : (
                        <>
                            <CloudOff className="w-4 h-4 text-amber-500" />
                            <span className="hidden sm:inline">Connecting...</span>
                        </>
                    )}
                </div>

                <ActiveUsersAvatars />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-accent rounded-full transition-colors">
                            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuItem>Delete Spreadsheet</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
