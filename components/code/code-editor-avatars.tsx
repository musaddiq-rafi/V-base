"use client";

import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { motion } from "framer-motion";

const AVATAR_SIZE = 28;
const AVATAR_OVERLAP = 8;
const MAX_AVATARS = 5;

interface AvatarProps {
  src?: string;
  name: string;
  className?: string;
  borderColor?: string;
}

function Avatar({ src, name, className = "", borderColor }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`relative flex items-center justify-center rounded-full shadow-sm ${className}`}
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        border: `2px solid ${borderColor || "#3c3c3c"}`,
      }}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-medium">
          {initials}
        </div>
      )}
    </div>
  );
}

// User colors for consistent coloring
const USER_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FFA07A", // Light Salmon
  "#98D8C8", // Mint
  "#F7DC6F", // Yellow
  "#BB8FCE", // Purple
  "#85C1E2", // Sky Blue
  "#F8B739", // Orange
  "#52B788", // Green
];

function getUserColor(index: number): string {
  return USER_COLORS[index % USER_COLORS.length];
}

export function CodeEditorAvatars() {
  const others = useOthers();
  const self = useSelf();

  // Get unique users (others + self)
  const allUsers = [
    ...(self
      ? [
          {
            id: self.id,
            connectionId: self.connectionId,
            name: self.info?.name || "You",
            avatar: self.info?.avatar,
            isSelf: true,
          },
        ]
      : []),
    ...others.map((other) => ({
      id: other.id,
      connectionId: other.connectionId,
      name: other.info?.name || "Anonymous",
      avatar: other.info?.avatar,
      isSelf: false,
    })),
  ];

  const visibleUsers = allUsers.slice(0, MAX_AVATARS);
  const remainingCount = allUsers.length - MAX_AVATARS;

  if (allUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center">
      <div className="flex items-center" style={{ marginRight: 8 }}>
        {visibleUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0.5, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: -10 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            style={{
              marginLeft: index === 0 ? 0 : -AVATAR_OVERLAP,
              zIndex: allUsers.length - index,
            }}
          >
            <Avatar
              src={user.avatar}
              name={user.name}
              borderColor={user.isSelf ? "#10b981" : getUserColor(index)}
            />
          </motion.div>
        ))}
      </div>

      {remainingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center rounded-full bg-[#3c3c3c] border-2 border-[#252526] shadow-sm text-[10px] font-medium text-gray-300"
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            marginLeft: -AVATAR_OVERLAP,
          }}
        >
          +{remainingCount}
        </motion.div>
      )}

      <div className="ml-2 text-xs text-gray-400">
        <span className="font-medium text-gray-300">{allUsers.length}</span>
        <span className="ml-1">editing</span>
      </div>
    </div>
  );
}
