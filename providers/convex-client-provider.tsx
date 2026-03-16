"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { AuthLoading, Authenticated, ConvexReactClient } from "convex/react";
import { useTheme } from "next-themes";
import { PageLoader } from "@/components/shared/page-loader";

interface ConvexClientProviderProps {
  children: React.ReactNode;
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
const convex = new ConvexReactClient(convexUrl);

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
          <PageLoader />
        </AuthLoading>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
