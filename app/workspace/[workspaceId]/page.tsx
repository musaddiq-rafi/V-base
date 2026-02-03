"use client";

import { useState, useEffect } from "react";
import {
  useOrganization,
  OrganizationProfile,
  UserButton,
} from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Users,
  Crown,
  Loader2,
  X,
  DoorOpen,
} from "lucide-react";
import { ChatSystem } from "@/components/chat/chat-system";
import { RoomList } from "@/components/rooms/room-list";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function WorkspacePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { organization, membership, isLoaded, memberships, invitations } =
    useOrganization({
      memberships: { pageSize: 50 },
      invitations: { pageSize: 20 },
    });

  const isAdmin = membership?.role === "org:admin";

  // Get workspace ID from Convex
  const workspace = useQuery(
    api.workspaces.getWorkspaceByClerkOrgId,
    organization ? { clerkOrgId: organization.id } : "skip"
  );

  // Get room stats
  const roomStats = useQuery(
    api.rooms.getRoomStats,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  const createWorkspace = useMutation(api.workspaces.createWorkspace);

  // Create workspace in Convex if it doesn't exist
  useEffect(() => {
    if (organization && workspace === null) {
      // Workspace doesn't exist, create it
      createWorkspace({
        name: organization.name,
        clerkOrgId: organization.id,
      }).catch((err: any) => console.error("Error creating workspace:", err));
    }
  }, [organization, workspace, createWorkspace]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
      </div>
    );
  }

  if (!organization) {
    // Kanban room routing (future)
    // Example: If you want to redirect or show a kanban-specific UI, handle here.
    // For now, just continue to show "Workspace not found" if no organization.
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Workspace not found
          </h1>
          <Link
            href="/dashboard"
            className="text-sky-400 hover:text-sky-300 font-medium"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[15%] w-[400px] h-[400px] rounded-full bg-gradient-radial from-purple-500/20 via-blue-500/10 to-transparent blur-[100px]"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-indigo-500/15 via-sky-500/10 to-transparent blur-[120px]"></div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-[#0b0f1a]/80 backdrop-blur-xl border-b border-white/10"
      >
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-sky-500/20">
                {organization.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-white">
                {organization.name}
              </span>
              {isAdmin && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30">
                  <Crown className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Settings Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/10"
              title="Workspace Settings"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
            {/* User Button */}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 ring-2 ring-white/20",
                },
              }}
            />
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto p-8 relative z-10">
        {/* Workspace Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          {/* Rooms Stat */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center">
              <DoorOpen className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">Rooms</p>
              <p className="text-xl font-bold text-white">
                {roomStats ? `${roomStats.count}/${roomStats.maxLimit}` : "--"}
              </p>
            </div>
          </div>

          {/* Members Stat */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">Members</p>
              <p className="text-xl font-bold text-white">
                {memberships?.count !== undefined
                  ? `${memberships.count}/10`
                  : "--"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Room List */}
        {workspace && organization && (
          <RoomList workspaceId={workspace._id} clerkOrgId={organization.id} />
        )}
      </main>

      {/* Settings Modal with Clerk OrganizationProfile */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsSettingsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0f1520] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] mx-4 overflow-hidden border border-white/10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-sky-400" />
                  <h2 className="text-lg font-semibold text-white">
                    Workspace Settings
                  </h2>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs - For now just Manage Members */}
              <div className="border-b border-white/10">
                <div className="flex px-4">
                  <button className="px-4 py-3 text-sm font-medium text-sky-400 border-b-2 border-sky-400">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Manage Members
                    </div>
                  </button>
                </div>
              </div>

              {/* Modal Content - Clerk OrganizationProfile */}
              <div className="overflow-y-auto max-h-[calc(85vh-120px)]">
                <OrganizationProfile
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none border-none bg-transparent",
                      navbar: "hidden",
                      navbarMobileMenuButton: "hidden",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                    },
                  }}
                  routing="hash"
                  afterLeaveOrganizationUrl="/dashboard"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat System */}
      {workspace && <ChatSystem workspaceId={workspace._id} />}
    </div>
  );
}
