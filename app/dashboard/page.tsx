"use client";

import { useOrganizationList, CreateOrganization, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  Loader2,
  Users,
  ArrowRight,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MAX_OWNED = 5;

export default function DashboardPage() {
  const { user } = useUser();
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const [showCreate, setShowCreate] = useState(false);

  const workspaces = userMemberships?.data ?? [];
  const ownedCount = workspaces.filter((m) => m.role === "org:admin").length;
  const atLimit = ownedCount >= MAX_OWNED;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">
            {workspaces.length === 0
              ? "Create your first workspace to get started"
              : `You are a member of ${workspaces.length} workspace${workspaces.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          disabled={atLimit}
          className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/25"
        >
          <Plus className="w-4 h-4" />
          New Workspace
        </Button>
      </motion.div>

      {atLimit && (
        <p className="text-sm text-amber-500 dark:text-amber-400">
          You have reached the {MAX_OWNED} owned workspaces limit.
        </p>
      )}

      {/* Workspace Grid */}
      {workspaces.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-border bg-muted/30"
        >
          <div className="w-16 h-16 rounded-2xl bg-sky-500/20 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-sky-500 dark:text-sky-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No workspaces yet</h3>
          <p className="text-muted-foreground text-sm mb-6 text-center max-w-xs">
            Create a workspace to start collaborating with your team
          </p>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/25"
          >
            <Plus className="w-4 h-4" />
            Create Workspace
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((membership, index) => {
            const org = membership.organization;
            const isAdmin = membership.role === "org:admin";
            return (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/workspace/${org.id}`}>
                  <Card className="group hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10 transition-all cursor-pointer">
                    <CardContent className="flex items-center gap-4 px-4 py-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-sky-500/20 flex-shrink-0">
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors truncate">
                          {org.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{org.membersCount ?? "—"} member{(org.membersCount ?? 0) !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={isAdmin
                            ? "border-amber-500/30 text-amber-500 dark:text-amber-400 bg-amber-500/10"
                            : "text-muted-foreground"}
                        >
                          {isAdmin ? "Admin" : "Member"}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-sky-500 dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCreate(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <CreateOrganization
                afterCreateOrganizationUrl="/workspace/:id"
                skipInvitationScreen={false}
                appearance={{
                  elements: {
                    rootBox: "shadow-2xl rounded-2xl overflow-hidden",
                    card: "bg-background border border-border shadow-none",
                    headerTitle: "text-foreground",
                    headerSubtitle: "text-muted-foreground",
                    formButtonPrimary:
                      "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500",
                  },
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

