"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { AuthLoading, Authenticated, ConvexReactClient } from "convex/react";
import { useTheme } from "next-themes";

interface ConvexClientProviderProps {
  children: React.ReactNode;
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
const convex = new ConvexReactClient(convexUrl);

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse shadow-lg shadow-blue-500/30">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
          VBase
        </h1>
        <div className="flex items-center gap-2 text-gray-500">
          <div
            className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

export const ConvexClientProvider = ({
  children,
}: ConvexClientProviderProps) => {
  const { theme } = useTheme();

  return (
    <ClerkProvider
      appearance={{
        baseTheme: theme === "dark" ? dark : undefined,
        variables: {
          colorPrimary: "#0ea5e9",
          colorBackground: theme === "dark" ? "#0b0f1a" : "#ffffff",
          colorText: theme === "dark" ? "#ffffff" : "#0f172a",
          colorInputBackground: theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9",
          colorInputText: theme === "dark" ? "#ffffff" : "#0f172a",
          borderRadius: "0.4rem",
        },
        elements: {
          card: `border border-border shadow-xl ${theme === 'dark' ? 'bg-[#0b0f1a]' : 'bg-white'}`,
          headerTitle: theme === "dark" ? "text-white" : "text-slate-900",
          headerSubtitle: theme === "dark" ? "text-white/60" : "text-slate-500",
          navbar: "hidden",
          navbarButton: theme === "dark" ? "text-white/60 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900",
          scrollBox: theme === "dark" ? "bg-[#0b0f1a]" : "bg-white",
          logoBox: "h-10",
          footerActionLink: "text-sky-400 hover:text-sky-300",
          formFieldLabel: theme === "dark" ? "text-white/80" : "text-slate-700",
          formFieldInput: `border-border focus:border-sky-500 ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`,
          formButtonPrimary: "bg-gradient-to-r from-sky-500 to-indigo-600 border-0 hover:from-sky-400 hover:to-indigo-500",
          userButtonPopoverCard: `border border-border ${theme === 'dark' ? 'bg-[#0b0f1a]' : 'bg-white'}`,
          organizationSwitcherPopoverCard: `border border-border ${theme === 'dark' ? 'bg-[#0b0f1a]' : 'bg-white'}`,
        },
        layout: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
      }}
    >
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        <AuthLoading>
          <LoadingScreen />
        </AuthLoading>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
