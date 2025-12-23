"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { mcApiService } from '@/lib/mcApiService';

interface User {
  id: string;
  email: string;
  name: string;
  systemRole: 'SUPER_USER' | 'ORG_USER';
}

interface Organization {
  id: string;
  name: string;
  permissions: string[];
  role: string | null;
}

interface AuthContextType {
  // User data
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // System role helpers
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  canSwitchContext: boolean;
  
  // Organizations and permissions
  organizations: Organization[];
  currentOrgId: string | null;
  currentOrgPermissions: string[];
  
  // Methods
  login: (token: string, userData: User) => void;
  logout: () => void;
  setCurrentOrganization: (orgId: string) => void;
  hasPermission: (permission: string, orgId?: string) => boolean;
  hasAnyPermission: (permissions: string[], orgId?: string) => boolean;
  hasAllPermissions: (permissions: string[], orgId?: string) => boolean;
  hasSystemRole: (role: string | string[]) => boolean;
  
  // Organization management
  refreshOrganizations: () => Promise<void>;
  getOrganizationPermissions: (orgId: string) => string[];
  getDefaultRedirectUrl: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [permissionsCache, setPermissionsCache] = useState<Record<string, string[]>>({});

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Fetch organization permissions when current org changes
  useEffect(() => {
    if (currentOrgId && isAuthenticated && user) {
      fetchOrganizationPermissions(currentOrgId);
    }
  }, [currentOrgId, isAuthenticated, user]);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const systemRole = localStorage.getItem('systemRole') as 'SUPER_USER' | 'ORG_USER';
      const orgId = localStorage.getItem('organisationId');

      if (token && userId && systemRole) {
        // Create user object from stored data
        const userData: User = {
          id: userId,
          email: localStorage.getItem('userEmail') || '',
          name: localStorage.getItem('userName') || '',
          systemRole: systemRole
        };

        setUser(userData);
        setIsAuthenticated(true);
        setCurrentOrgId(orgId);

        // Fetch organizations and permissions
        await fetchUserOrganizations(userData);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrganizations = async (userData?: User) => {
    try {
      const currentUser = userData || user;
      if (!currentUser?.id) return;

      const response = await mcApiService.get(`/organisations/getUserOrganisations/${currentUser.id}`);
      const orgs = response.organisations || [];

      // Fetch permissions for each organization
      const orgsWithPermissions: Organization[] = [];
      
      for (const org of orgs) {
        try {
          const permissionsResponse = await mcApiService.get(`/organisations/${org.id}/user/permissions`);
          
          orgsWithPermissions.push({
            id: org.id,
            name: org.name,
            permissions: permissionsResponse.actions || [],
            role: permissionsResponse.role || null
          });

          // Cache permissions
          setPermissionsCache(prev => ({
            ...prev,
            [org.id]: permissionsResponse.actions || []
          }));
        } catch (error) {
          // User might not have access to this org
          orgsWithPermissions.push({
            id: org.id,
            name: org.name,
            permissions: [],
            role: null
          });
        }
      }

      setOrganizations(orgsWithPermissions);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchOrganizationPermissions = async (orgId: string) => {
    // Return cached permissions if available
    if (permissionsCache[orgId]) {
      return permissionsCache[orgId];
    }

    try {
      const response = await mcApiService.get(`/organisations/${orgId}/user/permissions`);
      const permissions = response.actions || [];
      
      // Update cache
      setPermissionsCache(prev => ({
        ...prev,
        [orgId]: permissions
      }));

      // Update organization in state
      setOrganizations(prev => 
        prev.map(org => 
          org.id === orgId 
            ? { ...org, permissions, role: response.role || null }
            : org
        )
      );

      return permissions;
    } catch (error) {
      console.error('Error fetching organization permissions:', error);
      return [];
    }
  };

  const login = (token: string, userData: User) => {
    // Set token in mcApiService
    mcApiService.setToken(token);
    
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userData.id);
    localStorage.setItem('systemRole', userData.systemRole);
    localStorage.setItem('userEmail', userData.email);
    localStorage.setItem('userName', userData.name);

    setUser(userData);
    setIsAuthenticated(true);
    
    // Fetch organizations after login
    fetchUserOrganizations(userData);
  };

  const logout = () => {
    // Clear mcApiService token first
    mcApiService.clearToken();
    
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('systemRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('organisationId');
    localStorage.removeItem('organisationName');
    
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    setUser(null);
    setIsAuthenticated(false);
    setOrganizations([]);
    setCurrentOrgId(null);
    setPermissionsCache({});
  };

  const setCurrentOrganization = (orgId: string) => {
    setCurrentOrgId(orgId);
    localStorage.setItem('organisationId', orgId);
    
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      localStorage.setItem('organisationName', org.name);
    }
  };

  // Permission checking methods
  const hasPermission = (permission: string, orgId?: string): boolean => {
    const targetOrgId = orgId || currentOrgId;
    if (!targetOrgId) return false;

    const permissions = permissionsCache[targetOrgId] || [];
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[], orgId?: string): boolean => {
    return permissions.some(permission => hasPermission(permission, orgId));
  };

  const hasAllPermissions = (permissions: string[], orgId?: string): boolean => {
    return permissions.every(permission => hasPermission(permission, orgId));
  };

  const hasSystemRole = (role: string | string[]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    
    // Handle special OrgAdmin case
    // if (roles.includes('ORG_ADMIN') && user.systemRole === 'ORG_USER') {
    //   // Check if user has admin permissions in any organization
    //   return organizations.some(org => {
    //     const adminActions = ['organisation.update', 'users.create', 'roles.create', 'project.create'];
    //     return adminActions.some(action => org.permissions.includes(action));
    //   });
    // }
    
    return roles.includes(user.systemRole);
  };

  const getOrganizationPermissions = (orgId: string): string[] => {
    return permissionsCache[orgId] || [];
  };

  const refreshOrganizations = async () => {
    await fetchUserOrganizations();
  };

  const getDefaultRedirectUrl = (): string => {
    if (!user) return '/';
    
    // SUPER_USER and ORG_ADMIN (admin privileges) go to admin console
    if (user.systemRole === 'SUPER_USER' || isOrgAdmin) {
      return '/admin/organisations';
    }
    
    // ORG_USER goes directly to app console (projects)
    if (user.systemRole === 'ORG_USER') {
      return '/app/projects';
    }
    
    // Default fallback
    return '/admin/organisations';
  };

  // Computed values
  const isSuperAdmin = user?.systemRole === 'SUPER_USER';
  const isOrgAdmin = hasSystemRole(['SUPER_USER', 'ORG_ADMIN']);
  const canSwitchContext = isSuperAdmin || isOrgAdmin;
  const currentOrgPermissions = currentOrgId ? getOrganizationPermissions(currentOrgId) : [];

  const value: AuthContextType = {
    // User data
    user,
    isAuthenticated,
    loading,
    
    // System role helpers
    isSuperAdmin,
    isOrgAdmin,
    canSwitchContext,
    
    // Organizations and permissions
    organizations,
    currentOrgId,
    currentOrgPermissions,
    
    // Methods
    login,
    logout,
    setCurrentOrganization,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasSystemRole,
    
    // Organization management
    refreshOrganizations,
    getOrganizationPermissions,
    getDefaultRedirectUrl,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for organization-specific permissions
export function useOrgPermissions(orgId?: string) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, getOrganizationPermissions } = useAuth();
  
  return {
    hasPermission: (permission: string) => hasPermission(permission, orgId),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(permissions, orgId),
    hasAllPermissions: (permissions: string[]) => hasAllPermissions(permissions, orgId),
    permissions: orgId ? getOrganizationPermissions(orgId) : [],
  };
}