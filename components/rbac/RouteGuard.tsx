"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requiredSystemRole?: string | string[];
  requireAll?: boolean;
  redirectTo?: string;
}

export const RouteGuard = ({
  children,
  requiredPermission,
  requiredPermissions = [],
  requiredSystemRole,
  requireAll = false,
  redirectTo = "/admin/organisations",
}: RouteGuardProps) => {
  const router = useRouter();
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasSystemRole, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Check authentication first
    if (!isAuthenticated) {
      toast.error("Please log in to access this page");
      router.push("/");
      return;
    }

    let hasAccess = false;

    // Check system role first if required
    if (requiredSystemRole) {
      hasAccess = hasSystemRole(requiredSystemRole);
      if (!hasAccess) {
        toast.error("You don't have the required role to access this page");
        router.push(redirectTo);
        return;
      }
    }

    // Check permissions if required and system role check passed (or no system role required)
    if (requiredPermission) {
      hasAccess = hasPermission(requiredPermission);
    } else if (requiredPermissions.length > 0) {
      hasAccess = requireAll 
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);
    } else if (!requiredSystemRole) {
      // If no specific permissions or system role required, grant access
      hasAccess = true;
    }

    if (!hasAccess && (requiredPermission || requiredPermissions.length > 0)) {
      toast.error("You don't have permission to access this page");
      router.push(redirectTo);
    }
  }, [loading, isAuthenticated, hasPermission, hasAnyPermission, hasAllPermissions, hasSystemRole, router, redirectTo, requiredSystemRole, requiredPermission, requiredPermissions, requireAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return null;
  }

  let hasAccess = false;

  // Check system role first if required
  if (requiredSystemRole) {
    hasAccess = hasSystemRole(requiredSystemRole);
    if (!hasAccess) {
      return null;
    }
  }

  // Check permissions if required and system role check passed (or no system role required)
  if (requiredPermission) {
    hasAccess = hasPermission(requiredPermission);
  } else if (requiredPermissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
  } else if (!requiredSystemRole) {
    // If no specific permissions or system role required, grant access
    hasAccess = true;
  }

  return hasAccess || requiredSystemRole ? <>{children}</> : null;
};
