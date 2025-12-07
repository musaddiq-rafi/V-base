"use client";

import { useState, useEffect } from "react";
import {
  useOrganization,
  useUser,
  OrganizationProfile,
  UserButton,
} from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Users,
  Crown,
  Mail,
  Loader2,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { WorkspaceRoom } from "@/components/liveblocks/workspace-room";
import { ActiveUsersAvatars } from "@/components/liveblocks/active-users";
import { ChatSystem } from "@/components/chat/chat-system";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface OrganizationMember {
  id: string;
  role: string;
  publicUserData?: {
    firstName?: string | null;
    lastName?: string | null;
    identifier?: string | null;
    userId?: string | null;
  };
}

interface OrganizationInvitation {
  id: string;
  emailAddress: string;
}

export default function WorkspacePage() {
  const router = useRouter();
  const { user } = useUser();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Workspace not found
          </h1>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceRoom
      workspaceId={organization.id}
      workspaceName={organization.name}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50"
        >
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {organization.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-gray-900">
                  {organization.name}
                </span>
                {isAdmin && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    <Crown className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Active Users - Liveblocks Presence */}
              <ActiveUsersAvatars />

              <div className="h-6 w-px bg-gray-200" />

              {/* Settings Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                title="Workspace Settings"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
              {/* User Button */}
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                  },
                }}
              />
            </div>
          </div>
        </motion.header>

        <main className="max-w-4xl mx-auto p-8">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Workspace Settings
              </h1>
            </div>
            <p className="text-gray-600">
              Manage your workspace members and settings
            </p>
          </motion.div>

          {/* Members Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Members
                  </h2>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                    {organization.membersCount || 1}
                  </span>
                </div>
                {isAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      router.push(`/workspace/${organization.id}/invite`)
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite Members
                  </motion.button>
                )}
              </div>
            </div>

            {/* Members List */}
            <div className="divide-y divide-gray-100">
              {memberships?.data && memberships.data.length > 0 ? (
                memberships.data.map((member: OrganizationMember) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-medium">
                      {member.publicUserData?.firstName?.charAt(0) ||
                        member.publicUserData?.identifier?.charAt(0) ||
                        "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {member.publicUserData?.firstName}{" "}
                        {member.publicUserData?.lastName}
                        {member.publicUserData?.userId === user?.id && (
                          <span className="text-gray-500 text-sm ml-1">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {member.publicUserData?.identifier}
                      </p>
                    </div>
                    <span
                      className={`flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${
                        member.role === "org:admin"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {member.role === "org:admin" && (
                        <Crown className="w-3 h-3" />
                      )}
                      {member.role === "org:admin" ? "Admin" : "Member"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading members...
                </div>
              )}
            </div>
          </motion.section>

          {/* Pending Invitations Section (Admin Only) */}
          {isAdmin && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Mail className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Pending Invitations
                  </h2>
                </div>
              </div>
              <div className="p-6">
                {invitations?.data && invitations.data.length > 0 ? (
                  <div className="space-y-3">
                    {invitations.data.map(
                      (invitation: OrganizationInvitation) => (
                        <div
                          key={invitation.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <Mail className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-gray-700">
                              {invitation.emailAddress}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">Pending</span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No pending invitations
                  </p>
                )}
              </div>
            </motion.section>
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
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsSettingsOpen(false)}
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] mx-4 overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Workspace Settings
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs - For now just Manage Members */}
                <div className="border-b border-gray-100">
                  <div className="flex px-4">
                    <button className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
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
                        card: "shadow-none border-none",
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
    </WorkspaceRoom>
  );
}
