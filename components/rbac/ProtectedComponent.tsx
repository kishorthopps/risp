import { ReactNode } from "react";
import { useAuth, useOrgPermissions } from "@/hooks/useAuth";
import { useParams } from "next/navigation";

interface ProtectedComponentProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requiredAction?: string;
  requiredActions?: string[];
  requiredSystemRole?: string | string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showLoading?: boolean;
  orgId?: string;
}

export const ProtectedComponent = ({
  children,
  requiredPermission,
  requiredPermissions = [],
  requiredAction,
  requiredActions = [],
  requiredSystemRole,
  requireAll = false,
  fallback = null,
  showLoading = false,
  orgId,
}: ProtectedComponentProps) => {
  const { hasSystemRole, loading } = useAuth();
  const params = useParams();
  
  // Determine which org to check permissions for
  const targetOrgId = orgId || (params.orgId as string) || undefined;
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasAction, hasAnyAction, hasAllActions } = useOrgPermissions(targetOrgId);

  // Loading state
  if (loading && showLoading) {
    return <div className="animate-pulse h-4 w-4 bg-muted rounded" />;
  }

  // Check SystemRole first if required
  if (requiredSystemRole) {
    if (!hasSystemRole(requiredSystemRole)) {
      return <>{fallback}</>;
    }

    // If only SystemRole check is needed and it passes
    if (!requiredPermission && requiredPermissions.length === 0 && !requiredAction && requiredActions.length === 0) {
      return <>{children}</>;
    }
  }

  // Check permissions if required
  if (requiredPermission || requiredPermissions.length > 0) {
    if (!targetOrgId) {
      return <>{fallback}</>;
    }

    const permissionsToCheck = [
      ...(requiredPermission ? [requiredPermission] : []),
      ...requiredPermissions,
    ];

    const hasAccess = requireAll 
      ? hasAllPermissions(permissionsToCheck)
      : hasAnyPermission(permissionsToCheck);

    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  // Check actions if required
  if (requiredAction || requiredActions.length > 0) {
    if (!targetOrgId) {
      return <>{fallback}</>;
    }

    const actionsToCheck = [
      ...(requiredAction ? [requiredAction] : []),
      ...requiredActions,
    ];

    const hasActionAccess = requireAll 
      ? hasAllActions(actionsToCheck)
      : hasAnyAction(actionsToCheck);

    if (!hasActionAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};