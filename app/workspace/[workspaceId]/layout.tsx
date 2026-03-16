"use client";

import { useEffect } from "react";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChatSystem } from "@/components/chat/chat-system";
import { PageLoader } from "@/components/shared/page-loader";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const { setActive, isLoaded: isOrgListLoaded } = useOrganizationList();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();

  // Get the Convex workspace for the ChatSystem
  const workspace = useQuery(
    api.workspaces.getWorkspaceByClerkOrgId,
    organization ? { clerkOrgId: organization.id } : "skip"
  );

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

  if (!isOrgListLoaded || !isOrgLoaded) {
    return <PageLoader label="Loading workspace..." />;
  }

  // Verify the organization is set correctly
  if (organization?.id !== workspaceId) {
    return <PageLoader label="Switching workspace..." />;
  }

  return (
    <>
      {children}
      {/* Global Chat System - available on every workspace page */}
      {workspace && <ChatSystem workspaceId={workspace._id} />}
    </>
  );
}
