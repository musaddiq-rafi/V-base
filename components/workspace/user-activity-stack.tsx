"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  FileText,
  FileCode,
  Presentation,
  Video,
  LayoutDashboard,
  ExternalLink,
  Monitor,
  Table,
  KanbanSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserActivityStackProps {
  workspaceId: Id<"workspaces">;
}

// Map room types to icons
const roomTypeIcons: Record<string, React.ReactNode> = {
  document: <FileText className="w-3.5 h-3.5" />,
  code: <FileCode className="w-3.5 h-3.5" />,
  whiteboard: <Presentation className="w-3.5 h-3.5" />,
  conference: <Video className="w-3.5 h-3.5" />,
  kanban: <KanbanSquare className="w-3.5 h-3.5" />,
  spreadsheet: <Table className="w-3.5 h-3.5" />,
};

// Map room types to accent colors
const roomTypeColors: Record<string, string> = {
  document: "text-blue-400",
  code: "text-emerald-400",
  whiteboard: "text-purple-400",
  conference: "text-orange-400",
  kanban: "text-pink-400",
  spreadsheet: "text-teal-400",
};

interface PresenceRecord {
  _id: string;
  clerkId: string;
  userName: string;
  userAvatar?: string;
  location: "workspace" | "room" | "file" | "meeting";
  roomId?: Id<"rooms">;
  roomName?: string;
  roomType?: string;
  fileId?: string;
  fileName?: string;
  meetingName?: string;
  path: string;
}

interface LocationGroup {
  key: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  colorClass: string;
  path: string;
  users: PresenceRecord[];
}

function groupPresenceByLocation(presence: PresenceRecord[]): LocationGroup[] {
  const groups = new Map<string, LocationGroup>();

  for (const p of presence) {
    let key: string;
    let label: string;
    let sublabel: string | undefined;
    let icon: React.ReactNode;
    let colorClass: string;

    if (p.location === "workspace") {
      key = "workspace";
      label = "In Workspace";
      icon = <Monitor className="w-3.5 h-3.5" />;
      colorClass = "text-sky-400";
    } else if (p.location === "meeting") {
      key = `meeting:${p.roomId ?? "unknown"}`;
      label = p.meetingName || "Meeting";
      sublabel = p.roomName;
      icon = <Video className="w-3.5 h-3.5" />;
      colorClass = "text-orange-400";
    } else if (p.location === "file" && p.fileId) {
      key = `file:${p.fileId}`;
      label = p.fileName || "Untitled";
      sublabel = p.roomName;
      icon = roomTypeIcons[p.roomType || "document"] || <FileText className="w-3.5 h-3.5" />;
      colorClass = roomTypeColors[p.roomType || "document"] || "text-blue-400";
    } else if (p.location === "room" && p.roomId) {
      key = `room:${p.roomId}`;
      label = p.roomName || "Room";
      icon = roomTypeIcons[p.roomType || "document"] || <LayoutDashboard className="w-3.5 h-3.5" />;
      colorClass = roomTypeColors[p.roomType || "document"] || "text-sky-400";
    } else {
      key = "workspace";
      label = "In Workspace";
      icon = <Monitor className="w-3.5 h-3.5" />;
      colorClass = "text-sky-400";
    }

    if (groups.has(key)) {
      groups.get(key)!.users.push(p);
    } else {
      groups.set(key, {
        key,
        label,
        sublabel,
        icon,
        colorClass,
        path: p.path,
        users: [p],
      });
    }
  }

  // Sort: files/meetings first, then rooms, then workspace
  const order: Record<string, number> = { file: 0, meeting: 1, room: 2, workspace: 3 };
  return Array.from(groups.values()).sort((a, b) => {
    const aType = a.key.split(":")[0];
    const bType = b.key.split(":")[0];
    return (order[aType] ?? 4) - (order[bType] ?? 4);
  });
}

const MAX_VISIBLE_AVATARS = 4;

export function UserActivityStack({ workspaceId }: UserActivityStackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const presence = useQuery(api.userPresence.getWorkspacePresence, {
    workspaceId,
  });

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  if (!presence || presence.length === 0) {
    return null; // No one else online — don't show anything
  }

  const groups = groupPresenceByLocation(presence as PresenceRecord[]);
  const visibleUsers = presence.slice(0, MAX_VISIBLE_AVATARS) as PresenceRecord[];
  const extraCount = Math.max(0, presence.length - MAX_VISIBLE_AVATARS);

  return (
    <div className="relative">
      {/* Trigger: Avatar Stack */}
      <div
        ref={triggerRef}
        className="flex items-center cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
        title={`${presence.length} member${presence.length !== 1 ? "s" : ""} online`}
      >
        <div className="flex items-center -space-x-2">
          {visibleUsers.map((user) => (
            <div
              key={user._id}
              className="relative w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden ring-2 ring-green-500/40 transition-transform group-hover:scale-105"
              title={user.userName}
            >
              {user.userAvatar ? (
                <img
                  src={user.userAvatar}
                  alt={user.userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-xs font-bold">
                  {user.userName.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Green online dot */}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
            </div>
          ))}
          {extraCount > 0 && (
            <div className="relative w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground ring-2 ring-green-500/40">
              +{extraCount}
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-xl shadow-black/10 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-border bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Members · {presence.length}
              </p>
            </div>

            {/* Groups */}
            <div className="max-h-[320px] overflow-y-auto py-1">
              {groups.map((group) => (
                <div
                  key={group.key}
                  className="px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  {/* Group Header Row */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`shrink-0 ${group.colorClass}`}>
                        {group.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {group.label}
                        </p>
                        {group.sublabel && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {group.sublabel}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Go Button — not shown for "In Workspace" */}
                    {group.key !== "workspace" && (
                      <Link
                        href={group.path}
                        onClick={() => setIsOpen(false)}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-sky-500 hover:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 rounded-md transition-colors"
                      >
                        Go
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  {/* User Avatars Row */}
                  <div className="flex items-center gap-1.5 pl-5">
                    {group.users.map((u) => (
                      <div
                        key={u._id}
                        className="flex items-center gap-1.5 bg-muted rounded-full pl-0.5 pr-2 py-0.5"
                        title={u.userName}
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-sky-500 to-indigo-600 shrink-0">
                          {u.userAvatar ? (
                            <img
                              src={u.userAvatar}
                              alt={u.userName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-[9px] font-bold">
                              {u.userName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                          {u.userName.split(" ")[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
