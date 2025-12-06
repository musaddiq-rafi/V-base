"use client";

import { UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Plus, FolderOpen, Mail, Sparkles, Users, Bell } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                VBase
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
              </button>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 ring-2 ring-gray-200",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              Welcome back!
            </h2>
            <p className="text-gray-600 text-lg">
              Manage your workspaces and collaborate with your team
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              {
                label: "Active Workspaces",
                value: "0",
                icon: FolderOpen,
                color: "blue",
              },
              {
                label: "Team Members",
                value: "1",
                icon: Users,
                color: "green",
              },
              {
                label: "Pending Invites",
                value: "0",
                icon: Mail,
                color: "purple",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                className="p-5 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Create Workspace Card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="group p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  New
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Create Workspace
              </h3>
              <p className="text-blue-100 text-sm mb-4">
                Start a new collaborative workspace for your team
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Coming Soon
              </motion.button>
            </motion.div>

            {/* My Workspaces Card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="group p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <FolderOpen className="w-6 h-6 text-green-600" />
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  0 workspaces
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                My Workspaces
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Access and manage your existing workspaces
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all"
              >
                Coming Soon
              </motion.button>
            </motion.div>

            {/* Invitations Card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="group p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  0 pending
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Invitations
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                View and respond to workspace invitations
              </p>
              <div className="py-3 px-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">No pending invitations</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Recent Activity Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Recent Activity
            </h3>
            <div className="py-8 text-center">
              <p className="text-gray-500">
                No recent activity yet. Create your first workspace to get
                started!
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
