"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Edit2, Send } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser, useOrganization } from "@clerk/nextjs";
import Image from "next/image";

interface ChatSystemProps {
  workspaceId: Id<"workspaces">;
  activeFileChat?: {
    channelId: Id<"channels">;
    name: string;
    fileType: "code" | "document" | "whiteboard";
  };
}

interface ChatBubble {
  channelId: Id<"channels">;
  name: string;
  type: "general" | "direct" | "file";
  otherUserId?: string;
  avatarUrl?: string;
  fileType?: "code" | "document" | "whiteboard";
}

export function ChatSystem({ workspaceId, activeFileChat }: ChatSystemProps) {
  const [chatBubbles, setChatBubbles] = useState<ChatBubble[]>([]);
  const [openChatWindow, setOpenChatWindow] = useState<Id<"channels"> | null>(
    null
  );
  const [showNewDmModal, setShowNewDmModal] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null);
  const [messagePreview, setMessagePreview] = useState<{
    channelId: Id<"channels">;
    channelName: string;
    preview: string;
    avatarUrl?: string;
  } | null>(null);
  const hasInitializedGeneral = useRef(false);
  const closedBubblesRef = useRef<Set<Id<"channels">>>(new Set());
  const hasAutoOpenedRef = useRef(false);

  // Get all channels
  const workspaceChannels = useQuery(api.channels.getWorkspaceChannels, {
    workspaceId,
  });
  const directChannels = useQuery(api.channels.getDirectChannels, {
    workspaceId,
  });

  const generalChannel = workspaceChannels?.find((ch) => ch.type === "general");

  // Get organization members for avatars
  const { memberships } = useOrganization({ memberships: { pageSize: 50 } });

  // Single query for all unread counts (optimized - replaces N subscriptions)
  const unreadCountsData = useQuery(api.messages.getUnreadCounts, {
    workspaceId,
  });

  // Convert to Maps for easier lookup
  const unreadCounts = new Map<Id<"channels">, number>(
    Object.entries(unreadCountsData?.channels || {}).map(([k, v]) => [
      k as Id<"channels">,
      v,
    ])
  );

  // Previews map from backend (eliminates N getLatestMessage calls)
  const previews = new Map<Id<"channels">, string>(
    Object.entries(unreadCountsData?.previews || {}).map(([k, v]) => [
      k as Id<"channels">,
      v,
    ])
  );

  // Total is now calculated on the backend
  const totalUnreadCount = unreadCountsData?.total || 0;

  // Ensure general channel is always present
  useEffect(() => {
    if (generalChannel && showBubbles && !hasInitializedGeneral.current) {
      setChatBubbles((prev) => {
        const hasGeneral = prev.some((b) => b.channelId === generalChannel._id);
        if (hasGeneral) return prev;

        hasInitializedGeneral.current = true;
        const next = [...prev];
        const fileIndex = next.findIndex((b) => b.type === "file");
        const insertIndex = fileIndex === -1 ? 0 : fileIndex + 1;
        next.splice(insertIndex, 0, {
          channelId: generalChannel._id,
          name: "General",
          type: "general",
        });
        return next;
      });
    }

    if (!showBubbles) {
      hasInitializedGeneral.current = false;
    }
  }, [generalChannel, showBubbles]);

  // Ensure file chat bubble is present when viewing a file
  useEffect(() => {
    setChatBubbles((prev) => {
      const withoutFile = prev.filter((b) => b.type !== "file");

      if (!activeFileChat) {
        return withoutFile;
      }

      const fileBubble: ChatBubble = {
        channelId: activeFileChat.channelId,
        name: activeFileChat.name,
        type: "file",
        fileType: activeFileChat.fileType,
      };

      const generalIndex = withoutFile.findIndex((b) => b.type === "general");
      if (generalIndex === -1) {
        return [fileBubble, ...withoutFile];
      }

      const next = [...withoutFile];
      next.splice(generalIndex, 0, fileBubble);
      return next;
    });
  }, [activeFileChat]);

  // Auto-select default chat when bubbles open
  useEffect(() => {
    if (!showBubbles) {
      hasAutoOpenedRef.current = false;
      return;
    }

    if (hasAutoOpenedRef.current) return;

    if (activeFileChat) {
      setOpenChatWindow(activeFileChat.channelId);
      hasAutoOpenedRef.current = true;
      return;
    }

    if (generalChannel) {
      setOpenChatWindow(generalChannel._id);
      hasAutoOpenedRef.current = true;
    }
  }, [showBubbles, activeFileChat, generalChannel]);

  // If a file chat is open and the file changes, switch to the new file chat
  useEffect(() => {
    if (!activeFileChat || !openChatWindow) return;

    const openBubble = chatBubbles.find((b) => b.channelId === openChatWindow);
    if (
      openBubble?.type === "file" &&
      openChatWindow !== activeFileChat.channelId
    ) {
      setOpenChatWindow(activeFileChat.channelId);
    }
  }, [activeFileChat, openChatWindow, chatBubbles]);

  // If leaving a file, close file chat window
  useEffect(() => {
    if (activeFileChat) return;

    const openBubble = chatBubbles.find((b) => b.channelId === openChatWindow);
    if (openBubble?.type === "file") {
      setOpenChatWindow(null);
    }
  }, [activeFileChat, openChatWindow, chatBubbles]);

  // Auto-add DM bubbles when new messages arrive (but not if user closed them without new messages)
  useEffect(() => {
    if (directChannels) {
      directChannels.forEach((dm) => {
        const exists = chatBubbles.some((b) => b.channelId === dm._id);
        const wasClosed = closedBubblesRef.current.has(dm._id);
        const hasUnread = (unreadCounts.get(dm._id) || 0) > 0;

        // Add bubble if: 1) doesn't exist, AND 2) either wasn't closed OR has new unread messages
        if (!exists && (!wasClosed || hasUnread) && dm.otherUserId) {
          // If it was closed but has unread, remove from closed set
          if (wasClosed && hasUnread) {
            closedBubblesRef.current.delete(dm._id);
          }

          // Find user avatar
          const member = memberships?.data?.find(
            (m: { publicUserData?: { userId?: string } }) =>
              m.publicUserData?.userId === dm.otherUserId
          );
          const avatarUrl = (member?.publicUserData as { imageUrl?: string })
            ?.imageUrl;

          setChatBubbles((prev) => [
            ...prev,
            {
              channelId: dm._id,
              name: dm.otherUserName || "Unknown",
              type: "direct",
              otherUserId: dm.otherUserId,
              avatarUrl,
            },
          ]);
        }
      });
    }
  }, [directChannels, chatBubbles, memberships, unreadCounts]);

  const toggleBubbles = () => {
    setShowBubbles(!showBubbles);
  };

  const handleBubbleClick = (bubble: ChatBubble) => {
    setOpenChatWindow(bubble.channelId);
    setMessagePreview(null);
  };

  const handleNewDmClick = () => {
    setShowNewDmModal(true);
  };

  const removeBubble = (channelId: Id<"channels">) => {
    // Mark this bubble as closed by the user
    closedBubblesRef.current.add(channelId);

    setChatBubbles((prev) => prev.filter((b) => b.channelId !== channelId));
    // If the removed bubble's chat was open, close it
    if (openChatWindow === channelId) {
      setOpenChatWindow(null);
    }
  };

  const closeChat = () => {
    setOpenChatWindow(null);
  };

  const addDmBubble = (chat: ChatBubble) => {
    if (!chatBubbles.find((b) => b.channelId === chat.channelId)) {
      setChatBubbles([...chatBubbles, chat]);
    }
    setOpenChatWindow(chat.channelId);
    setShowNewDmModal(false);
  };

  const currentChat = chatBubbles.find((b) => b.channelId === openChatWindow);

  return (
    <>
      {/* Chat Window */}
      {openChatWindow && currentChat && (
        <ChatWindow
          key={currentChat.channelId}
          chat={currentChat}
          onClose={closeChat}
          workspaceId={workspaceId}
        />
      )}

      {/* Message Preview Popup */}
      <AnimatePresence>
        {messagePreview && !showBubbles && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 bg-white rounded-xl shadow-2xl p-4 w-80 cursor-pointer z-50 border border-gray-200"
            onClick={() => {
              const bubble = chatBubbles.find(
                (b) => b.channelId === messagePreview.channelId
              );
              if (bubble) {
                handleBubbleClick(bubble);
              } else {
                // If bubble doesn't exist yet, create it
                setShowBubbles(true);
              }
              setMessagePreview(null);
            }}
          >
            <div className="flex items-start gap-3">
              {messagePreview.avatarUrl ? (
                <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0">
                  <Image
                    src={messagePreview.avatarUrl}
                    alt={messagePreview.channelName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {messagePreview.channelName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {messagePreview.channelName}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                  {messagePreview.preview}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMessagePreview(null);
                }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden trackers removed - now using single getUnreadCounts query */}

      {/* Chat Bubbles */}
      <AnimatePresence>
        {showBubbles && (
          <div className="fixed bottom-24 right-6 flex flex-col-reverse gap-2 z-50">
            {/* New DM Bubble */}
            <ChatBubbleComponent
              type="new-dm"
              onMouseEnter={() => setHoveredBubble("new-dm")}
              onMouseLeave={() => setHoveredBubble(null)}
              onClick={handleNewDmClick}
              isHovered={hoveredBubble === "new-dm"}
              label="New Message"
            >
              <Edit2 className="w-5 h-5" />
            </ChatBubbleComponent>

            {/* Chat Bubbles */}
            {chatBubbles.map((bubble, index) => (
              <ChatBubbleWithPreview
                key={bubble.channelId}
                bubble={bubble}
                index={index}
                isHovered={hoveredBubble === bubble.channelId}
                onMouseEnter={() => setHoveredBubble(bubble.channelId)}
                onMouseLeave={() => setHoveredBubble(null)}
                onClick={() => handleBubbleClick(bubble)}
                onRemove={() => removeBubble(bubble.channelId)}
                unreadCount={unreadCounts.get(bubble.channelId) || 0}
                preview={previews.get(bubble.channelId) || ""}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleBubbles}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center relative overflow-visible"
        >
          {showBubbles ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </motion.button>

        {/* Total Unread Count Badge */}
        {!showBubbles && totalUnreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-white shadow-sm"
          >
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </motion.div>
        )}
      </div>

      {/* New DM Modal */}
      {showNewDmModal && (
        <NewDmModal
          workspaceId={workspaceId}
          onClose={() => setShowNewDmModal(false)}
          onChatCreated={addDmBubble}
        />
      )}
    </>
  );
}

// Chat Bubble Component
interface ChatBubbleComponentProps {
  type?: string;
  children: React.ReactNode;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  onRemove?: () => void;
  isHovered: boolean;
  label: string;
  unreadCount?: number;
  avatarUrl?: string;
  bgColor?: string;
}

function ChatBubbleComponent({
  children,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onRemove,
  isHovered,
  label,
  unreadCount,
  avatarUrl,
  bgColor = "from-purple-500 to-pink-600",
}: ChatBubbleComponentProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white font-semibold relative overflow-hidden ${
          avatarUrl ? "" : `bg-gradient-to-br ${bgColor}`
        }`}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={label} fill className="object-cover" />
        ) : (
          children
        )}
      </motion.button>

      {/* Unread Badge - Outside button to prevent clipping */}
      {unreadCount !== undefined && unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm">
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}

      {/* Close button - Only show if onRemove is provided and on hover */}
      {onRemove && isHovered && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -left-2 w-5 h-5 bg-gray-800 hover:bg-gray-900 text-white rounded-full flex items-center justify-center text-xs shadow-lg z-10"
        >
          <X className="w-3 h-3" />
        </motion.button>
      )}

      {isHovered && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-14 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap max-w-xs"
        >
          {label}
        </motion.div>
      )}
    </motion.div>
  );
}

// Chat Bubble with Preview and Unread Count (no queries - uses parent data)
interface ChatBubbleWithPreviewProps {
  bubble: ChatBubble;
  index: number;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  onRemove: () => void;
  unreadCount: number;
  preview: string;
}

function ChatBubbleWithPreview({
  bubble,
  index,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onRemove,
  unreadCount,
  preview,
}: ChatBubbleWithPreviewProps) {
  // Create preview label from prop (no additional queries!)
  const previewLabel = preview
    ? `${bubble.name}: ${preview}${preview.length >= 50 ? "..." : ""}`
    : bubble.name;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ delay: (index + 1) * 0.05 }}
    >
      <ChatBubbleComponent
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        onRemove={
          bubble.type !== "general" && bubble.type !== "file"
            ? onRemove
            : undefined
        }
        isHovered={isHovered}
        label={previewLabel}
        unreadCount={unreadCount}
        avatarUrl={bubble.avatarUrl}
        bgColor={
          bubble.type === "general"
            ? "from-blue-500 to-indigo-600"
            : bubble.type === "file"
              ? bubble.fileType === "whiteboard"
                ? "from-orange-500 to-amber-600"
                : bubble.fileType === "document"
                  ? "from-blue-500 to-cyan-600"
                  : "from-emerald-500 to-teal-600"
              : "from-purple-500 to-pink-600"
        }
      >
        {bubble.type === "general"
          ? "#G"
          : bubble.type === "file"
            ? "#F"
            : bubble.name.charAt(0).toUpperCase()}
      </ChatBubbleComponent>
    </motion.div>
  );
}

// Chat Window Component
interface ChatWindowProps {
  chat: ChatBubble;
  onClose: () => void;
  workspaceId: Id<"workspaces">;
}

function ChatWindow({ chat, onClose, workspaceId }: ChatWindowProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use optimized query that resolves author names at query time
  const messages = useQuery(api.messages.getMessagesWithAuthors, {
    channelId: chat.channelId,
  });
  const sendMessage = useMutation(api.messages.sendMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);
  const markAsRead = useMutation(api.messages.markChannelAsRead);

  // Get all workspace members for seen receipts
  const { memberships } = useOrganization({ memberships: { pageSize: 50 } });

  // Mark channel as read when chat window opens (single DB write)
  useEffect(() => {
    markAsRead({ channelId: chat.channelId });
  }, [chat.channelId, markAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    await sendMessage({
      channelId: chat.channelId,
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
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-24 w-80 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-40"
    >
      {/* Header */}
      <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          {chat.avatarUrl ? (
            <div className="w-8 h-8 rounded-full overflow-hidden relative">
              <Image
                src={chat.avatarUrl}
                alt={chat.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-semibold">
              {chat.type === "general"
                ? "#"
                : chat.type === "file"
                  ? "#F"
                  : chat.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium">{chat.name}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages?.map((msg) => {
          const isOwn = msg.authorId === user?.id;

          return (
            <div
              key={msg._id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}
              >
                {!isOwn && (
                  <span className="text-xs text-gray-500 mb-1 px-2">
                    {msg.authorName}
                  </span>
                )}
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isOwn
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white text-gray-900 rounded-bl-sm shadow-sm"
                  }`}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                </div>

                {/* Reactions */}
                <div className="flex items-center gap-1 mt-1">
                  <button
                    onClick={() => handleReaction(msg._id, "like")}
                    className={`text-xs px-2 py-1 rounded-full ${
                      msg.reactions?.like?.includes(user?.id || "")
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    } hover:bg-blue-100 transition-colors`}
                  >
                    👍 {msg.reactions?.like?.length || 0}
                  </button>
                  <button
                    onClick={() => handleReaction(msg._id, "haha")}
                    className={`text-xs px-2 py-1 rounded-full ${
                      msg.reactions?.haha?.includes(user?.id || "")
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-gray-100 text-gray-600"
                    } hover:bg-yellow-100 transition-colors`}
                  >
                    😂 {msg.reactions?.haha?.length || 0}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// New DM Modal Component
interface NewDmModalProps {
  workspaceId: Id<"workspaces">;
  onClose: () => void;
  onChatCreated: (chat: ChatBubble) => void;
}

function NewDmModal({ workspaceId, onClose, onChatCreated }: NewDmModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { memberships } = useOrganization({ memberships: { pageSize: 50 } });
  const { user } = useUser();
  const createOrGetDM = useMutation(api.channels.createOrGetDirectChannel);

  const members = memberships?.data || [];
  const filteredMembers = members.filter((m: any) => {
    if (m.publicUserData?.userId === user?.id) return false;

    const firstName = m.publicUserData?.firstName?.toLowerCase() || "";
    const lastName = m.publicUserData?.lastName?.toLowerCase() || "";
    const identifier = m.publicUserData?.identifier?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return (
      firstName.includes(search) ||
      lastName.includes(search) ||
      identifier.includes(search) ||
      `${firstName} ${lastName}`.includes(search)
    );
  });

  const handleSelectUser = async (
    userId: string,
    userName: string,
    avatarUrl?: string
  ) => {
    const channelId = await createOrGetDM({
      workspaceId,
      otherUserId: userId,
    });

    onChatCreated({
      channelId,
      name: userName,
      type: "direct",
      otherUserId: userId,
      avatarUrl,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md mx-4"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          New Direct Message
        </h2>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search members..."
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          autoFocus
        />

        <div className="max-h-64 overflow-y-auto space-y-2">
          {filteredMembers.map((member: any) => {
            const userName =
              `${member.publicUserData?.firstName || ""} ${
                member.publicUserData?.lastName || ""
              }`.trim() ||
              member.publicUserData?.identifier ||
              "Unknown";

            const avatarUrl = member.publicUserData?.imageUrl;

            return (
              <button
                key={member.id}
                onClick={() =>
                  handleSelectUser(
                    member.publicUserData?.userId || "",
                    userName,
                    avatarUrl
                  )
                }
                className="w-full p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
              >
                {avatarUrl ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0">
                    <Image
                      src={avatarUrl}
                      alt={userName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{userName}</div>
                  <div className="text-xs text-gray-500">
                    {member.publicUserData?.identifier}
                  </div>
                </div>
              </button>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">No members found</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}
