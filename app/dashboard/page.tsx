"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrganizationList } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Plus, FolderOpen, Users, Crown, Loader2, Info } from "lucide-react";
import Link from "next/link";

type FilterType = "all" | "owned" | "joined";

export default function DashboardPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { userMemberships, isLoaded, createOrganization } = useOrganizationList(
    {
      userMemberships: {
        infinite: true,
      },
    }
  );

  const createWorkspace = useMutation(api.workspaces.createWorkspace);
  const workspaceStats = useQuery(api.workspaces.getOwnedWorkspaceCount);

  // Revalidate memberships when page becomes visible (handles navigation from other pages)
  const revalidateMemberships = useCallback(() => {
    if (userMemberships?.revalidate) {
      userMemberships.revalidate();
    }
  }, [userMemberships]);

  useEffect(() => {
    // Revalidate on mount (handles redirects and navigation)
    revalidateMemberships();

    // Also revalidate when the page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        revalidateMemberships();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [revalidateMemberships]);

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim() || !createOrganization) return;

    setIsCreating(true);
    try {
      // 1. Create Clerk Organization first
      const org = await createOrganization({ name: workspaceName.trim() });

      // 2. Immediately sync to Convex (don't wait for webhook)
      await createWorkspace({
        name: workspaceName.trim(),
        clerkOrgId: org.id,
      });

      // 3. Close modal and revalidate the memberships list
      setWorkspaceName("");
      setIsCreateModalOpen(false);

      // 4. Revalidate to refresh the workspace list
      if (userMemberships?.revalidate) {
        await userMemberships.revalidate();
      }
    } catch (error) {
      console.error("Error creating workspace:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter workspaces based on role
  const filteredMemberships = userMemberships?.data?.filter((membership) => {
    if (filter === "owned") {
      return membership.role === "org:admin";
    }
    if (filter === "joined") {
      return membership.role !== "org:admin";
    }
    return true;
  });

  const workspaceCount = userMemberships?.data?.length || 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
            My Workspaces
          </h1>
          <p className="text-sm lg:text-base text-white/60">
            Create, manage, and collaborate in your team workspaces
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 lg:px-5 lg:py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-sky-500/25 transition-all text-sm lg:text-base w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Create Workspace
        </motion.button>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex gap-2 mb-4 lg:mb-6 overflow-x-auto"
      >
        {[
          { key: "all", label: "All" },
          { key: "owned", label: "Owned" },
          { key: "joined", label: "Joined" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as FilterType)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === tab.key
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Workspaces Grid */}
      {!isLoaded ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        </div>
      ) : workspaceCount === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/10"
        >
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
            <FolderOpen className="w-10 h-10 text-white/40" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No workspaces yet
          </h3>
          <p className="text-white/50 mb-6 text-center max-w-md">
            Create your first workspace to start collaborating with your team
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-sky-500/25"
          >
            <Plus className="w-5 h-5" />
            Create your first workspace
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredMemberships?.map((membership, index) => (
            <motion.div
              key={membership.organization.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.4 }}
            >
              <Link href={`/workspace/${membership.organization.id}`}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/8 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-sky-500/20">
                      {membership.organization.name.charAt(0).toUpperCase()}
                    </div>
                    {membership.role === "org:admin" && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30">
                        <Crown className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-sky-400 transition-colors">
                    {membership.organization.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Users className="w-4 h-4" />
                    <span>
                      {membership.organization.membersCount || 1} member
                      {(membership.organization.membersCount || 1) !== 1
                        ? "s"
                        : ""}
                    </span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[#0f1520] rounded-2xl p-8 shadow-2xl w-full max-w-md mx-4 border border-white/10"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              Create Workspace
            </h2>
            <p className="text-white/50 mb-4">
              Give your workspace a name to get started
            </p>
            {/* Workspace Count Info */}
            {workspaceStats && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 ${workspaceStats.maxLimit - workspaceStats.count === 0 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-sky-500/20 text-sky-400 border border-sky-500/30"}`}
              >
                <Info className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {workspaceStats.maxLimit - workspaceStats.count}/5 workspaces
                  remaining
                </span>
              </div>
            )}
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Workspace name"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent mb-6 text-white placeholder-white/40"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkspace}
                disabled={
                  !workspaceName.trim() ||
                  isCreating ||
                  (workspaceStats &&
                    workspaceStats.count >= workspaceStats.maxLimit)
                }
                className="flex-1 px-4 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : workspaceStats &&
                  workspaceStats.count >= workspaceStats.maxLimit ? (
                  "Limit Reached"
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
