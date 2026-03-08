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
  Trash2,
} from "lucide-react";
import { PageLoader } from "@/components/shared/page-loader";
import Link from "next/link";

interface MeetingSelectorProps {
  roomId: Id<"rooms">;
  roomName: string;
  workspaceId: string;
  onSelectMeeting: (
    meetingId: Id<"meetings">,
    meetingName: string,
    livekitRoomName: string,
    createdBy: string,
  ) => void;
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
  const [endingMeetingId, setEndingMeetingId] = useState<Id<"meetings"> | null>(
    null,
  );

  const activeMeetings = useQuery(api.meetings.getActiveMeetings, { roomId });
  const meetingStats = useQuery(api.meetings.getMeetingStats, { roomId });
  const createMeeting = useMutation(api.meetings.createMeeting);
  const forceEndMeeting = useMutation(api.meetings.forceEndMeeting);

  const handleCreateMeeting = async () => {
    if (!newMeetingName.trim() || !user) return;

    setIsCreating(true);
    try {
      // FIX: Destructure the result directly from the mutation
      // This avoids the race condition of searching activeMeetings
      const { meetingId, livekitRoomName } = await createMeeting({
        roomId,
        name: newMeetingName.trim(),
      });

      const meetingName = newMeetingName.trim();
      setNewMeetingName("");
      setIsCreateModalOpen(false);

      // Use the authoritative room name returned from the server
      // Current user is the creator when they create a meeting
      onSelectMeeting(meetingId, meetingName, livekitRoomName, user.id);
    } catch (error: any) {
      console.error("Failed to create meeting:", error);
      alert(error.message || "Failed to create meeting");
    } finally {
      setIsCreating(false);
    }
  };

  const handleForceEndMeeting = async (
    meetingId: Id<"meetings">,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent triggering the join click

    if (
      !confirm(
        "Are you sure you want to end this meeting? This cannot be undone.",
      )
    ) {
      return;
    }

    setEndingMeetingId(meetingId);
    try {
      await forceEndMeeting({ meetingId });
    } catch (error: any) {
      console.error("Failed to end meeting:", error);
      alert(error.message || "Failed to end meeting");
    } finally {
      setEndingMeetingId(null);
    }
  };

  const formatDuration = (createdAt: number) => {
    const minutes = Math.floor((Date.now() - createdAt) / 60000);
    if (minutes < 1) return "Just started";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  // Check if meeting seems abandoned (0 participants but still active)
  const isAbandonedMeeting = (meeting: {
    participantCount: number;
    createdAt: number;
  }) => {
    return (
      meeting.participantCount === 0 ||
      Date.now() - meeting.createdAt > 60 * 60 * 1000
    ); // older than 1 hour
  };

  if (activeMeetings === undefined || meetingStats === undefined) {
    return <PageLoader />;
  }

  const canCreateMore = meetingStats.canCreateMore;

  return (
    <div className="min-h-screen bg-[#313338] flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between h-12 px-4 border-b border-[#1e1f22] bg-[#2b2d31]"
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/workspace/${workspaceId}`}
            className="flex items-center gap-1.5 text-[#b5bac1] hover:text-[#f2f3f5] transition-colors text-[13px] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
          <div className="h-4 w-px bg-[#3f4147]" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#5865f2]/20 flex items-center justify-center">
              <Video className="w-3.5 h-3.5 text-[#5865f2]" />
            </div>
            <span className="font-semibold text-[#f2f3f5] text-[15px]">
              {roomName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#b5bac1]">
          <span>
            {meetingStats.activeCount}/{meetingStats.maxLimit} active
          </span>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-bold text-[#f2f3f5] mb-2">
              Voice & Video
            </h1>
            <p className="text-[#b5bac1] text-sm">
              Join an active meeting or start a new one
            </p>
          </motion.div>

          {/* Active Meetings */}
          <div className="space-y-2 mb-6">
            {activeMeetings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#2b2d31] border border-[#1e1f22] rounded-xl p-8 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-[#1e1f22] flex items-center justify-center mx-auto mb-4">
                  <Video className="w-7 h-7 text-[#4e5058]" />
                </div>
                <h3 className="text-base font-semibold text-[#f2f3f5] mb-1">
                  No active calls
                </h3>
                <p className="text-[#b5bac1] text-sm">
                  Start a new meeting to get things going
                </p>
              </motion.div>
            ) : (
              activeMeetings.map((meeting, index) => (
                <motion.div
                  key={meeting._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#2b2d31] hover:bg-[#35373c] border border-[#1e1f22] rounded-lg p-3.5 cursor-pointer transition-all group"
                  onClick={() =>
                    onSelectMeeting(
                      meeting._id,
                      meeting.name,
                      meeting.livekitRoomName,
                      meeting.createdBy,
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#23a559]/15 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#23a559] animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#f2f3f5] text-[15px] group-hover:text-[#5865f2] transition-colors">
                          {meeting.name}
                        </h3>
                        <div className="flex items-center gap-2.5 text-xs text-[#b5bac1] mt-0.5">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {meeting.participantCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(meeting.createdAt)}
                          </span>
                          <span>by {meeting.createdByName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(isAbandonedMeeting(meeting) ||
                        meeting.createdBy === user?.id) && (
                        <button
                          onClick={(e) => handleForceEndMeeting(meeting._id, e)}
                          disabled={endingMeetingId === meeting._id}
                          className="p-2 hover:bg-[#ed4245]/20 text-[#ed4245] rounded-md transition-colors"
                          title="End meeting"
                        >
                          {endingMeetingId === meeting._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button className="px-3.5 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded-md transition-colors text-[13px]">
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
            transition={{ delay: 0.15 }}
          >
            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!canCreateMore}
              className="w-full py-3 bg-[#5865f2] hover:bg-[#4752c4] disabled:bg-[#4e5058] disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-[15px]"
            >
              <Plus className="w-5 h-5" />
              {canCreateMore ? "Start a Call" : "Max Meetings Reached"}
            </button>
            {!canCreateMore && (
              <p className="text-center text-xs text-[#b5bac1] mt-3">
                Max {meetingStats.maxLimit} concurrent meetings. Wait for one to
                end or join an existing call.
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
              className="absolute inset-0 bg-black/70"
              onClick={() => setIsCreateModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#313338] rounded-xl shadow-2xl p-5 mx-4 border border-[#1e1f22]"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-[#f2f3f5]">
                  Create a Call
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-[#b5bac1] hover:text-[#f2f3f5] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2 tracking-wider">
                    Meeting Name
                  </label>
                  <input
                    type="text"
                    value={newMeetingName}
                    onChange={(e) => setNewMeetingName(e.target.value)}
                    placeholder="e.g., Sprint Planning"
                    className="w-full px-3 py-2.5 bg-[#1e1f22] border border-[#1e1f22] rounded-md text-[#f2f3f5] placeholder-[#4e5058] focus:outline-none focus:ring-2 focus:ring-[#5865f2] text-[15px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !isCreating &&
                        newMeetingName.trim()
                      ) {
                        handleCreateMeeting();
                      }
                    }}
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-[#5865f2]/10 rounded-lg">
                  <Info className="w-4 h-4 text-[#5865f2] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#b5bac1]">
                    Up to {meetingStats.maxLimit} concurrent calls. Currently{" "}
                    {meetingStats.activeCount} active.
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-transparent hover:bg-[#3f4147] text-[#f2f3f5] font-medium rounded-md transition-colors text-[15px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateMeeting}
                    disabled={!newMeetingName.trim() || isCreating}
                    className="flex-1 px-4 py-2.5 bg-[#5865f2] hover:bg-[#4752c4] disabled:bg-[#4e5058] disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2 text-[15px]"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create"
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
