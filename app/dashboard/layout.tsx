"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  FolderOpen,
  Mail,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      href: "/dashboard",
      label: "Workspaces",
      icon: FolderOpen,
      exact: true,
    },
    {
      href: "/dashboard/invitations",
      label: "Invitations",
      icon: Mail,
      badge: 0, // TODO: Replace with actual pending invitations count
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects - only visible in dark mode */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none dark:block hidden">
        <div className="absolute top-[10%] right-[15%] w-[400px] h-[400px] rounded-full bg-gradient-radial from-purple-500/20 via-blue-500/10 to-transparent blur-[100px]"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-indigo-500/15 via-sky-500/10 to-transparent blur-[120px]"></div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 bg-background/95 backdrop-blur-xl border-r border-border flex flex-col z-50 transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-48"
        } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div
          className={`border-b border-border ${isCollapsed ? "p-3" : "p-4"}`}
        >
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 shadow-lg shadow-sky-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold">
                <span className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">V</span>
                <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Base</span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 space-y-1 ${isCollapsed ? "p-2" : "p-3"}`}>
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl transition-all ${
                  isCollapsed ? "px-3 py-3 justify-center" : "px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-sky-500/20 text-sky-500 dark:text-sky-400 border border-sky-500/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-sky-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-sky-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle Button */}
        <div
          className={`border-t border-border ${isCollapsed ? "p-2" : "p-3"}`}
        >
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex items-center px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all ${
              isCollapsed ? "w-full justify-center" : "ml-auto"
            }`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${isCollapsed ? "lg:pl-16" : "lg:pl-48"}`}
      >
        {/* Top Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border"
        >
          <div className="flex justify-between items-center h-14 px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <ModeToggle />
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 ring-2 ring-border",
                  },
                }}
              />
            </div>
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 relative z-10">{children}</main>
      </div>
    </div>
  );
}
