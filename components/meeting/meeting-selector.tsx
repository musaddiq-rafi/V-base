"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Plus,
  Users,
  Clock,
  ArrowLeft,
  Loader2,
  X,
  Info,
} from "lucide-react";
import Link from "next/link";

interface MeetingSelectorProps {
  roomId: Id<"rooms">;
  roomName: string;
  workspaceId: string;
  onSelectMeeting: (meetingId: Id<"meetings">, meetingName: string) => void;
}

export function MeetingSelector({
  roomId,
  roomName,
  workspaceId,
  onSelectMeeting,
}: MeetingSelectorProps) {
  const { user } = useUser();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newMeetingName, setNewMeetingName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const activeMeetings = useQuery(api.meetings.getActiveMeetings, { roomId });
  const meetingStats = useQuery(api.meetings.getMeetingStats, { roomId });
  const createMeeting = useMutation(api.meetings.createMeeting);

  const handleCreateMeeting = async () => {
    if (!newMeetingName.trim()) return;

    setIsCreating(true);
    try {
      const meetingId = await createMeeting({
        roomId,
        name: newMeetingName.trim(),
      });
      setNewMeetingName("");
      setIsCreateModalOpen(false);
      onSelectMeeting(meetingId, newMeetingName.trim());
    } catch (error: any) {
      console.error("Failed to create meeting:", error);
      alert(error.message || "Failed to create meeting");
    } finally {
      setIsCreating(false);
    }
  };

  const formatDuration = (createdAt: number) => {
    const minutes = Math.floor((Date.now() - createdAt) / 60000);
    if (minutes < 1) return "Just started";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  if (activeMeetings === undefined || meetingStats === undefined) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  const canCreateMore = meetingStats.canCreateMore;

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between h-16 px-6 border-b border-gray-800"
      >
        <div className="flex items-center gap-4">
          <Link
            href={`/workspace/${workspaceId}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <div className="h-6 w-px bg-gray-700" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Video className="w-4 h-4 text-orange-500" />
            </div>
            <span className="font-semibold text-white">{roomName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>
            {meetingStats.activeCount}/{meetingStats.maxLimit} meetings active
          </span>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              Join or Create a Meeting
            </h1>
            <p className="text-gray-400">
              Select an ongoing meeting to join or start a new one
            </p>
          </motion.div>

          {/* Active Meetings */}
          <div className="space-y-4 mb-8">
            {activeMeetings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800/50 rounded-2xl p-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  No active meetings
                </h3>
                <p className="text-gray-400 text-sm">
                  Be the first to start a meeting in this room
                </p>
              </motion.div>
            ) : (
              activeMeetings.map((meeting, index) => (
                <motion.div
                  key={meeting._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800/50 hover:bg-gray-800/70 rounded-xl p-4 cursor-pointer transition-colors group"
                  onClick={() => onSelectMeeting(meeting._id, meeting.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {meeting.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {meeting.participantCount} participant
                            {meeting.participantCount !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDuration(meeting.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        Started by {meeting.createdByName}
                      </span>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm">
                        Join
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Create Meeting Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!canCreateMore}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {canCreateMore
                ? "Create New Meeting"
                : "Maximum Meetings Reached"}
            </button>
            {!canCreateMore && (
              <p className="text-center text-sm text-gray-500 mt-3">
                This room can host up to {meetingStats.maxLimit} simultaneous
                meetings. Please wait for one to end or join an existing
                meeting.
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Create Meeting Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsCreateModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#1e1e1e] rounded-2xl shadow-2xl p-6 mx-4 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Video className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    Create New Meeting
                  </h2>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Meeting Name
                  </label>
                  <input
                    type="text"
                    value={newMeetingName}
                    onChange={(e) => setNewMeetingName(e.target.value)}
                    placeholder="e.g., Code Base Updates"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-300">
                    You can have up to {meetingStats.maxLimit} meetings running
                    simultaneously in this room. Currently{" "}
                    {meetingStats.activeCount} active.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateMeeting}
                    disabled={!newMeetingName.trim() || isCreating}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Proceed"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
