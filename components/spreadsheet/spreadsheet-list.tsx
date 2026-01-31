"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Table, Loader2, Search, Grid, List, SortAsc } from "lucide-react";
import { SpreadsheetCard } from "./spreadsheet-card";
import { CreateSpreadsheetModal } from "./create-spreadsheet-modal";
import { motion, AnimatePresence } from "framer-motion";

interface SpreadsheetListProps {
    roomId: Id<"rooms">;
    workspaceId: string; // Clerk org ID for navigation
    convexWorkspaceId: Id<"workspaces">; // Convex workspace ID for mutations
}

export function SpreadsheetList({ roomId, workspaceId, convexWorkspaceId }: SpreadsheetListProps) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortBy, setSortBy] = useState<"recent" | "name">("recent");

    const spreadsheets = useQuery(api.spreadsheets.getSpreadsheetsByRoom, { roomId });

    if (spreadsheets === undefined) {
        return (
            <div className="flex items-center justify-center h-full bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading spreadsheets...</span>
                </div>
            </div>
        );
    }

    // Filter and sort spreadsheets
    const filteredSheets = spreadsheets
        .filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            return b.updatedAt - a.updatedAt;
        });

    const isEmpty = spreadsheets.length === 0;
    const noResults = filteredSheets.length === 0 && !isEmpty;

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Top Section - Start a new spreadsheet */}
            <div className="flex-shrink-0 bg-surface border-b border-border">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-medium text-muted-foreground">Start a new spreadsheet</h2>
                    </div>

                    {/* Template Cards */}
                    <div className="flex gap-4">
                        {/* Blank Spreadsheet */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowCreateModal(true)}
                            className="group flex flex-col items-center"
                        >
                            <div className="w-[120px] h-[160px] bg-surface border-2 border-border rounded-lg flex items-center justify-center hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/50" />
                                <Plus className="w-10 h-10 text-muted-foreground/50 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors relative z-10" />
                                {/* Spreadsheet grid decoration */}
                                <div className="absolute inset-0 p-3 opacity-10">
                                    <div className="w-full h-full border-l border-t border-muted-foreground grid grid-cols-3 grid-rows-6">
                                        {Array.from({ length: 18 }).map((_, i) => (
                                            <div key={i} className="border-r border-b border-muted-foreground"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <span className="mt-3 text-sm text-muted-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">Blank</span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Recent Spreadsheets Section */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {/* Search and Filter Bar */}
                <div className="flex-shrink-0 bg-surface border-b border-border">
                    <div className="max-w-6xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-base font-semibold text-foreground">Recent spreadsheets</h2>

                            <div className="flex items-center gap-3">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search spreadsheets..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-64 bg-muted border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Sort */}
                                <button
                                    onClick={() => setSortBy(sortBy === "recent" ? "name" : "recent")}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                                >
                                    <SortAsc className="w-4 h-4" />
                                    <span>{sortBy === "recent" ? "Recent" : "Name"}</span>
                                </button>

                                {/* View Toggle */}
                                <div className="flex items-center bg-muted rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={`p-1.5 rounded ${viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-surface-hover"} transition-all`}
                                    >
                                        <Grid className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={`p-1.5 rounded ${viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-surface-hover"} transition-all`}
                                    >
                                        <List className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spreadsheets Grid/List */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto px-6 py-6">
                        {isEmpty ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center py-16 text-center"
                            >
                                <div className="w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-full flex items-center justify-center mb-6">
                                    <Table className="w-16 h-16 text-emerald-500 dark:text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground mb-2">
                                    No spreadsheets yet
                                </h2>
                                <p className="text-muted-foreground mb-6 max-w-md">
                                    Get started by creating your first spreadsheet. Analyze data with your team in real-time.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowCreateModal(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                    Create Spreadsheet
                                </motion.button>
                            </motion.div>
                        ) : noResults ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-16 text-center"
                            >
                                <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-1">No spreadsheets found</h3>
                                <p className="text-muted-foreground">Try a different search term</p>
                            </motion.div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    layout
                                    className={viewMode === "grid"
                                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                        : "flex flex-col gap-2"
                                    }
                                >
                                    {filteredSheets.map((sheet, index) => (
                                        <motion.div
                                            key={sheet._id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <SpreadsheetCard
                                                spreadsheetId={sheet._id}
                                                name={sheet.name}
                                                creatorName={sheet.creatorName}
                                                lastEditorName={sheet.lastEditorName || null}
                                                updatedAt={sheet.updatedAt}
                                                workspaceId={workspaceId}
                                                roomId={roomId}
                                                viewMode={viewMode}
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateSpreadsheetModal
                        roomId={roomId}
                        workspaceId={convexWorkspaceId}
                        clerkOrgId={workspaceId}
                        onClose={() => setShowCreateModal(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
