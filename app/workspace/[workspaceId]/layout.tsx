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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Verify the organization is set correctly
  if (organization?.id !== workspaceId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium">Switching workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
