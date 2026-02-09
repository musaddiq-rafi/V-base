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
}

interface ChatBubble {
  channelId: Id<"channels">;
  name: string;
  type: "general" | "direct";
  otherUserId?: string;
  avatarUrl?: string;
}

export function ChatSystem({ workspaceId }: ChatSystemProps) {
  const { user } = useUser();
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
        return [
          {
            channelId: generalChannel._id,
            name: "General",
            type: "general",
          },
          ...prev,
        ];
      });
    }

    if (!showBubbles) {
      hasInitializedGeneral.current = false;
    }
  }, [generalChannel, showBubbles]);

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

  // Track previous unread counts to detect new messages
  const prevUnreadCountsRef = useRef<Map<Id<"channels">, number>>(new Map());

  // Show message preview popup when new messages arrive and bubbles are collapsed
  useEffect(() => {
    if (showBubbles || openChatWindow) {
      // Don't show preview if bubbles are open or a chat window is open
      prevUnreadCountsRef.current = new Map(unreadCounts);
      return;
    }

    // Check for new unread messages
    for (const [channelId, count] of unreadCounts) {
      const prevCount = prevUnreadCountsRef.current.get(channelId) || 0;
      
      if (count > prevCount) {
        // New message arrived! Show preview
        const preview = previews.get(channelId);
        if (preview) {
          // Find channel info (from general or DM channels)
          const generalCh = workspaceChannels?.find((ch) => ch._id === channelId);
          const dmCh = directChannels?.find((ch) => ch._id === channelId);
          
          let channelName = "Unknown";
          let avatarUrl: string | undefined;
          
          if (generalCh) {
            channelName = generalCh.type === "general" ? "General" : generalCh.name;
          } else if (dmCh) {
            channelName = dmCh.otherUserName || "Unknown";
            // Find avatar for DM
            const member = memberships?.data?.find(
              (m: { publicUserData?: { userId?: string } }) =>
                m.publicUserData?.userId === dmCh.otherUserId
            );
            avatarUrl = (member?.publicUserData as { imageUrl?: string })?.imageUrl;
          }
          
          setMessagePreview({
            channelId,
            channelName,
            preview: preview.length > 100 ? preview.substring(0, 100) + "..." : preview,
            avatarUrl,
          });
          
          // Auto-hide preview after 5 seconds
          const timer = setTimeout(() => {
            setMessagePreview((current) => 
              current?.channelId === channelId ? null : current
            );
          }, 5000);
          
          // Update ref and return early (only show one preview at a time)
          prevUnreadCountsRef.current = new Map(unreadCounts);
          return () => clearTimeout(timer);
        }
      }
    }
    
    // Update ref for next comparison
    prevUnreadCountsRef.current = new Map(unreadCounts);
  }, [unreadCounts, previews, showBubbles, openChatWindow, workspaceChannels, directChannels, memberships]);

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
            className="fixed bottom-24 right-6 bg-background-secondary rounded-xl shadow-2xl p-4 w-80 cursor-pointer z-50 border border-border backdrop-blur-xl"
            onClick={() => {
              const bubble = chatBubbles.find(
                (b) => b.channelId === messagePreview.channelId
              );
              if (bubble) {
                handleBubbleClick(bubble);
              } else {
                // If bubble doesn't exist yet, create it and open chat
                const generalCh = workspaceChannels?.find((ch) => ch._id === messagePreview.channelId);
                const dmCh = directChannels?.find((ch) => ch._id === messagePreview.channelId);
                
                const newBubble: ChatBubble = {
                  channelId: messagePreview.channelId,
                  name: messagePreview.channelName,
                  type: generalCh?.type === "general" ? "general" : "direct",
                  otherUserId: dmCh?.otherUserId,
                  avatarUrl: messagePreview.avatarUrl,
                };
                
                setChatBubbles((prev) => [...prev, newBubble]);
                setOpenChatWindow(messagePreview.channelId);
              }
              setMessagePreview(null);
            }}
          >
            <div className="flex items-start gap-3">
              {messagePreview.avatarUrl ? (
                <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0 ring-2 ring-border">
                  <Image
                    src={messagePreview.avatarUrl}
                    alt={messagePreview.channelName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {messagePreview.channelName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {messagePreview.channelName}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                  {messagePreview.preview}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMessagePreview(null);
                }}
                className="text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors"
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
          className="w-14 h-14 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-full shadow-lg shadow-sky-500/25 flex items-center justify-center relative overflow-visible"
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
            className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-badge-border shadow-sm"
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
        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-badge-border shadow-sm">
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
          className="absolute -top-2 -left-2 w-5 h-5 bg-muted hover:bg-muted/80 text-foreground rounded-full flex items-center justify-center text-xs shadow-lg z-10 border border-border backdrop-blur-sm"
        >
          <X className="w-3 h-3" />
        </motion.button>
      )}

      {isHovered && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-14 top-1/2 -translate-y-1/2 bg-background-secondary text-foreground px-3 py-1.5 rounded-lg text-sm whitespace-nowrap max-w-xs border border-border shadow-lg"
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
        onRemove={bubble.type !== "general" ? onRemove : undefined}
        isHovered={isHovered}
        label={previewLabel}
        unreadCount={unreadCount}
        avatarUrl={bubble.avatarUrl}
        bgColor={
          bubble.type === "general"
            ? "from-blue-500 to-indigo-600"
            : "from-purple-500 to-pink-600"
        }
      >
        {bubble.type === "general" ? "#G" : bubble.name.charAt(0).toUpperCase()}
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

  // Mark channel as read when chat window opens AND when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      markAsRead({ channelId: chat.channelId });
    }
  }, [chat.channelId, messages, markAsRead]);

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
      className="fixed bottom-6 right-24 w-80 h-[500px] bg-background-secondary rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden z-40 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="p-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          {chat.avatarUrl ? (
            <div className="w-8 h-8 rounded-full overflow-hidden relative ring-2 ring-white/20">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
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
                  <span className="text-xs text-muted-foreground mb-1 px-2">
                    {msg.authorName}
                  </span>
                )}
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isOwn
                      ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm border border-border"
                  }`}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                </div>

                {/* Reactions */}
                <div className="flex items-center gap-1 mt-1">
                  <button
                    onClick={() => handleReaction(msg._id, "like")}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      msg.reactions?.like?.includes(user?.id || "")
                        ? "bg-sky-500/20 text-sky-500 dark:text-sky-400"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    👍 {msg.reactions?.like?.length || 0}
                  </button>
                  <button
                    onClick={() => handleReaction(msg._id, "haha")}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      msg.reactions?.haha?.includes(user?.id || "")
                        ? "bg-yellow-500/20 text-yellow-500 dark:text-yellow-400"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
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
      <div className="p-3 border-t border-border bg-background-secondary">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-muted border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm text-foreground placeholder-muted-foreground"
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="p-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-full hover:shadow-lg hover:shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-background-secondary rounded-2xl p-6 shadow-2xl w-full max-w-md mx-4 border border-border"
      >
        <h2 className="text-xl font-bold text-foreground mb-4">
          New Direct Message
        </h2>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search members..."
          className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent mb-4 text-foreground placeholder-muted-foreground"
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
                className="w-full p-3 hover:bg-muted rounded-lg transition-colors flex items-center gap-3 border border-transparent hover:border-border"
              >
                {avatarUrl ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0 ring-2 ring-border">
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
                  <div className="font-medium text-foreground">{userName}</div>
                  <div className="text-xs text-muted-foreground">
                    {member.publicUserData?.identifier}
                  </div>
                </div>
              </button>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No members found</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground font-medium rounded-lg transition-colors border border-border"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}
