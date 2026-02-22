"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useRef } from "react";
import { useBroadcastEvent, useEventListener, useOthers, useUpdateMyPresence } from "@liveblocks/react/suspense";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { Cloud, CloudOff, Loader2, Check, Sparkles, Send, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import "@excalidraw/excalidraw/index.css";

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
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
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
