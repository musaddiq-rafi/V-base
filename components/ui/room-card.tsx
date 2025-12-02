"use client";

import { motion } from "framer-motion";
import { Room } from "@/lib/dummy-data";
import { Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  room: Room;
  index: number;
}

export function RoomCard({ room, index }: RoomCardProps) {
  const Icon = room.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative cursor-pointer"
    >
      <div className="relative h-full bg-card border rounded-xl p-6 hover:shadow-lg transition-all duration-300">
        {/* Live Badge */}
        {room.isLive && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-xs font-semibold text-red-500">LIVE</span>
          </div>
        )}

        {/* Icon */}
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", room.color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            {room.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {room.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{room.activeUsers} active</span>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </motion.div>
  );
}
