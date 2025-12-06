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

  const { organization, membership, isLoaded, invitations } = useOrganization({
    invitations: { pageSize: 20 },
  });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"org:admin" | "org:member">("org:member");
  const [isInviting, setIsInviting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = membership?.role === "org:admin";

  const handleInvite = async () => {
    if (!email.trim() || !organization) return;

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            Only admins can invite new members
          </p>
          <Link
            href={`/workspace/${workspaceId}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Return to Workspace
          </Link>
        </div>
      </div>
    );
  }

  return (
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
              href={`/workspace/${workspaceId}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Settings</span>
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <span className="font-semibold text-gray-900">
              {organization?.name}
            </span>
          </div>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">VBase</span>
          </Link>
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Invite Members
                </h1>
                <p className="text-gray-600">
                  Add team members to {organization?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("org:member")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    role === "org:member"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-gray-900">Member</p>
                  <p className="text-sm text-gray-500">
                    Can view and collaborate
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("org:admin")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    role === "org:admin"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-gray-900">Admin</p>
                  <p className="text-sm text-gray-500">
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
                className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl"
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
                className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl"
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
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
