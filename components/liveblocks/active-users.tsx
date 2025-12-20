"use client";

import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { motion } from "framer-motion";

interface ActiveUsersAvatarsProps {
  variant?: "light" | "dark";
  label?: "online" | "editing";
}

interface AvatarProps {
  src?: string;
  name: string;
  className?: string;
  size: number;
  isSelf?: boolean;
  variant: "light" | "dark";
}

function Avatar({
  src,
  name,
  className = "",
  size,
  isSelf,
  variant,
}: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Green border for self, default dark border for others in dark mode
  const borderStyle =
    variant === "dark"
      ? { border: `2px solid ${isSelf ? "#10b981" : "#3c3c3c"}` }
      : {};

  const selfRing = variant === "light" && isSelf ? "ring-2 ring-green-400" : "";
  const lightBorder = variant === "light" ? "border-2 border-white" : "";

  return (
    <div
      className={`relative flex items-center justify-center rounded-full shadow-sm ${lightBorder} ${selfRing} ${className}`}
      style={{ width: size, height: size, ...borderStyle }}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div
          className={`w-full h-full rounded-full flex items-center justify-center text-white font-medium ${
            variant === "dark"
              ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px]"
              : "bg-gradient-to-br from-blue-500 to-indigo-600 text-xs"
          }`}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

export function ActiveUsersAvatars({
  variant = "light",
  label = "online",
}: ActiveUsersAvatarsProps) {
  const others = useOthers();
  const self = useSelf();

  const AVATAR_SIZE = variant === "dark" ? 28 : 36;
  const AVATAR_OVERLAP = variant === "dark" ? 8 : 12;
  const MAX_AVATARS = 5;

  // Get unique users (others + self)
  const allUsers = [
    ...(self
      ? [
          {
            id: self.id,
            name: self.info?.name || "You",
            avatar: self.info?.avatar,
            isSelf: true,
          },
        ]
      : []),
    ...others.map((other) => ({
      id: other.id,
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
              size={AVATAR_SIZE}
              variant={variant}
              isSelf={user.isSelf}
            />
          </motion.div>
        ))}
      </div>

      {remainingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center justify-center rounded-full shadow-sm font-medium ${
            variant === "dark"
              ? "bg-[#3c3c3c] border-2 border-[#252526] text-[10px] text-gray-300"
              : "bg-gray-100 border-2 border-white text-xs text-gray-600"
          }`}
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            marginLeft: -AVATAR_OVERLAP,
          }}
        >
          +{remainingCount}
        </motion.div>
      )}

      <div
        className={`${variant === "dark" ? "ml-2 text-xs" : "ml-3 text-sm"}`}
      >
        <span
          className={
            variant === "dark"
              ? "font-medium text-gray-300"
              : "font-medium text-gray-600"
          }
        >
          {allUsers.length}
        </span>
        <span
          className={`ml-1 ${variant === "dark" ? "text-gray-400" : "text-gray-600"}`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
