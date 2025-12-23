import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface PermissionGateProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
}

export const PermissionGate = ({ children, permission, fallback = null }: PermissionGateProps) => {
  const { hasPermission } = useAuth();

  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
};
