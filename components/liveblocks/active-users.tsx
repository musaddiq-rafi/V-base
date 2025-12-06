"use client";

import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { motion } from "framer-motion";

const AVATAR_SIZE = 36;
const AVATAR_OVERLAP = 12;
const MAX_AVATARS = 5;

interface AvatarProps {
  src?: string;
  name: string;
  className?: string;
}

function Avatar({ src, name, className = "" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`relative flex items-center justify-center rounded-full border-2 border-white shadow-sm ${className}`}
      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium">
          {initials}
        </div>
      )}
    </div>
  );
}

export function ActiveUsersAvatars() {
  const others = useOthers();
  const self = useSelf();

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
              className={user.isSelf ? "ring-2 ring-green-400" : ""}
            />
          </motion.div>
        ))}
      </div>

      {remainingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center rounded-full bg-gray-100 border-2 border-white shadow-sm text-xs font-medium text-gray-600"
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            marginLeft: -AVATAR_OVERLAP,
          }}
        >
          +{remainingCount}
        </motion.div>
      )}

      <div className="ml-3 text-sm text-gray-600">
        <span className="font-medium">{allUsers.length}</span>
        <span className="ml-1">
          {allUsers.length === 1 ? "online" : "online"}
        </span>
      </div>
    </div>
  );
}
