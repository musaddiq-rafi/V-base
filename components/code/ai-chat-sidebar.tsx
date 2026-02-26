"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Send,
  Loader2,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMode = "ask" | "agent";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode: ChatMode;
  timestamp: number;
}

interface AIChatSidebarProps {
  isOpen: boolean;
  language: string;
  fileId: Id<"codeFiles">;
  roomId: Id<"rooms">;
  workspaceId: Id<"workspaces">;
  /** Returns current editor content for context */
  getEditorContent: () => string;
  /** Replaces editor content (used in Agent mode) */
  setEditorContent: (code: string) => void;
}

export function AIChatSidebar({
  isOpen,
  language,
  fileId,
  roomId,
  workspaceId,
  getEditorContent,
  setEditorContent,
}: AIChatSidebarProps) {
  const [mode, setMode] = useState<ChatMode>("agent");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convex queries/mutations
  const savedMessages = useQuery(api.aiChat.getMessages, { fileId });
  const saveMessage = useMutation(api.aiChat.saveMessage);
  const clearMessagesMut = useMutation(api.aiChat.clearMessages);

  // Load history from Convex on mount / when data arrives
  useEffect(() => {
    if (savedMessages && !hasLoadedHistory) {
      const restored: ChatMessage[] = savedMessages.map((m) => ({
        id: m._id,
        role: m.role,
        content: m.content,
        mode: m.mode,
        timestamp: m.timestamp,
      }));
      setMessages(restored);
      setHasLoadedHistory(true);
    }
  }, [savedMessages, hasLoadedHistory]);

  // Reset loaded flag when fileId changes
  useEffect(() => {
    setHasLoadedHistory(false);
  }, [fileId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus textarea when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Auto-resize textarea
  const handleTextareaInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const currentCode = getEditorContent();
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      mode,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Persist user message
    try {
      await saveMessage({
        fileId,
        roomId,
        workspaceId,
        role: "user",
        content: trimmed,
        mode,
      });
    } catch (e) {
      console.error("Failed to save user message:", e);
    }

    try {
      const res = await fetch("/api/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          language,
          mode,
          currentCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate response");
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.result,
        mode,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Persist assistant message
      try {
        await saveMessage({
          fileId,
          roomId,
          workspaceId,
          role: "assistant",
          content: data.result,
          mode,
        });
      } catch (e) {
        console.error("Failed to save assistant message:", e);
      }

      // In agent mode, place the code directly in the editor
      if (mode === "agent" && data.result) {
        setEditorContent(data.result);
      }
    } catch (err) {
      const errorContent = `Error: ${err instanceof Error ? err.message : "Failed to get response"}`;
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: errorContent,
        mode,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = async () => {
    setMessages([]);
    try {
      await clearMessagesMut({ fileId });
    } catch (e) {
      console.error("Failed to clear messages:", e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="h-full border-l border-[#3c3c3c] bg-[#1e1e1e] flex flex-col overflow-hidden shrink-0"
        >
          {/* Header */}
          <div className="shrink-0 px-4 py-3 border-b border-[#3c3c3c] bg-[#252526]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-gray-200">
                  AI Assistant
                </span>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  className="p-1 rounded hover:bg-[#3c3c3c] text-gray-500 hover:text-gray-300 transition-colors"
                  title="Clear chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-[#1e1e1e] rounded-lg p-0.5">
              <button
                onClick={() => setMode("ask")}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
                  mode === "ask"
                    ? "bg-[#3c3c3c] text-purple-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Ask
              </button>
              <button
                onClick={() => setMode("agent")}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
                  mode === "agent"
                    ? "bg-[#3c3c3c] text-emerald-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Agent
              </button>
            </div>

            <p className="text-[10px] text-gray-600 mt-1.5 text-center">
              {mode === "ask"
                ? "Get answers and explanations in chat"
                : "Generate code directly in the editor"}
            </p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-purple-400/60" />
                </div>
                <p className="text-sm text-gray-400 mb-1">
                  {mode === "ask"
                    ? "Ask anything about code"
                    : "Describe what you want to build"}
                </p>
                <p className="text-[11px] text-gray-600">
                  {mode === "ask"
                    ? "Get explanations, debug help, and code suggestions"
                    : "AI will generate code and place it in the editor"}
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="group">
                {/* Role indicator */}
                <div className="flex items-center gap-1.5 mb-1">
                  {msg.role === "user" ? (
                    <User className="w-3 h-3 text-blue-400" />
                  ) : (
                    <Bot className="w-3 h-3 text-purple-400" />
                  )}
                  <span className="text-[10px] text-gray-600 uppercase font-medium">
                    {msg.role === "user" ? "You" : "AI"}
                  </span>
                  {msg.role === "assistant" && (
                    <span
                      className={`text-[9px] px-1 py-0.5 rounded ${
                        msg.mode === "agent"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-purple-500/10 text-purple-400"
                      }`}
                    >
                      {msg.mode}
                    </span>
                  )}
                </div>

                {/* Message content */}
                <div
                  className={`relative rounded-lg px-3 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-[#2d2d2d] text-gray-200"
                      : "bg-[#252526] text-gray-300 border border-[#3c3c3c]"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <AssistantMessage content={msg.content} mode={msg.mode} />
                  ) : (
                    <p className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  )}

                  {/* Copy button */}
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="absolute top-2 right-2 p-1 rounded hover:bg-[#3c3c3c] text-gray-600 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                      title="Copy"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-1.5">
                <Bot className="w-3 h-3 text-purple-400" />
                <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>
                    {mode === "agent" ? "Generating code..." : "Thinking..."}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="shrink-0 p-3 border-t border-[#3c3c3c] bg-[#252526]">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  handleTextareaInput();
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === "ask"
                    ? "Ask about code..."
                    : "Describe what to generate..."
                }
                rows={1}
                disabled={isLoading}
                className="flex-1 text-sm bg-[#1e1e1e] border border-[#3c3c3c] text-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-purple-500/50 placeholder:text-gray-600 disabled:opacity-50"
                style={{ minHeight: "36px", maxHeight: "120px" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  mode === "agent"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-purple-600 hover:bg-purple-500 text-white"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────── Markdown Rendering ─────────────── */

/**
 * Renders assistant messages with proper Markdown via react-markdown.
 * Agent mode shows a collapsed code preview. Ask mode renders full markdown.
 */
function AssistantMessage({
  content,
  mode,
}: {
  content: string;
  mode: ChatMode;
}) {
  if (mode === "agent") {
    return (
      <div className="text-xs">
        <p className="text-emerald-400/80 text-[10px] mb-1.5 font-medium">
          ✓ Code placed in editor
        </p>
        <pre className="bg-[#1a1a1a] rounded-md p-2.5 overflow-x-auto text-gray-300 max-h-60 overflow-y-auto border border-[#333]">
          <code>{content}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="ai-markdown-body text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !className;

            if (isInline) {
              return (
                <code
                  className="bg-[#1a1a1a] text-purple-300 px-1.5 py-0.5 rounded text-[12px] font-mono border border-[#333]"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="my-2 rounded-md overflow-hidden border border-[#333]">
                {match && (
                  <div className="flex items-center justify-between px-3 py-1 bg-[#1a1a1a] border-b border-[#333]">
                    <span className="text-[10px] text-gray-500 font-medium uppercase">
                      {match[1]}
                    </span>
                  </div>
                )}
                <pre className="bg-[#0d0d0d] p-3 overflow-x-auto">
                  <code
                    className={`text-[12px] leading-relaxed font-mono text-gray-300 ${className || ""}`}
                    {...props}
                  >
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          // Paragraphs
          p({ children }) {
            return (
              <p className="mb-2 last:mb-0 leading-relaxed text-gray-300">
                {children}
              </p>
            );
          },
          // Headings
          h1({ children }) {
            return (
              <h1 className="text-base font-bold text-gray-100 mb-2 mt-3 first:mt-0 border-b border-[#333] pb-1">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-sm font-bold text-gray-100 mb-1.5 mt-2.5 first:mt-0">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-sm font-semibold text-gray-200 mb-1 mt-2 first:mt-0">
                {children}
              </h3>
            );
          },
          // Lists
          ul({ children }) {
            return (
              <ul className="list-disc list-inside mb-2 space-y-0.5 text-gray-300 text-sm ml-1">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal list-inside mb-2 space-y-0.5 text-gray-300 text-sm ml-1">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
              >
                {children}
              </a>
            );
          },
          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-purple-500/50 pl-3 my-2 text-gray-400 italic">
                {children}
              </blockquote>
            );
          },
          // Horizontal rules
          hr() {
            return <hr className="border-[#333] my-3" />;
          },
          // Tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-2 rounded border border-[#333]">
                <table className="w-full text-xs">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-[#1a1a1a]">{children}</thead>;
          },
          th({ children }) {
            return (
              <th className="px-2 py-1.5 text-left text-gray-400 font-medium border-b border-[#333]">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-2 py-1.5 text-gray-300 border-b border-[#333]/50">
                {children}
              </td>
            );
          },
          // Strong / Bold
          strong({ children }) {
            return (
              <strong className="font-semibold text-gray-100">
                {children}
              </strong>
            );
          },
          // Emphasis / Italic
          em({ children }) {
            return <em className="italic text-gray-400">{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
