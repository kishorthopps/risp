import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mcApiService } from '@/lib/mcApiService';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import type { 
  Organization, 
  OrganizationProject, 
  OrganizationUser, 
  OrganizationRole, 
  OrganizationStats 
} from '@/lib/types';

// Organizations List Hook (for current user)
export function useOrganizations(userId?: string) {
  return useQuery({
    queryKey: queryKeys.organizations.user(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const response = await mcApiService.get(`/organisations/getUserOrganisations/${userId}`);
      return response.organisations as Organization[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// All Organizations Hook (for SuperAdmin - shows all organizations in system)
export function useAllOrganizations(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.organizations.all,
    queryFn: async () => {
      const response = await mcApiService.get('/organisations');
      return response.organisations as Organization[];
    },
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Single Organization Hook
export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: queryKeys.organizations.detail(orgId),
    queryFn: async () => {
      const response = await mcApiService.get(`/organisations/${orgId}`);
      return response.organisation as Organization;
    },
    enabled: !!orgId,
  });
}

// Organization Projects Hook
export function useOrganizationProjects(orgId: string) {
  return useQuery({
    queryKey: queryKeys.projects.byOrg(orgId),
    queryFn: async () => {
      const response = await mcApiService.get(`/organisations/${orgId}/projects`);
      return response.projects as OrganizationProject[];
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Organization Users and Roles Hook
export function useOrganizationUsers(orgId: string) {
  return useQuery({
    queryKey: queryKeys.users.byOrg(orgId),
    queryFn: async () => {
      const response = await mcApiService.get(`/organisations/${orgId}/users-roles`);
      const { userRoles } = response; // Backend returns 'userRoles' not 'users'

      if (!userRoles || !Array.isArray(userRoles)) {
        return {
          users: [],
          roles: [],
        };
      }

      // Transform the backend data to match frontend expectations
      // Group users by ID since a user can have multiple roles
      const userMap = new Map<string, OrganizationUser>();
      
      userRoles.forEach((item: any) => {
        const userId = item.user.id;
        const roleName = item.role ? item.role.name : 'No Role';
        
        if (userMap.has(userId)) {
          // User already exists, append role
          const existingUser = userMap.get(userId)!;
          const existingRoles = existingUser.role.split(', ');
          if (!existingRoles.includes(roleName)) {
            existingUser.role = [...existingRoles, roleName].join(', ');
          }
        } else {
          // New user
          userMap.set(userId, {
            id: item.user.id,
            name: item.user.name,
            email: item.user.email,
            role: roleName,
            extras: item.user.extras // Include extras field
          });
        }
      });
      
      const transformedUsers: OrganizationUser[] = Array.from(userMap.values());

      // Extract unique roles from all users for the roles list
      const rolesSet = new Set<string>();
      const rolesMap = new Map<string, OrganizationRole>();

      userRoles.forEach((item: any) => {
        if (item.role && item.role.name) {
          const roleName = item.role.name;
          if (!rolesSet.has(roleName)) {
            rolesSet.add(roleName);
            rolesMap.set(item.role.id, { 
              id: item.role.id, 
              name: roleName 
            });
          }
        }
      });

      return {
        users: transformedUsers,
        roles: Array.from(rolesMap.values()),
      };
    },
    enabled: !!orgId,
  });
}

// Organization Roles Hook
export function useOrganizationRoles(orgId: string) {
  return useQuery({
    queryKey: queryKeys.roles.byOrg(orgId),
    queryFn: async () => {
      const response = await mcApiService.get(`/organisations/${orgId}/roles`);
      const uniqueRoles = Array.from(
        new Map((response.roles as OrganizationRole[]).map((role) => [role.id, role])).values()
      );
      return uniqueRoles;
    },
    enabled: !!orgId,
  });
}

// Organization Dashboard Stats Hook
export function useOrganizationStats(userId: string) {
  const { data: organizations = [] } = useOrganizations(userId);
  
  return useQuery({
    queryKey: ['organizations', 'stats', userId],
    queryFn: async (): Promise<OrganizationStats> => {
      return {
        totalOrganizations: organizations.length,
        activeOrganizations: organizations.filter((org) => org.status === "active").length,
        totalMembers: organizations.reduce((sum, org) => sum + (org.members || 0), 0),
        recentActivity: organizations.filter(
          (org) =>
            new Date(org.updatedAt || org.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
      };
    },
    enabled: organizations.length > 0,
  });
}

// Mutations

// Create Organization
export function useCreateOrganization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      name: string; 
      description: string; 
      adminEmail: string; 
      adminPassword: string; 
      adminName: string; 
    }) => {
      const response = await mcApiService.post("/organisations", data);
      return response;
    },
    onSuccess: () => {
      toast.success("Organization created successfully!");
      invalidateQueries.organizations();
      
      // Also refresh the current user's organizations list
      const userId = localStorage.getItem('userId');
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.organizations.user(userId) });
      }
      
      // Refresh all organizations list for SuperAdmin view
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
    },
    onError: (error: any) => {
      // Enhanced error handling to show specific backend messages
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.message || 
                          error?.message || 
                          "Failed to create organization";
      toast.error(errorMessage);
    },
  });
}

// Update Organization
export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orgId, data }: { orgId: string; data: Partial<Organization> }) => {
      const response = await mcApiService.patch(`/organisations/${orgId}`, data);
      return response;
    },
    onSuccess: (_, { orgId }) => {
      toast.success("Organization updated successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(orgId) });
      invalidateQueries.organizations();
    },
    onError: (error: any) => {
      // Enhanced error handling to show specific backend messages
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.response?.message || 
                          error?.message || 
                          "Failed to update organization";
      toast.error(errorMessage);
    },
  });
}

// Add User to Organization
export function useAddOrganizationUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orgId, 
      userData 
    }: { 
      orgId: string; 
      userData: { 
        email: string; 
        password: string; 
        name: string; 
        roleIds: string[];
        extras?: {
          mobile?: string;
          aadhaar?: string;
          dob?: string;
          nationality?: string;
          address?: string;
          country?: string;
          state?: string;
          religion?: string;
          caste?: string;
          annualIncome?: string;
          languagePreference?: string;
        };
      } 
    }) => {
      const response = await mcApiService.post(
        `/organisations/organisation-users/organisationId/${orgId}`, 
        userData
      );
      return response;
    },
    onSuccess: (data, { orgId }) => {
      const message = data?.isNewUser 
        ? "New user created and added successfully!"
        : "Existing user added to organization successfully!";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.byOrg(orgId) });
    },
    onError: (error: any) => {
      // Enhanced error handling to show specific backend messages
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.response?.message || 
                          error?.message || 
                          "Failed to add user";
      toast.error(errorMessage);
    },
  });
}

// Update Organization User
export function useUpdateOrganizationUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orgId, 
      userId, 
      userData,
      rolesToRemove = []
    }: { 
      orgId: string; 
      userId: string;
      userData: { name: string; email: string; roleIds: string[]; extras?: any };
      rolesToRemove?: string[];
    }) => {
      // Remove roles first
      for (const roleId of rolesToRemove) {
        await mcApiService.delete(`/organisations/${orgId}/users/${userId}/roles/${roleId}`);
      }
      
      // Update user
      const response = await mcApiService.patch(`/organisations/${orgId}/users/${userId}`, userData);
      return response;
    },
    onSuccess: (_, { orgId }) => {
      toast.success("User updated successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.users.byOrg(orgId) });
    },
    onError: (error: any) => {
      // Enhanced error handling to show specific backend messages
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.response?.message || 
                          error?.message || 
                          "Failed to update user";
      toast.error(errorMessage);
    },
  });
}

// Delete Organization User
export function useDeleteOrganizationUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orgId, userId }: { orgId: string; userId: string }) => {
      const response = await mcApiService.delete(`/organisations/${orgId}/users/${userId}/delete`);
      return response;
    },
    onSuccess: (_, { orgId }) => {
      toast.success("User deleted successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.users.byOrg(orgId) });
    },
    onError: (error: any) => {
      // Enhanced error handling to show specific backend messages
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.response?.message || 
                          error?.message || 
                          "Failed to delete user";
      toast.error(errorMessage);
    },
  });
}

// Remove Role from User
export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orgId, userId, roleId }: { orgId: string; userId: string; roleId: string }) => {
      const response = await mcApiService.delete(`/organisations/${orgId}/users/${userId}/roles/${roleId}`);
      return response;
    },
    onSuccess: (_, { orgId }) => {
      toast.success("Role removed successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.users.byOrg(orgId) });
    },
    onError: (error: any) => {
      // Enhanced error handling to show specific backend messages
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.response?.message || 
                          error?.message || 
                          "Failed to remove role";
      toast.error(errorMessage);
    },
  });
}

// Get User Projects in Organization
export function useUserProjects(orgId: string, userId: string) {
  return useQuery({
    queryKey: queryKeys.users.projects(orgId, userId),
    queryFn: async () => {
      const response = await mcApiService.get(`/organisations/${orgId}/users/${userId}/projects`);
      return response.projects || [];
    },
    enabled: !!orgId && !!userId,
  });
}

// Delete Organization
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orgId: string) => {
      const response = await mcApiService.delete(`/organisations/${orgId}`);
      return response;
    },
    onSuccess: (_, orgId) => {
      toast.success("Organization deleted successfully!");
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      // Refresh current user's orgs if userId in localStorage
      const userId = localStorage.getItem('userId');
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.organizations.user(userId) });
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.message ||
        error?.message ||
        "Failed to delete organization";
      toast.error(errorMessage);
    },
  });
}