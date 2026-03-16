"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Send, Download, FileJson, FileSpreadsheet } from "lucide-react";

interface MeetingChatProps {
  meetingId: Id<"meetings">;
}

export function MeetingChat({ meetingId }: MeetingChatProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Get the meeting's chat channel
  const channel = useQuery(api.channels.getChannelByContext, {
    contextType: "meeting",
    contextId: meetingId,
  });

  // Get messages for this channel
  const messages = useQuery(
    api.messages.getMessagesWithAuthors,
    channel ? { channelId: channel._id } : "skip",
  );

  // Mutations
  const sendMessageMutation = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markChannelAsRead);

  // Mark channel as read when messages load or new messages arrive
  useEffect(() => {
    if (channel && messages && messages.length > 0) {
      markAsRead({ channelId: channel._id });
    }
  }, [channel, messages, markAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportMenu]);

  const handleSend = async () => {
    if (!message.trim() || !channel) return;

    try {
      await sendMessageMutation({
        channelId: channel._id,
        content: message.trim(),
      });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Export chat as JSON
  const exportAsJSON = useCallback(() => {
    if (!messages || messages.length === 0) return;

    const exportData = messages.map((msg) => ({
      sender: msg.authorName,
      senderId: msg.authorId,
      message: msg.content,
      timestamp: new Date(msg.timestamp).toISOString(),
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `meeting-chat-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }, [messages]);

  // Export chat as CSV
  const exportAsCSV = useCallback(() => {
    if (!messages || messages.length === 0) return;

    const headers = ["Sender", "Message", "Timestamp"];
    const csvRows = [
      headers.join(","),
      ...messages.map((msg) => {
        const sender = `"${msg.authorName.replace(/"/g, '""')}"`;
        const content = `"${msg.content.replace(/"/g, '""').replace(/\n/g, " ")}"`;
        const timestamp = new Date(msg.timestamp).toISOString();
        return `${sender},${content},${timestamp}`;
      }),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `meeting-chat-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }, [messages]);

  // Show loading state while channel is being fetched
  if (!channel) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-muted-foreground text-sm">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs text-muted-foreground">
          {messages?.length || 0} messages
        </span>
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Export chat"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Export Menu Dropdown */}
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 bg-background-secondary border border-border rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
              <button
                onClick={exportAsJSON}
                disabled={!messages || messages.length === 0}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileJson className="w-4 h-4" />
                Export as JSON
              </button>
              <button
                onClick={exportAsCSV}
                disabled={!messages || messages.length === 0}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export as CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!messages || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Send className="w-5 h-5 text-muted-foreground rotate-45" />
            </div>
            <p className="text-muted-foreground text-sm">No messages yet</p>
            <p className="text-muted-foreground/70 text-xs mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.authorId === user?.id;
            return (
              <div
                key={msg._id}
                className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {isSelf ? "You" : msg.authorName}
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl ${
                    isSelf
                      ? "bg-sky-600 text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-muted disabled:cursor-not-allowed rounded-xl text-white transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
