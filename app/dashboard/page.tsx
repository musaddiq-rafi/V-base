"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrganizationList } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Plus, FolderOpen, Users, Crown, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 lg:mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
            My Workspaces
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Create, manage, and collaborate in your team workspaces
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          size="lg"
          className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all w-full sm:w-auto gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Workspace
        </Button>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex gap-2 mb-6 lg:mb-8 overflow-x-auto pb-2"
      >
        {[
          { key: "all", label: "All" },
          { key: "owned", label: "Owned" },
          { key: "joined", label: "Joined" },
        ].map((tab) => (
          <Button
            key={tab.key}
            onClick={() => setFilter(tab.key as FilterType)}
            variant={filter === tab.key ? "default" : "outline"}
            size="sm"
            className={`${filter === tab.key
                ? "bg-sky-500/20 text-sky-400 border-sky-500/30 hover:bg-sky-500/30 hover:text-sky-300"
                : "bg-transparent border-white/10 text-white/60 hover:bg-white/5 hover:text-white hover:border-white/20"
              }`}
          >
            {tab.label}
          </Button>
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
              transition={{ delay: 0.05 * index, duration: 0.4 }}
            >
              <Link href={`/workspace/${membership.organization.id}`}>
                <div className="group glass-card p-6 rounded-2xl hover:border-white/20 hover:bg-white/8 transition-all cursor-pointer overflow-hidden">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
                        {membership.organization.name.charAt(0).toUpperCase()}
                      </div>
                      {membership.role === "org:admin" && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30">
                          <Crown className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-sky-400 transition-colors">
                      {membership.organization.name}
                    </h3>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Users className="w-4 h-4" />
                      <span>
                        {membership.organization.membersCount || 1} member
                        {(membership.organization.membersCount || 1) !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative glass-card rounded-2xl p-8 shadow-2xl w-full max-w-md border-white/20"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Create Workspace
                </h2>
                <p className="text-muted-foreground text-sm">
                  Give your workspace a name to get started
                </p>
              </div>

              {/* Workspace Count Info */}
              {workspaceStats && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${workspaceStats.maxLimit - workspaceStats.count === 0
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-sky-500/10 border-sky-500/30 text-sky-400"
                  }`}>
                  <Info className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">
                    {workspaceStats.maxLimit - workspaceStats.count}/5 workspaces remaining
                  </span>
                </div>
              )}

              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Enter workspace name"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white placeholder-white/40 transition-all"
                autoFocus
              />

              <div className="flex gap-3">
                <Button
                  onClick={() => setIsCreateModalOpen(false)}
                  variant="outline"
                  className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWorkspace}
                  disabled={
                    !workspaceName.trim() ||
                    isCreating ||
                    (workspaceStats && workspaceStats.count >= workspaceStats.maxLimit)
                  }
                  className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/25 gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : workspaceStats && workspaceStats.count >= workspaceStats.maxLimit ? (
                    "Limit Reached"
                  ) : (
                    "Create Workspace"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
