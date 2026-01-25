"use client";

import { useEffect } from "react";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const { setActive, isLoaded: isOrgListLoaded } = useOrganizationList();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();

  // Set the active organization when entering a workspace
  useEffect(() => {
    if (isOrgListLoaded && setActive && workspaceId) {
      // Only set if different from current
      if (organization?.id !== workspaceId) {
        setActive({ organization: workspaceId }).catch((error) => {
          console.error("Error setting active organization:", error);
          // If the org doesn't exist or user doesn't have access, redirect to dashboard
          router.push("/dashboard");
        });
      }
    }
  }, [isOrgListLoaded, setActive, workspaceId, organization?.id, router]);

  // Show loading while setting up organization context
  if (!isOrgListLoaded || !isOrgLoaded) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] right-[15%] w-[400px] h-[400px] rounded-full bg-gradient-radial from-purple-500/20 via-blue-500/10 to-transparent blur-[100px]"></div>
          <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-indigo-500/15 via-sky-500/10 to-transparent blur-[120px]"></div>
        </div>
        <div className="flex flex-col items-center gap-4 relative z-10">
          <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
          <p className="text-white/60 font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Verify the organization is set correctly
  if (organization?.id !== workspaceId) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] right-[15%] w-[400px] h-[400px] rounded-full bg-gradient-radial from-purple-500/20 via-blue-500/10 to-transparent blur-[100px]"></div>
          <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-indigo-500/15 via-sky-500/10 to-transparent blur-[120px]"></div>
        </div>
        <div className="flex flex-col items-center gap-4 relative z-10">
          <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
          <p className="text-white/60 font-medium">Switching workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
