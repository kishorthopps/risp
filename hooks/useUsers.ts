import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mcApiService } from '@/lib/mcApiService';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import type { User, CreateUserData, UpdateUserData, AlternateContact } from '@/lib/types';

/**
 * ROLES HOOK
 * Fetches all roles for an organization
 * Used for: Role filtering in manager selection
 * Endpoint: /organisations/${orgId}/roles
 * Returns: Array of roles with id and name
 */
export function useRoles(orgId: string) {
  return useQuery({
    queryKey: queryKeys.roles.byOrg(orgId),
    queryFn: async () => {
      const response = await mcApiService.get(`/organisations/${orgId}/roles`);
      return response.roles as Array<{ id: string; name: string; description?: string }>;
    },
    enabled: !!orgId,
  });
}

/**
 * ORGANIZATION USERS HOOK
 * Fetches users who belong to an organization (from orgUser table)
 * Used for: Organization management, admin console user lists
 * Endpoint: /organisations/${orgId}/project-group-users
 * Returns: Simple user list with id and name for selection purposes
 */
export function useUsersByOrganization(orgId: string) {
  return useQuery({
    queryKey: queryKeys.users.byOrg(orgId),
    queryFn: async () => {
      const response = await mcApiService.get(`/organisations/${orgId}/project-group-users`);
      return response.users as User[];
    },
    enabled: !!orgId,
  });
}

/**
 * PROJECT USERS HOOK  
 * Fetches users who are assigned to a specific project (from projectUser table)
 * Used for: Project-specific user management, app console
 * Endpoint: /organisations/${orgId}/projects/${projectId}/users/all
 * Returns: Complete user data with project context and role information
 */
export function useUsersByProject(orgId: string, projectId: string) {
  return useQuery({
    queryKey: queryKeys.users.byProject(orgId, projectId),
    queryFn: async () => {
      const response = await mcApiService.get(`/organisations/${orgId}/projects/${projectId}/users/all`);
      
      // Transform the response to match our User interface
      // Data structure: projectUser -> orgUser -> user
      const formattedUsers: User[] = response.users.map((user: any) => {
        const orgUser = user.orgUser;
        const userDetails = orgUser.user;
        const projectUserRole = user.role; // This should be an array of role IDs

        return {
          id: user.id, // projectUser ID
          name: userDetails.name || "",
          email: userDetails.email || "",
          mobile: userDetails.extras?.mobile || "",
          aadhaar: userDetails.extras?.aadhaar || "",
          dob: userDetails.extras?.dob || "",
          nationality: userDetails.extras?.nationality || "",
          address: userDetails.extras?.address || "",
          country: userDetails.extras?.country || "",
          state: userDetails.extras?.state || "",
          religion: userDetails.extras?.religion || "",
          caste: userDetails.extras?.caste || "",
          annualIncome: userDetails.extras?.annualIncome || "",
          languagePreference: userDetails.extras?.languagePreference || "",
          roleId: Array.isArray(projectUserRole) ? projectUserRole[0] : projectUserRole, // Keep backward compatibility
          roleIds: Array.isArray(projectUserRole) ? projectUserRole : (projectUserRole ? [projectUserRole] : []), // Multiple roles
          orgUser: orgUser, // Keep original structure for reference
        };
      });
      
      return formattedUsers;
    },
    enabled: !!orgId && !!projectId,
  });
}

/**
 * SINGLE PROJECT USER HOOK
 * Fetches a specific user assigned to a project
 * Used for: User detail views, editing specific project users
 * Endpoint: /organisations/${orgId}/projects/${projectId}/user/${userId}
 * Returns: Complete user data with alternate contacts
 */
export function useUser(orgId: string, projectId: string, userId: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: async () => {
      const response = await mcApiService.get(
        `/organisations/${orgId}/projects/${projectId}/user/${userId}`
      );
      
      const user = response.user.orgUser.user;
      const projectUserRole = response.user.role; // This should be an array of role IDs
      
      return {
        id: userId, // projectUser ID
        name: user.name || "",
        email: user.email || "",
        mobile: user.extras?.mobile || "",
        aadhaar: user.extras?.aadhaar || "",
        dob: user.extras?.dob || "",
        nationality: user.extras?.nationality || "",
        address: user.extras?.address || "",
        country: user.extras?.country || "",
        state: user.extras?.state || "",
        religion: user.extras?.religion || "",
        caste: user.extras?.caste || "",
        annualIncome: user.extras?.annualIncome || "",
        languagePreference: user.extras?.languagePreference || "",
        roleId: Array.isArray(projectUserRole) ? projectUserRole[0] : projectUserRole, // Keep backward compatibility
        roleIds: Array.isArray(projectUserRole) ? projectUserRole : (projectUserRole ? [projectUserRole] : []), // Multiple roles
        alternateContacts: user.alternateContacts || [],
      };
    },
    enabled: !!orgId && !!projectId && !!userId,
  });
}

// Check Email Hook for Alternate Contacts
export function useCheckEmail() {
  return useMutation({
    mutationFn: async ({ orgId, projectId, email }: { orgId: string; projectId: string; email: string }) => {
      const response = await mcApiService.post(
        `/organisations/${orgId}/projects/${projectId}/users/alternatecontact/check-email`,
        { email }
      );
      return response;
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 
                     error?.response?.message || 
                     'Failed to check email';
      toast.error(message);
    },
  });
}

// Create User Mutation
export function useCreateUser(orgId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userData }: { userData: CreateUserData }) => {
      // Send data in format matching backend
      const payload = {
        email: userData.email,
        name: userData.name,
        extras: userData.extras || {},
        roleId: userData.roleId, // Keep for backward compatibility
        roleIds: userData.roleIds // Add support for multiple roles
      };
      
      const response = await mcApiService.post(
        `/organisations/${orgId}/projects/${projectId}/usersassign`,
        payload
      );
      return response;
    },
    onSuccess: () => {
      invalidateQueries.usersByProject(orgId, projectId);
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 
                     error?.response?.message || 
                     'Failed to create user';
      toast.error(message);
    },
  });
}

// Update User Mutation
export function useUpdateUser(orgId: string, projectId: string, userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userData }: { userData: UpdateUserData }) => {
      // Send data in format matching backend
      const payload = {
        name: userData.name,
        email: userData.email,
        extras: userData.extras || {},
        roleId: userData.roleId, // Keep for backward compatibility
        roleIds: userData.roleIds // Add support for multiple roles
      };
      
      const response = await mcApiService.patch(
        `/organisations/${orgId}/projects/${projectId}/user/${userId}`,
        payload
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      invalidateQueries.usersByProject(orgId, projectId);
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 
                     error?.response?.message || 
                     'Failed to update user';
      toast.error(message);
    },
  });
}

// Delete User Mutation
export function useDeleteUser(orgId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await mcApiService.delete(
        `/organisations/${orgId}/projects/${projectId}/users/${userId}`
      );
      return userId;
    },
    onSuccess: (deletedUserId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(deletedUserId) });
      
      // Invalidate users list
      invalidateQueries.usersByProject(orgId, projectId);
      
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 
                     error?.response?.message || 
                     'Failed to delete user';
      toast.error(message);
    },
  });
}

// Add User to Project Mutation
export function useAddUserToProject(orgId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId?: string }) => {
      const response = await mcApiService.post(
        `/organisations/${orgId}/projects/${projectId}/users/add`,
        { userId, roleId }
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate users for this project
      invalidateQueries.usersByProject(orgId, projectId);
      
      toast.success('User added to project successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.message || 'Failed to add user to project';
      toast.error(message);
    },
  });
}

// Remove User from Project Mutation
export function useRemoveUserFromProject(orgId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await mcApiService.delete(
        `/organisations/${orgId}/projects/${projectId}/users/${userId}/remove`
      );
      return userId;
    },
    onSuccess: () => {
      // Invalidate users for this project
      invalidateQueries.usersByProject(orgId, projectId);
      
      toast.success('User removed from project successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.message || 'Failed to remove user from project';
      toast.error(message);
    },
  });
}

// Add Alternate Contact Mutation
export function useAddAlternateContact(orgId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, contactData }: { 
      userId: string; 
      contactData: { contactId: string; relationship: string } 
    }) => {
      const response = await mcApiService.post(
        `/organisations/${orgId}/projects/${projectId}/userId/${userId}/alternate-contacts`,
        contactData
      );
      return response;
    },
    onSuccess: (_, { userId }) => {
      // Invalidate user details to refresh alternate contacts
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      
      toast.success('Alternate contact added successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 
                     error?.response?.message || 
                     'Failed to add alternate contact';
      toast.error(message);
    },
  });
}

// Remove Alternate Contact Mutation
export function useRemoveAlternateContact(orgId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alternateContactId, userId }: { 
      alternateContactId: string; 
      userId: string 
    }) => {
      await mcApiService.delete(
        `/organisations/${orgId}/projects/${projectId}/alternate-contacts/${alternateContactId}`
      );
      return { alternateContactId, userId };
    },
    onSuccess: (_, { userId }) => {
      // Invalidate user details to refresh alternate contacts
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      
      toast.success('Alternate contact removed successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 
                     error?.response?.message || 
                     'Failed to remove alternate contact';
      toast.error(message);
    },
  });
}