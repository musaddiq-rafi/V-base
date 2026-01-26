import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { LiveblocksProvider } from "@/providers/liveblocks-provider";
import { ThemeProvider } from "@/components/theme-provider";
import StoreUserEffect from "@/components/StoreUserEffect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VBase - Real-time Collaborative Workspace",
  description: "A virtual collaborative workspace with real-time documents, code editing, whiteboards, and video conferencing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <ConvexClientProvider>
            <LiveblocksProvider>
              <StoreUserEffect />
              {children}
            </LiveblocksProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
