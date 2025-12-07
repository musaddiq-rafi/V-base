"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Edit2, Send } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser, useOrganization } from "@clerk/nextjs";

interface ChatSystemProps {
  workspaceId: Id<"workspaces">;
}

interface ChatBubble {
  channelId: Id<"channels">;
  name: string;
  type: "general" | "direct";
  otherUserId?: string;
}

export function ChatSystem({ workspaceId }: ChatSystemProps) {
  const { user } = useUser();
  const [chatBubbles, setChatBubbles] = useState<ChatBubble[]>([]);
  const [openChatWindow, setOpenChatWindow] = useState<Id<"channels"> | null>(null);
  const [showNewDmModal, setShowNewDmModal] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null);
  const hasInitializedGeneral = useRef(false);

  // Get all channels
  const workspaceChannels = useQuery(api.channels.getWorkspaceChannels, {
    workspaceId,
  });
  const directChannels = useQuery(api.channels.getDirectChannels, {
    workspaceId,
  });

  const generalChannel = workspaceChannels?.find((ch) => ch.type === "general");

  // Ensure general channel is always present when bubbles are shown
  useEffect(() => {
    if (generalChannel && showBubbles && !hasInitializedGeneral.current) {
      setChatBubbles((prev) => {
        // Check if general channel already exists
        const hasGeneral = prev.some((b) => b.channelId === generalChannel._id);
        if (hasGeneral) return prev;
        
        // Add general channel at the beginning
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
    
    // Reset flag when bubbles are hidden
    if (!showBubbles) {
      hasInitializedGeneral.current = false;
    }
  }, [generalChannel, showBubbles]);

  const toggleBubbles = () => {
    const newState = !showBubbles;
    setShowBubbles(newState);
  };

  const handleBubbleClick = (bubble: ChatBubble) => {
    setOpenChatWindow(bubble.channelId);
  };

  const handleNewDmClick = () => {
    setShowNewDmModal(true);
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
          chat={currentChat}
          onClose={closeChat}
        />
      )}

      {/* Chat Bubbles - Float above FAB */}
      <AnimatePresence>
        {showBubbles && (
          <div className="fixed bottom-24 right-6 flex flex-col-reverse gap-2 z-50">
            {/* New DM Bubble - Pen Icon */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0 }}
              className="relative"
              onMouseEnter={() => setHoveredBubble("new-dm")}
              onMouseLeave={() => setHoveredBubble(null)}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNewDmClick}
                className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full shadow-lg flex items-center justify-center text-white"
              >
                <Edit2 className="w-5 h-5" />
              </motion.button>
              
              {hoveredBubble === "new-dm" && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute right-14 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap"
                >
                  New Message
                </motion.div>
              )}
            </motion.div>

            {/* Chat Bubbles */}
            {chatBubbles.map((bubble, index) => (
              <motion.div
                key={bubble.channelId}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: (index + 1) * 0.05 }}
                className="relative"
                onMouseEnter={() => setHoveredBubble(bubble.channelId)}
                onMouseLeave={() => setHoveredBubble(null)}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleBubbleClick(bubble)}
                  className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white font-semibold ${
                    bubble.type === "general"
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                      : "bg-gradient-to-br from-purple-500 to-pink-600"
                  }`}
                >
                  {bubble.type === "general" ? "#G" : bubble.name.charAt(0).toUpperCase()}
                </motion.button>

                {hoveredBubble === bubble.channelId && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute right-14 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap"
                  >
                    {bubble.name}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleBubbles}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center z-50"
      >
        {showBubbles ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </motion.button>

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

// Chat Window Component
interface ChatWindowProps {
  chat: ChatBubble;
  onClose: () => void;
}

function ChatWindow({ chat, onClose }: ChatWindowProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.messages.getChannelMessages, {
    channelId: chat.channelId,
  });
  const sendMessage = useMutation(api.messages.sendMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);
  const markAsSeen = useMutation(api.messages.markChannelMessagesAsSeen);

  useEffect(() => {
    if (messages && messages.length > 0) {
      markAsSeen({ channelId: chat.channelId });
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, markAsSeen, chat.channelId]);

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
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-semibold">
            {chat.type === "general" ? "#" : chat.name.charAt(0).toUpperCase()}
          </div>
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
          const seenByCount = msg.seenBy?.length || 0;

          return (
            <div
              key={msg._id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
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

                {/* Seen status */}
                {isOwn && seenByCount > 0 && (
                  <span className="text-xs text-gray-400 mt-1 px-2">
                    Seen by {seenByCount}
                  </span>
                )}
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

// New DM Modal
interface NewDmModalProps {
  workspaceId: Id<"workspaces">;
  onClose: () => void;
  onChatCreated: (chat: ChatBubble) => void;
}

function NewDmModal({ workspaceId, onClose, onChatCreated }: NewDmModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { memberships } = useOrganization({
    memberships: { pageSize: 50 },
  });
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

  const handleSelectUser = async (userId: string, userName: string) => {
    const channelId = await createOrGetDM({
      workspaceId,
      otherUserId: userId,
    });

    onChatCreated({
      channelId,
      name: userName,
      type: "direct",
      otherUserId: userId,
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
            const userName = `${member.publicUserData?.firstName || ""} ${
              member.publicUserData?.lastName || ""
            }`.trim() || member.publicUserData?.identifier || "Unknown";

            return (
              <button
                key={member.id}
                onClick={() =>
                  handleSelectUser(
                    member.publicUserData?.userId || "",
                    userName
                  )
                }
                className="w-full p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
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
