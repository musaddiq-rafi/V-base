"use client";

import { useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Mail,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const { organization, membership, memberships, isLoaded, invitations } =
    useOrganization({
      invitations: { pageSize: 20 },
      memberships: { pageSize: 50 },
    });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"org:admin" | "org:member">("org:member");
  const [isInviting, setIsInviting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = membership?.role === "org:admin";

  const maxMembers = 10;
  const currentMemberCount = memberships?.count ?? 0;
  const pendingInvitationsCount = invitations?.count ?? 0;
  const totalCount = currentMemberCount + pendingInvitationsCount;
  const isAtLimit = totalCount >= maxMembers;

  const handleInvite = async () => {
    if (!email.trim() || !organization) return;

    // Check member limit
    if (isAtLimit) {
      setError(
        `This workspace has reached the maximum limit of ${maxMembers} members (including pending invitations).`
      );
      return;
    }

    setIsInviting(true);
    setError(null);
    setSuccess(false);

    try {
      await organization.inviteMember({
        emailAddress: email.trim(),
        role: role,
      });
      setSuccess(true);
      setEmail("");

      // Revalidate the invitations list to show the new pending invitation
      if (invitations?.revalidate) {
        await invitations.revalidate();
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error inviting member:", err);
      setError(err.errors?.[0]?.message || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-sky-500 dark:text-sky-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-4">
            Only admins can invite new members
          </p>
          <Link
            href={`/workspace/${workspaceId}`}
            className="text-sky-500 dark:text-sky-400 hover:text-sky-400 dark:hover:text-sky-300 font-medium"
          >
            Return to Workspace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border"
      >
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/workspace/${workspaceId}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Settings</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <span className="font-semibold text-foreground">
              {organization?.name}
            </span>
          </div>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">VBase</span>
          </Link>
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-surface backdrop-blur-sm rounded-2xl border border-border overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Invite Members
                </h1>
                <p className="text-muted-foreground">
                  Add team members to {organization?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full pl-12 pr-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground placeholder-muted-foreground"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("org:member")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    role === "org:member"
                      ? "border-sky-500 bg-sky-500/10"
                      : "border-border hover:border-border bg-muted"
                  }`}
                >
                  <p className="font-medium text-foreground">Member</p>
                  <p className="text-sm text-muted-foreground">
                    Can view and collaborate
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("org:admin")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    role === "org:admin"
                      ? "border-sky-500 bg-sky-500/10"
                      : "border-border hover:border-border bg-muted"
                  }`}
                >
                  <p className="font-medium text-foreground">Admin</p>
                  <p className="text-sm text-muted-foreground">
                    Full access & can invite
                  </p>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl"
              >
                <Check className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">Invitation sent successfully!</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleInvite}
              disabled={!email.trim() || isInviting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:shadow-lg hover:shadow-sky-500/25 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInviting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Send Invitation
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
