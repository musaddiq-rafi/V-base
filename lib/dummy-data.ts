import {
  Video,
  MessageSquare,
  Presentation,
  Code2,
  FileText,
  LayoutDashboard,
  Gamepad2,
  Megaphone,
} from "lucide-react";

export interface Room {
  id: string;
  name: string;
  description: string;
  icon: any;
  activeUsers: number;
  isLive?: boolean;
  color: string;
}

export const rooms: Room[] = [
  {
    id: "conference",
    name: "Conference Room",
    description: "High-quality video meetings and team calls",
    icon: Video,
    activeUsers: 8,
    isLive: true,
    color: "bg-blue-500",
  },
  {
    id: "chitchat",
    name: "Chit Chat Room",
    description: "Discord-style voice & text channels",
    icon: MessageSquare,
    activeUsers: 12,
    isLive: true,
    color: "bg-purple-500",
  },
  {
    id: "explainer",
    name: "Explainer Room",
    description: "Collaborative whiteboard for brainstorming",
    icon: Presentation,
    activeUsers: 5,
    color: "bg-pink-500",
  },
  {
    id: "coding",
    name: "Coding Room",
    description: "Real-time collaborative IDE",
    icon: Code2,
    activeUsers: 6,
    isLive: true,
    color: "bg-green-500",
  },
  {
    id: "documents",
    name: "Document Editor",
    description: "Google Docs-like collaborative editing",
    icon: FileText,
    activeUsers: 4,
    color: "bg-orange-500",
  },
  {
    id: "kanban",
    name: "Kanban Board",
    description: "Agile project management",
    icon: LayoutDashboard,
    activeUsers: 9,
    color: "bg-cyan-500",
  },
  {
    id: "breakroom",
    name: "Break Room",
    description: "Casual hangout with games & music",
    icon: Gamepad2,
    activeUsers: 3,
    color: "bg-rose-500",
  },
  {
    id: "announcements",
    name: "Announcement Board",
    description: "Company news and updates",
    icon: Megaphone,
    activeUsers: 15,
    color: "bg-indigo-500",
  },
];

export interface Activity {
  id: string;
  user: string;
  action: string;
  room: string;
  time: string;
}

export const recentActivities: Activity[] = [
  {
    id: "1",
    user: "Sarah Chen",
    action: "started a video call in",
    room: "Conference Room",
    time: "2 min ago",
  },
  {
    id: "2",
    user: "Mike Johnson",
    action: "shared code in",
    room: "Coding Room",
    time: "5 min ago",
  },
  {
    id: "3",
    user: "Alex Rivera",
    action: "updated whiteboard in",
    room: "Explainer Room",
    time: "15 min ago",
  },
  {
    id: "4",
    user: "Emma Davis",
    action: "moved task in",
    room: "Kanban Board",
    time: "20 min ago",
  },
];
