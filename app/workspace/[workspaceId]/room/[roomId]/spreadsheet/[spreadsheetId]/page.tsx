"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Loader2, Table } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrganization } from "@clerk/nextjs";
import { ClientSideSuspense, RoomProvider } from "@liveblocks/react/suspense";
import { SpreadsheetEditor } from "@/components/spreadsheet/spreadsheet-editor";
import { LiveMap } from "@liveblocks/client";
import { ContextChatSidebar } from "@/components/chat/context-chat-sidebar";

export default function SpreadsheetPage() {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const roomId = params.roomId as Id<"rooms">;
    const spreadsheetId = params.spreadsheetId as Id<"spreadsheets">;
    const { organization } = useOrganization();

    const spreadsheet = useQuery(api.spreadsheets.getSpreadsheetById, { spreadsheetId });
    const room = useQuery(api.rooms.getRoomById, { roomId });
    const workspace = useQuery(api.workspaces.getWorkspaceById, { workspaceId: room?.workspaceId as Id<"workspaces"> || "skip" as any });


    if (!organization || spreadsheet === undefined || room === undefined) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
        );
    }

    if (spreadsheet === null || room === null) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-4">
                        Spreadsheet not found
                    </h1>
                    <Link
                        href={`/workspace/${organization.id}/room/${roomId}`}
                        className="text-emerald-600 hover:text-emerald-500 font-medium"
                    >
                        Return to Room
                    </Link>
                </div>
            </div>
        );
    }

    const liveblocksRoomId = `spreadsheet:${spreadsheetId}`;

    return (
        <RoomProvider
            id={liveblocksRoomId}
            initialPresence={{
                cursor: null,
            }}
            initialStorage={{
                spreadsheet: new LiveMap(),
            }}
        >
            <div className="fixed inset-0 flex flex-col bg-background">
                {/* Header */}
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex-shrink-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
                >
                    <div className="flex items-center justify-between h-14 px-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/workspace/${organization.id}/room/${roomId}`}
                                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span className="font-medium">Back to Room</span>
                            </Link>
                            <div className="h-6 w-px bg-border" />
                            <div className="flex items-center gap-2">
                                <Table className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                <span className="font-semibold text-foreground">
                                    {spreadsheet.name}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.header>

                {/* Editor Content */}
                <div className="flex-1 overflow-hidden relative">
                    <ClientSideSuspense
                        fallback={
                            <div className="absolute inset-0 flex items-center justify-center bg-background">
                                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                            </div>
                        }
                    >
                        <SpreadsheetEditor spreadsheetId={spreadsheetId} />
                    </ClientSideSuspense>

                    {/* Chat Sidebar */}
                    {/* Note: ContextChatSidebar expects workspaceId to be Id<"workspaces"> */}
                    {workspace && (
                        <ContextChatSidebar
                            contextType="spreadsheet"
                            contextId={spreadsheetId}
                            workspaceId={workspace._id}
                        />
                    )}
                </div>
            </div>
        </RoomProvider>
    );
}
