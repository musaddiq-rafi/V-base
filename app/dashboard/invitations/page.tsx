"use client";

import { useState } from "react";
import { useUser, useOrganizationList } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Mail, Check, X, Loader2, Building2, Clock } from "lucide-react";

export default function InvitationsPage() {
  const { user } = useUser();
  const { userInvitations, isLoaded } = useOrganizationList({
    userInvitations: {
      infinite: true,
    },
  });

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (invitationId: string) => {
    setProcessingId(invitationId);
    try {
      const invitation = userInvitations?.data?.find(
        (inv) => inv.id === invitationId
      );
      if (invitation) {
        await invitation.accept();
        // Revalidate to remove the accepted invitation from the list
        if (userInvitations?.revalidate) {
          await userInvitations.revalidate();
        }
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    setProcessingId(invitationId);
    try {
      // Note: Clerk's UserOrganizationInvitation doesn't have a direct decline method
      // You would need to use the Backend API to revoke invitations
      // For now, users can simply not accept
      console.log("Decline invitation:", invitationId);
    } catch (error) {
      console.error("Error declining invitation:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingInvitations = userInvitations?.data || [];
  const invitationCount = pendingInvitations.length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Invitations</h1>
        <p className="text-gray-600">
          Manage your workspace invitations from team members
        </p>
      </motion.div>

      {/* Content */}
      {!isLoaded ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : invitationCount === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col items-center justify-center py-20 bg-white/70 rounded-2xl border border-gray-200/50"
        >
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
            <Mail className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No pending invitations
          </h3>
          <p className="text-gray-500 text-center max-w-md">
            When someone invites you to join their workspace, it will appear
            here
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-4"
        >
          {pendingInvitations.map((invitation, index) => (
            <motion.div
              key={invitation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.4 }}
              className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm"
            >
              <div className="flex items-start gap-4">
                {/* Organization Avatar */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {invitation.publicOrganizationData?.name
                    ?.charAt(0)
                    .toUpperCase() || "W"}
                </div>

                {/* Invitation Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {invitation.publicOrganizationData?.name ||
                      "Unknown Workspace"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      Invited as{" "}
                      <span className="font-medium text-gray-700">
                        {invitation.role === "org:admin" ? "Admin" : "Member"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAccept(invitation.id)}
                    disabled={processingId === invitation.id}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === invitation.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Accept
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDecline(invitation.id)}
                    disabled={processingId === invitation.id}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    Decline
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
