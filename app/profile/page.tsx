"use client";

import { useAuth } from "@/hooks/useAuth";
import ProfileComponent, { ProfileLoadingSkeleton, NotAuthenticatedProfile } from "@/components/profile/ProfileComponent";

export default function UnifiedProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <ProfileLoadingSkeleton />;
  }

  if (!user) {
    return <NotAuthenticatedProfile />;
  }

  return (
    <ProfileComponent 
      user={user} 
      context="unified"
    />
  );
}
