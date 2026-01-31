"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Table,
    Clock,
    User,
    MoreVertical,
    Trash2,
    Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

interface SpreadsheetCardProps {
    spreadsheetId: string;
    name: string;
    creatorName: string;
    lastEditorName: string | null;
    updatedAt: number;
    workspaceId: string; // Clerk org ID for navigation
    roomId: string;
    viewMode?: "grid" | "list";
}

export function SpreadsheetCard({
    spreadsheetId,
    name,
    creatorName,
    lastEditorName,
    updatedAt,
    workspaceId,
    roomId,
    viewMode = "grid",
}: SpreadsheetCardProps) {
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteSpreadsheet = useMutation(api.spreadsheets.deleteSpreadsheet);

    const handleClick = () => {
        if (!isDeleting) {
            router.push(
                `/workspace/${workspaceId}/room/${roomId}/spreadsheet/${spreadsheetId}`
            );
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!confirm("Are you sure you want to delete this spreadsheet?")) {
            return;
        }

        setIsDeleting(true);
        setShowMenu(false);

        try {
            await deleteSpreadsheet({ spreadsheetId: spreadsheetId as Id<"spreadsheets"> });
        } catch (error: any) {
            alert(error.message || "Failed to delete spreadsheet");
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
    };

    // List View
    if (viewMode === "list") {
        return (
            <motion.div
                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                onClick={handleClick}
                className={`group relative flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
            >
                {isDeleting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg z-10">
                        <Loader2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 animate-spin" />
                    </div>
                )}

                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Table className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{name}</h3>
                </div>

                {/* Owner */}
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground w-40">
                    <span className="truncate">{lastEditorName || creatorName}</span>
                </div>

                {/* Last Modified */}
                <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground w-32">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(updatedAt)}</span>
                </div>

                {/* Menu */}
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1.5 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {showMenu && (
                        <div
                            className="absolute right-0 top-8 bg-background-secondary border border-border rounded-xl shadow-lg py-1.5 min-w-[160px] z-20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }

    // Grid View (Default)
    return (
        <motion.div
            whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
            onClick={handleClick}
            className={`group relative bg-surface rounded-xl border border-border overflow-hidden cursor-pointer transition-all hover:border-border ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
        >
            {isDeleting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                    <Loader2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 animate-spin" />
                </div>
            )}

            {/* Spreadsheet Preview */}
            <div className="relative h-[140px] bg-gradient-to-br from-muted/50 to-muted border-b border-border">
                {/* Spreadsheet preview grid */}
                <div className="absolute inset-0 p-6 flex flex-col gap-2 opacity-20">
                    <div className="flex gap-2">
                        <div className="h-6 w-16 bg-foreground/20 rounded-sm"></div>
                        <div className="h-6 w-16 bg-foreground/20 rounded-sm"></div>
                        <div className="h-6 w-16 bg-foreground/20 rounded-sm"></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-6 w-16 bg-foreground/20 rounded-sm"></div>
                        <div className="h-6 w-16 bg-foreground/20 rounded-sm"></div>
                        <div className="h-6 w-16 bg-foreground/20 rounded-sm"></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-6 w-16 bg-foreground/20 rounded-sm"></div>
                        <div className="h-6 w-16 bg-foreground/20 rounded-sm"></div>
                        <div className="h-6 w-16 bg-foreground/20 rounded-sm"></div>
                    </div>
                </div>

                {/* Spreadsheet icon overlay */}
                <div className="absolute top-3 left-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Table className="w-4 h-4 text-white" />
                    </div>
                </div>

                {/* Menu Button */}
                <div className="absolute top-3 right-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1.5 rounded-full bg-muted hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {showMenu && (
                        <div
                            className="absolute right-0 top-10 bg-background-secondary border border-border rounded-xl shadow-lg py-1.5 min-w-[160px] z-20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Spreadsheet Info */}
            <div className="p-4">
                <h3 className="font-semibold text-foreground truncate mb-2">{name}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 truncate max-w-[120px]">
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{lastEditorName || creatorName}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
