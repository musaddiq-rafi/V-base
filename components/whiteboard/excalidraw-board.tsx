"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useRef } from "react";
import { useBroadcastEvent, useEventListener, useOthers, useUpdateMyPresence } from "@liveblocks/react/suspense";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { Cloud, CloudOff, Check, Sparkles, Send, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import "@excalidraw/excalidraw/index.css";
import { InlineLoader } from "@/components/shared/page-loader";

interface WhiteboardProps {
  roomId: string;
  whiteboardId: Id<"whiteboards">;
}

// Dynamically import Excalidraw to avoid SSR issues
const ExcalidrawWrapper = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-500">Loading whiteboard...</div>
      </div>
    ),
  }
);

// ─── AI Diagram Types & Constants ────────────────────────────────────────────

type DiagramNode = { id: string; label: string; shape: "rectangle" | "diamond" | "ellipse" };
type DiagramEdge = { from: string; to: string; label: string };
type DiagramData  = { title?: string; nodes: DiagramNode[]; edges: DiagramEdge[] };

const NODE_W = 185;
const NODE_H = 80;
const GAP_X  = 75;
const GAP_Y  = 90;

const SHAPE_COLORS: Record<string, { bg: string; stroke: string }> = {
  rectangle: { bg: "#dbeafe", stroke: "#3b82f6" },
  diamond:   { bg: "#fef3c7", stroke: "#f59e0b" },
  ellipse:   { bg: "#dcfce7", stroke: "#22c55e" },
};

// ─────────────────────────────────────────────────────────────────────────────

function rnd()  { return Math.floor(Math.random() * 999983) + 1; }
function uid()  { return Math.random().toString(36).substring(2, 10); }
function now()  { return Date.now(); }

function wrapText(text: string, max = 20): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const c = line ? `${line} ${w}` : w;
    if (c.length <= max) { line = c; }
    else { if (line) lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [text];
}

function computeLayout(
  nodes: DiagramNode[],
  edges: DiagramEdge[]
): Map<string, { x: number; y: number }> {
  const inDeg    = new Map<string, number>();
  const children = new Map<string, string[]>();
  nodes.forEach(n => { inDeg.set(n.id, 0); children.set(n.id, []); });
  edges.forEach(e => {
    inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1);
    children.get(e.from)?.push(e.to);
  });

  const roots   = nodes.filter(n => (inDeg.get(n.id) ?? 0) === 0).map(n => n.id);
  const queue   = roots.length ? [...roots] : [nodes[0]?.id].filter(Boolean) as string[];
  const layers: string[][] = [];
  const visited = new Set<string>();
  const pending = [...queue];

  while (pending.length) {
    const size  = pending.length;
    const layer: string[] = [];
    for (let i = 0; i < size; i++) {
      const id = pending.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      layer.push(id);
      children.get(id)?.forEach(c => { if (!visited.has(c)) pending.push(c); });
    }
    if (layer.length) layers.push(layer);
  }

  const unvisited = nodes.filter(n => !visited.has(n.id));
  if (unvisited.length) layers.push(unvisited.map(n => n.id));

  const maxCount = Math.max(...layers.map(l => l.length));
  const totalW   = maxCount * (NODE_W + GAP_X) - GAP_X;
  const pos      = new Map<string, { x: number; y: number }>();

  layers.forEach((layer, li) => {
    const lw     = layer.length * (NODE_W + GAP_X) - GAP_X;
    const startX = (totalW - lw) / 2;
    layer.forEach((id, ni) => {
      pos.set(id, { x: startX + ni * (NODE_W + GAP_X), y: li * (NODE_H + GAP_Y) });
    });
  });

  return pos;
}

function makeShapeEl(node: DiagramNode, x: number, y: number): object {
  const c = SHAPE_COLORS[node.shape] ?? SHAPE_COLORS.rectangle;
  return {
    id: uid(), type: node.shape, x, y,
    width: NODE_W, height: NODE_H, angle: 0,
    strokeColor: c.stroke, backgroundColor: c.bg,
    fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid",
    roughness: 1, opacity: 100, groupIds: [], frameId: null,
    roundness: node.shape === "rectangle" ? { type: 3 } : null,
    seed: rnd(), version: 1, versionNonce: rnd(), isDeleted: false,
    boundElements: [], updated: now(), link: null, locked: false,
  };
}

function makeTextEl(label: string, x: number, y: number): object {
  const lines = wrapText(label);
  const lineH = 14 * 1.25;
  const th    = lines.length * lineH;
  return {
    id: uid(), type: "text",
    x: x + (NODE_W - 160) / 2,
    y: y + (NODE_H - th) / 2,
    width: 160, height: th, angle: 0,
    strokeColor: "#1e1e2e", backgroundColor: "transparent",
    fillStyle: "solid", strokeWidth: 1, strokeStyle: "solid",
    roughness: 1, opacity: 100, groupIds: [], frameId: null,
    roundness: null, seed: rnd(), version: 1, versionNonce: rnd(),
    isDeleted: false, boundElements: [], updated: now(), link: null, locked: false,
    text: lines.join("\n"), fontSize: 14, fontFamily: 1,
    textAlign: "center", verticalAlign: "middle",
    containerId: null, originalText: label, lineHeight: 1.25,
  };
}

function makeArrowEl(fx: number, fy: number, tx: number, ty: number): object {
  const sx = fx + NODE_W / 2;
  const sy = fy + NODE_H;
  const ex = tx + NODE_W / 2;
  const ey = ty;
  const ox = Math.min(sx, ex);
  const oy = Math.min(sy, ey);
  return {
    id: uid(), type: "arrow",
    x: ox, y: oy,
    width: Math.abs(ex - sx), height: Math.abs(ey - sy), angle: 0,
    strokeColor: "#9ca3af", backgroundColor: "transparent",
    fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid",
    roughness: 1, opacity: 100, groupIds: [], frameId: null,
    roundness: { type: 2 }, seed: rnd(), version: 1, versionNonce: rnd(),
    isDeleted: false, boundElements: [], updated: now(), link: null, locked: false,
    points: [[sx - ox, sy - oy], [ex - ox, ey - oy]],
    startBinding: null, endBinding: null,
    startArrowhead: null, endArrowhead: "arrow",
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export function Whiteboard({ roomId, whiteboardId }: WhiteboardProps) {
  const { user } = useUser();
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();
  const broadcast = useBroadcastEvent();
  const { theme } = useTheme();

  // Refs
  const excalidrawAPIRef = useRef<any>(null);
  const isReceivingUpdate = useRef(false);
  const hasInitialized = useRef(false);
  const currentElementsRef = useRef<any[]>([]);
  const lastSavedContentRef = useRef<string>(""); // Track last saved content to detect real changes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [isReady, setIsReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // AI diagram state
  const [showAIPanel, setShowAIPanel]   = useState(false);
  const [aiPrompt, setAiPrompt]         = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError]           = useState<string | null>(null);

  // Convex queries and mutations
  const whiteboard = useQuery(api.whiteboards.getWhiteboardById, { whiteboardId });
  const saveContentMutation = useMutation(api.whiteboards.saveWhiteboardContent);

  // Parse initial elements from database
  const getInitialElements = useCallback((): any[] => {
    if (whiteboard?.content) {
      try {
        const parsed = JSON.parse(whiteboard.content);
        console.log("[Whiteboard] Parsed initial elements:", parsed.length);
        lastSavedContentRef.current = whiteboard.content; // Track what's saved
        return parsed;
      } catch (e) {
        console.error("[Whiteboard] Failed to parse content:", e);
        return [];
      }
    }
    return [];
  }, [whiteboard?.content]);

  // Listen for drawing events from other users
  useEventListener(({ event }: any) => {
    if (event.type === "DRAW" && excalidrawAPIRef.current && !isReceivingUpdate.current) {
      isReceivingUpdate.current = true;

      try {
        const currentElements = excalidrawAPIRef.current.getSceneElements() || [];
        const newElements = event.elements || [];

        // Merge elements
        const elementMap = new Map(currentElements.map((el: any) => [el.id, el]));
        newElements.forEach((el: any) => {
          elementMap.set(el.id, el);
        });

        excalidrawAPIRef.current.updateScene({
          elements: Array.from(elementMap.values()),
        });
      } catch (e) {
        console.error("[Whiteboard] Error processing broadcast:", e);
      }

      setTimeout(() => {
        isReceivingUpdate.current = false;
      }, 100);
    }
  });

  // Handle Excalidraw API ready
  const handleExcalidrawAPI = useCallback((api: any) => {
    console.log("[Whiteboard] Excalidraw API ready");
    excalidrawAPIRef.current = api;

    // Load initial content once API is ready and whiteboard data is available
    if (!hasInitialized.current && whiteboard !== undefined) {
      hasInitialized.current = true;
      const elements = getInitialElements();
      if (elements.length > 0) {
        console.log("[Whiteboard] Loading", elements.length, "elements into canvas");
        api.updateScene({ elements });
        currentElementsRef.current = elements;
      }
      setIsReady(true);
    }
  }, [whiteboard, getInitialElements]);

  // When whiteboard data loads after API is ready, update the canvas
  useEffect(() => {
    if (excalidrawAPIRef.current && whiteboard !== undefined && !hasInitialized.current) {
      hasInitialized.current = true;
      const elements = getInitialElements();
      if (elements.length > 0) {
        console.log("[Whiteboard] Updating canvas with", elements.length, "elements");
        excalidrawAPIRef.current.updateScene({ elements });
        currentElementsRef.current = elements;
      }
      setIsReady(true);
    }
  }, [whiteboard, getInitialElements]);

  // Auto-save function
  const performSave = useCallback(async () => {
    if (!user) {
      console.error("[Whiteboard] No user found");
      setSaveStatus("error");
      return;
    }

    const elements = currentElementsRef.current;
    if (elements.length === 0) {
      console.log("[Whiteboard] No elements to save");
      setSaveStatus("idle");
      return;
    }

    console.log("[Whiteboard] Auto-saving", elements.length, "elements...");
    setSaveStatus("saving");

    try {
      const content = JSON.stringify(elements);

      await saveContentMutation({
        whiteboardId,
        content,
        userId: user.id,
      });

      console.log("[Whiteboard] Auto-save successful!");
      lastSavedContentRef.current = content; // Update last saved content
      setSaveStatus("saved");

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus((current) => current === "saved" ? "idle" : current);
      }, 2000);
    } catch (error) {
      console.error("[Whiteboard] Auto-save failed:", error);
      setSaveStatus("error");

      // Reset error after 3 seconds
      setTimeout(() => {
        setSaveStatus((current) => current === "error" ? "idle" : current);
      }, 3000);
    }
  }, [whiteboardId, user, saveContentMutation]);

  // Handle drawing changes
  const handleChange = useCallback((elements: readonly any[], appState: any) => {
    // Skip if we're receiving updates from others or not initialized
    if (isReceivingUpdate.current || !isReady) return;

    // Store current elements
    const elementsArray = [...elements];
    currentElementsRef.current = elementsArray;

    // Broadcast to other users
    broadcast({
      type: "DRAW",
      elements: elementsArray,
    } as any);

    // Only auto-save if there's an actual change
    if (elementsArray.length > 0 && user) {
      const newContent = JSON.stringify(elementsArray);

      // Check if content actually changed
      if (newContent !== lastSavedContentRef.current) {
        // Clear existing timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout for auto-save
        saveTimeoutRef.current = setTimeout(() => {
          performSave();
        }, 1500);
      }
    }
  }, [broadcast, isReady, user, performSave]);

  // AI: generate diagram and stagger-inject elements onto canvas
  const handleGenerateDiagram = useCallback(async () => {
    if (!aiPrompt.trim() || isGenerating || !excalidrawAPIRef.current) return;
    setIsGenerating(true);
    setAiError(null);

    try {
      const res = await fetch("/api/generate-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const diagram: DiagramData = await res.json();
      if (!Array.isArray(diagram.nodes) || !Array.isArray(diagram.edges)) {
        throw new Error("Invalid diagram returned by AI");
      }

      const positions = computeLayout(diagram.nodes, diagram.edges);
      const existing  = excalidrawAPIRef.current.getSceneElements() as any[];
      const maxY      = existing.length
        ? Math.max(...existing.map((el: any) => el.y + (el.height ?? 0)))
        : 0;
      const offsetY   = maxY > 0 ? maxY + 120 : 80;
      const offsetX   = 100;

      const nodePairs: [object, object][] = [];
      for (const node of diagram.nodes) {
        const p = positions.get(node.id);
        if (!p) continue;
        nodePairs.push([
          makeShapeEl(node, p.x + offsetX, p.y + offsetY),
          makeTextEl(node.label, p.x + offsetX, p.y + offsetY),
        ]);
      }

      const arrows: object[] = [];
      for (const edge of diagram.edges) {
        const fp = positions.get(edge.from);
        const tp = positions.get(edge.to);
        if (!fp || !tp) continue;
        arrows.push(makeArrowEl(fp.x + offsetX, fp.y + offsetY, tp.x + offsetX, tp.y + offsetY));
      }

      const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
      let live = [...existing];

      for (const pair of nodePairs) {
        await delay(150);
        live = [...live, ...pair];
        excalidrawAPIRef.current.updateScene({ elements: live });
        currentElementsRef.current = live;
      }

      await delay(350);
      for (const arrow of arrows) {
        await delay(180);
        live = [...live, arrow];
        excalidrawAPIRef.current.updateScene({ elements: live });
        currentElementsRef.current = live;
      }

      await delay(200);
      const allEls = excalidrawAPIRef.current.getSceneElements();
      if (allEls.length) {
        excalidrawAPIRef.current.scrollToContent(allEls, { fitToContent: true, animate: true });
      }

      setTimeout(() => performSave(), 600);
      setShowAIPanel(false);
      setAiPrompt("");
    } catch (err: any) {
      setAiError(err.message ?? "Something went wrong. Try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [aiPrompt, isGenerating, performSave]);

  // Handle cursor updates
  const handlePointerUpdate = useCallback((payload: any) => {
    updateMyPresence({
      cursor: {
        x: payload.pointer.x,
        y: payload.pointer.y,
      },
    });
  }, [updateMyPresence]);

  // Show other users' cursors
  useEffect(() => {
    if (!excalidrawAPIRef.current) return;

    const collaborators = new Map(
      others.map((other) => {
        const hue = Math.abs(other.id.toString().split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
        const color = `hsl(${hue}, 70%, 50%)`;

        return [
          other.id,
          {
            username: other.info?.name || "User",
            color: { background: color, stroke: color },
            pointer: other.presence?.cursor || undefined,
          },
        ];
      })
    );

    excalidrawAPIRef.current.updateScene({ collaborators });
  }, [others]);

  // Loading state - wait for whiteboard data
  if (whiteboard === undefined) {
    return <InlineLoader />;
  }

  return (
    <div className="absolute inset-0">
      {/* ── AI Diagram Panel ── directly above the Excalidraw help (?) button */}
      <div className="absolute bottom-[65px] right-[15px] z-[101] flex flex-col items-end gap-2">
        <AnimatePresence>
          {showAIPanel && (
            <motion.div
              key="ai-panel"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">Generate Diagram</span>
                </div>
                <button
                  onClick={() => { setShowAIPanel(false); setAiError(null); }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerateDiagram();
                  }
                }}
                placeholder="e.g. user login flow, CI/CD pipeline, REST API lifecycle..."
                rows={3}
                disabled={isGenerating}
                className="w-full text-sm border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white rounded-xl p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-gray-400 disabled:opacity-60"
              />

              {aiError && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setShowAIPanel(false); setAiError(null); }}
                  className="flex-1 text-sm py-2 rounded-xl border border-gray-200 dark:border-zinc-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateDiagram}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="flex-1 text-sm py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Drawing...</>
                  ) : (
                    <><Send className="w-3.5 h-3.5" /> Generate</>
                  )}
                </button>
              </div>

              {!isGenerating && (
                <p className="mt-2 text-[11px] text-gray-400 text-center">
                  Shapes appear live on canvas · Enter to generate
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setShowAIPanel(v => !v); setAiError(null); }}
          title="Generate diagram with AI"
          className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors duration-200 ${
            showAIPanel
              ? "bg-purple-600 text-white"
              : "bg-white dark:bg-zinc-800 text-purple-600 border border-purple-200 dark:border-zinc-600 hover:border-purple-400"
          }`}
        >
          <Sparkles className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Cloud Save Status - Bottom left corner */}
      <div className="absolute bottom-4 left-4 z-50">
        <div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center
            shadow-md transition-all duration-300
            ${saveStatus === "error"
              ? "bg-red-500 text-white"
              : saveStatus === "saving"
                ? "bg-blue-500 text-white"
                : saveStatus === "saved"
                  ? "bg-green-500 text-white"
                  : "bg-white text-gray-400"
            }
          `}
          title={
            saveStatus === "saving" ? "Saving..."
              : saveStatus === "saved" ? "Saved"
                : saveStatus === "error" ? "Save failed"
                  : "Auto-save enabled"
          }
        >
          {saveStatus === "saving" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveStatus === "saved" ? (
            <Check className="w-4 h-4" />
          ) : saveStatus === "error" ? (
            <CloudOff className="w-4 h-4" />
          ) : (
            <Cloud className="w-4 h-4" />
          )}
        </div>
      </div>

      <ExcalidrawWrapper
        excalidrawAPI={handleExcalidrawAPI}
        onChange={handleChange}
        onPointerUpdate={handlePointerUpdate}
        theme={theme === "dark" ? "dark" : "light"}
        initialData={{
          elements: getInitialElements(),
        }}
        UIOptions={{
          canvasActions: {
            loadScene: false,
          },
          tools: {
            image: false,
          },
        }}
      />
    </div>
  );
}
