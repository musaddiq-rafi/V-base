"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MessageCircle, X, Send, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";

interface ContextChatSidebarProps {
    contextType: "document" | "codeFile" | "whiteboard" | "spreadsheet";
    contextId: string;
    workspaceId: Id<"workspaces">;
}

export function ContextChatSidebar({
    contextType,
    contextId,
    workspaceId
}: ContextChatSidebarProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Get the linked channel
    const channel = useQuery(api.channels.getChannelByContext, {
        contextType,
        contextId,
    });

    if (channel === undefined) return null; // Loading
    if (channel === null) return null; // Channel not found (shouldn't happen if created)

    return (
        <>
            {/* Trigger Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
                >
                    <MessageCircle className="w-5 h-5" />
                </motion.button>
            )}

            {/* Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="fixed top-14 bottom-0 right-0 w-80 bg-background border-l border-border shadow-xl z-30 flex flex-col"
                    >
                        {/* Header */}
                        <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-muted/30">
                            <span className="font-semibold text-foreground">Chat</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chat Content */}
                        <ContextChatPanel channelId={channel._id} channelName={channel.name} />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

interface ContextChatPanelProps {
    channelId: Id<"channels">;
    channelName: string;
}

function ContextChatPanel({ channelId, channelName }: ContextChatPanelProps) {
    const { user } = useUser();
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const messages = useQuery(api.messages.getMessagesWithAuthors, {
        channelId,
    });
    const sendMessage = useMutation(api.messages.sendMessage);
    const toggleReaction = useMutation(api.messages.toggleReaction);
    const markAsRead = useMutation(api.messages.markChannelAsRead);

    // Mark as read on mount and updates
    useEffect(() => {
        if (messages && messages.length > 0) {
            markAsRead({ channelId });
        }
    }, [channelId, messages, markAsRead]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        await sendMessage({
            channelId,
            content: message.trim(),
        });
        setMessage("");
    };

    const handleReaction = async (
        messageId: Id<"messages">,
        reactionType: "like" | "dislike" | "haha"
    ) => {
        await toggleReaction({ messageId, reactionType });
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages?.map((msg) => {
                    const isOwn = msg.authorId === user?.id;
                    return (
                        <div key={msg._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                                {!isOwn && (
                                    <span className="text-xs text-muted-foreground mb-1 ml-1">{msg.authorName}</span>
                                )}
                                <div className={`px-3 py-2 rounded-lg text-sm break-words ${isOwn
                                        ? "bg-emerald-600 text-white rounded-br-none"
                                        : "bg-muted text-foreground rounded-bl-none"
                                    }`}>
                                    {msg.content}
                                </div>
                                {/* Reactions */}
                                <div className="flex items-center gap-1 mt-1">
                                    {['like', 'haha'].map((type) => {
                                        const count = msg.reactions?.[type as 'like' | 'haha']?.length || 0;
                                        const reacted = msg.reactions?.[type as 'like' | 'haha']?.includes(user?.id || "");
                                        if (count === 0 && !reacted) return null;
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => handleReaction(msg._id, type as any)}
                                                className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors border ${reacted
                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                                                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                                                    }`}
                                            >
                                                {type === 'like' ? '👍' : '😂'} {count}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-border bg-background">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-muted border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        className="p-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
