import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { mcApiService } from '@/lib/mcApiService';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { useState, useEffect } from 'react';
import type { User, AuthOrganization, AuthResponse } from '@/lib/types';

// Auth Hook
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    // Set token in API service if it exists
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        mcApiService.setToken(token);
      }
      setIsInitialized(true);
    }
  }, []);
  // Get current user from localStorage (sync)
  const getCurrentUser = (): User | null => {
    if (typeof window === 'undefined' || !isInitialized) return null;
    
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const systemRole = localStorage.getItem('systemRole') as 'SUPER_USER' | 'ORG_ADMIN' | 'ORG_USER';
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');

    if (token && userId && systemRole && userEmail && userName) {
      return {
        id: userId,
        email: userEmail,
        name: userName,
        systemRole: systemRole
      };
    }
    
    return null;
  };

  const currentUser = getCurrentUser();
  
  // User organizations query
  const { 
    data: organizations = [], 
    isLoading: organizationsLoading,
    error: organizationsError 
  } = useQuery({
    queryKey: queryKeys.organizations.user(currentUser?.id || ''),
    queryFn: async () => {
      if (!currentUser?.id) throw new Error('No user ID');
      
      const response = await mcApiService.get(`/organisations/getUserOrganisations/${currentUser.id}`);
      const orgs = response.organisations || [];

      // Fetch permissions for each organization in parallel
      const orgsWithPermissions = await Promise.all(
        orgs.map(async (org: any) => {
          try {
            const permissionsResponse = await mcApiService.get(`/organisations/${org.id}/user/permissions`);
            return {
              id: org.id,
              name: org.name,
              permissions: permissionsResponse.actions || [],
              role: permissionsResponse.role || null
            };
          } catch (error) {
            // User might not have access to this org
            return {
              id: org.id,
              name: org.name,
              permissions: [],
              role: null
            };
          }
        })
      );

      return orgsWithPermissions as AuthOrganization[];
    },
    enabled: !!currentUser?.id && isInitialized,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.status === 401 || error?.status === 403) {
        // Clear invalid auth data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('systemRole');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
          mcApiService.clearToken();
        }
        return false;
      }
      return failureCount < 2;
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await mcApiService.post("/auth/login", { email, password });
      return response as AuthResponse;
    },
    onSuccess: (data) => {
      // Set token in mcApiService
      mcApiService.setToken(data.token);
      
      // Store user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('systemRole', data.user.systemRole);
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userName', data.user.name);

      // Set cookie for SSR
      const date = new Date();
      date.setTime(date.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
      const expires = `expires=${date.toUTCString()}`;
      document.cookie = `token=${data.token}; path=/; ${expires}`;

      // Invalidate and refetch relevant queries
      invalidateQueries.auth();
      
      toast.success("Login successful!");
      
      // Redirect based on role
      const redirectUrl = getDefaultRedirectUrl(data.user.systemRole);
      router.push(redirectUrl);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.message || 
                          error?.message || 
                          "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Clear API service token
      mcApiService.clearToken();
      
      // Clear all local storage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('systemRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('organisationId');
      
      // Clear cookie
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    },
    onSuccess: () => {
      // Clear all query cache
      queryClient.clear();
      
      toast.success("Logged out successfully");
      router.push("/");
    },
  });
  // Helper functions
  const getDefaultRedirectUrl = (systemRole?: string): string => {
    const role = systemRole || currentUser?.systemRole;
    
    if (role === 'SUPER_USER') {
      return '/admin/organisations';
    }
    
    if (role === 'ORG_ADMIN') {
      return '/admin/organisations';
    }
    
    return '/app/projects';
  };
  const hasSystemRole = (role: string | string[]): boolean => {
    if (!currentUser) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    
    // Direct system role check
    return roles.includes(currentUser.systemRole);
  };

  const hasPermission = (permission: string, orgId?: string): boolean => {
    if (!currentUser || !orgId) return false;
    
    const org = organizations.find(o => o.id === orgId);
    return org?.permissions.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: string[], orgId?: string): boolean => {
    return permissions.some(permission => hasPermission(permission, orgId));
  };

  const hasAllPermissions = (permissions: string[], orgId?: string): boolean => {
    return permissions.every(permission => hasPermission(permission, orgId));
  };

  // Action-specific permission checking functions
  const hasAction = (action: string, orgId?: string): boolean => {
    return hasPermission(action, orgId);
  };

  const hasAnyAction = (actions: string[], orgId?: string): boolean => {
    return actions.some(action => hasPermission(action, orgId));
  };

  const hasAllActions = (actions: string[], orgId?: string): boolean => {
    return actions.every(action => hasPermission(action, orgId));
  };

  // Get all user actions for a specific organization
  const getUserActions = (orgId?: string): string[] => {
    if (!currentUser || !orgId) return [];
    
    const org = organizations.find(o => o.id === orgId);
    return org?.permissions || [];
  };

  // Check if user can perform specific operations
  const canCreateUser = (orgId?: string): boolean => hasAction('users.create', orgId);
  const canUpdateUser = (orgId?: string): boolean => hasAction('users.update', orgId);
  const canDeleteUser = (orgId?: string): boolean => hasAction('users.delete', orgId);
  const canAssignRoles = (orgId?: string): boolean => hasAction('users.assignRoles', orgId);
  
  const canCreateProject = (orgId?: string): boolean => hasAction('project.create', orgId);
  const canUpdateProject = (orgId?: string): boolean => hasAction('project.update', orgId);
  const canDeleteProject = (orgId?: string): boolean => hasAction('project.delete', orgId);

  // Computed values
  const isAuthenticated = !!currentUser && isInitialized;
  const isSuperAdmin = currentUser?.systemRole === 'SUPER_USER';
  const isOrgAdmin = currentUser?.systemRole === 'ORG_ADMIN';
  const canSwitchContext = isSuperAdmin || isOrgAdmin;
  const loading = !isInitialized || organizationsLoading;

  return {
    // User data
    user: currentUser,
    isAuthenticated,
    loading,
    isInitialized,
    
    // Organizations
    organizations,
    organizationsLoading,
    organizationsError,
    
    // System role helpers
    isSuperAdmin,
    isOrgAdmin,
    canSwitchContext,
    
    // Permission helpers
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasSystemRole,
    
    // Action-specific permission helpers
    hasAction,
    hasAnyAction,
    hasAllActions,
    getUserActions,
    
    // Common operation helpers
    canCreateUser,
    canUpdateUser,
    canDeleteUser,
    canAssignRoles,
    canCreateProject,
    canUpdateProject,
    canDeleteProject,
    
    // Actions
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    
    // Utils
    getDefaultRedirectUrl,
  };
}

// Hook to get organization ID for a specific project
export function useProjectOrg(projectId?: string) {
  const { organizations, isInitialized } = useAuth();
  
  const { data: orgId, isLoading } = useQuery({
    queryKey: queryKeys.projects.org(projectId || ''),
    queryFn: async () => {
      if (!projectId) return null;
      
      for (const org of organizations) {
        try {
          const response = await mcApiService.get(`/organisations/${org.id}/projects`);
          const projects = response.projects || [];
          const project = projects.find((p: any) => p.id === projectId);
          if (project) {
            return org.id;
          }
        } catch (error) {
          continue;
        }
      }
      return null;
    },
    enabled: !!projectId && organizations.length > 0 && isInitialized,
    staleTime: 10 * 60 * 1000, // 10 minutes - project org relationships don't change often
  });

  return {
    orgId,
    isLoading,
  };
}

// Hook for organization-specific permissions
export function useOrgPermissions(orgId?: string) {
  const { organizations, hasPermission, hasAnyPermission, hasAllPermissions, hasAction, hasAnyAction, hasAllActions, getUserActions } = useAuth();
  
  const org = organizations.find(o => o.id === orgId);
  const permissions = org?.permissions || [];
  
  return {
    permissions,
    hasPermission: (permission: string) => hasPermission(permission, orgId),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(permissions, orgId),
    hasAllPermissions: (permissions: string[]) => hasAllPermissions(permissions, orgId),
    hasAction: (action: string) => hasAction(action, orgId),
    hasAnyAction: (actions: string[]) => hasAnyAction(actions, orgId),
    hasAllActions: (actions: string[]) => hasAllActions(actions, orgId),
    getUserActions: () => getUserActions(orgId),
    role: org?.role,
  };
}