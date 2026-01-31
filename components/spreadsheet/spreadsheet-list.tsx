"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Table, Loader2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CreateSpreadsheetModal } from "./create-spreadsheet-modal";

interface SpreadsheetListProps {
    roomId: Id<"rooms">;
    workspaceId: string;
    convexWorkspaceId: Id<"workspaces">;
}

export function SpreadsheetList({ roomId, workspaceId, convexWorkspaceId }: SpreadsheetListProps) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const spreadsheets = useQuery(api.spreadsheets.getSpreadsheetsByRoom, { roomId });

    if (spreadsheets === undefined) {
        return (
            <div className="flex items-center justify-center h-full bg-background">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    const filteredSheets = spreadsheets.filter(sheet =>
        sheet.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Search and Action Bar */}
            <div className="flex-shrink-0 bg-surface border-b border-border p-6">
                <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search spreadsheets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        New Spreadsheet
                    </motion.button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto">
                    {filteredSheets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                            <Table className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No spreadsheets found</p>
                            <p className="text-sm">Create one to get started!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSheets.map((sheet, index) => (
                                <Link
                                    key={sheet._id}
                                    href={`/workspace/${workspaceId}/room/${roomId}/spreadsheet/${sheet._id}`}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group p-4 bg-surface border border-border rounded-xl hover:border-emerald-500/50 hover:shadow-lg transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                                                <Table className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(sheet.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-foreground mb-1 truncate">{sheet.name}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            By {sheet.creatorName}
                                        </p>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

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
