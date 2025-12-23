import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mcApiService } from '@/lib/mcApiService';
import { queryKeys } from '@/lib/queryClient';
import type { Group, GroupAdmin, User } from '@/lib/types';

// Groups Hook
export function useGroups(orgId: string) {
  return useQuery({
    queryKey: ['groups', 'organization', orgId],
    queryFn: async () => {
      const response = await mcApiService.get(`/organisations/${orgId}/assessment-groups`);
      return response.groups as Group[];
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Group Admins Hook
export function useGroupAdmins(orgId: string) {
  return useQuery({
    queryKey: ['group-admins', 'organization', orgId],
    queryFn: async () => {
      const response = await mcApiService.get(`/organisations/${orgId}/group-admins`);
      return response.users as GroupAdmin[];
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Available Users for Groups Hook
export function useAvailableUsers(orgId: string) {
  return useQuery({
    queryKey: ['users', 'available', orgId],
    queryFn: async () => {
      const response = await mcApiService.get(`/organisations/${orgId}/project-group-users`);
      return response.users as User[];
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Mutations

// Create Group
export function useCreateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orgId, 
      groupData 
    }: { 
      orgId: string; 
      groupData: { 
        name: string; 
        managerId: string; 
        projectId?: string 
      } 
    }) => {
      const response = await mcApiService.post(`/organisations/${orgId}/assessment-groups`, groupData);
      return response;
    },
    onSuccess: (_, { orgId }) => {
      toast.success("Group created successfully!");
      queryClient.invalidateQueries({ queryKey: ['groups', 'organization', orgId] });
    },
    onError: () => {
      toast.error("Failed to create group");
    },
  });
}

// Update Group
export function useUpdateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orgId, 
      groupId, 
      groupData 
    }: { 
      orgId: string; 
      groupId: string;
      groupData: { 
        name: string; 
        managerId: string 
      } 
    }) => {
      const response = await mcApiService.patch(`/organisations/${orgId}/assessment-groups/${groupId}`, groupData);
      return response;
    },
    onSuccess: (_, { orgId }) => {
      toast.success("Group updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['groups', 'organization', orgId] });
    },
    onError: () => {
      toast.error("Failed to update group");
    },
  });
}

// Delete Group
export function useDeleteGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orgId, groupId }: { orgId: string; groupId: string }) => {
      const response = await mcApiService.delete(`/organisations/${orgId}/assessment-groups/${groupId}`);
      return response;
    },
    onSuccess: (_, { orgId }) => {
      toast.success("Group deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['groups', 'organization', orgId] });
    },
    onError: () => {
      toast.error("Failed to delete group");
    },
  });
}

// Assign Users to Group
export function useAssignUsersToGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orgId, 
      groupId, 
      userIds 
    }: { 
      orgId: string; 
      groupId: string; 
      userIds: string[] 
    }) => {
      const response = await mcApiService.post(
        `/organisations/${orgId}/assessment-groups/${groupId}/members`,
        { userIds }
      );
      return response;
    },
    onSuccess: (response, { orgId }) => {
      const data = response?.data || response;
      let message = "Users assigned successfully!";
      
      if (data?.addedUsers && data?.alreadyMembers) {
        message = `${data.addedUsers.length} user(s) added. ${data.alreadyMembers.length} were already members.`;
      } else if (data?.message) {
        message = data.message;
      }
      
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['groups', 'organization', orgId] });
    },
    onError: (error: any) => {
      console.error('Error assigning users to group:', error);
      const message = error?.response?.data?.message || 
                     error?.response?.message || 
                     error?.message ||
                     'Failed to assign users';
      toast.error(message);
      
      // Show additional info for specific errors
      if (error?.response?.data?.invalidUserIds) {
        toast.error(`Invalid users: ${error.response.data.invalidUserIds.join(', ')}`);
      }
      if (error?.response?.data?.alreadyMembers) {
        toast.info(`Some users were already in the group`);
      }
    },
  });
}

// Remove User from Group
export function useRemoveUserFromGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orgId, 
      groupId, 
      memberId 
    }: { 
      orgId: string; 
      groupId: string; 
      memberId: string 
    }) => {
      const response = await mcApiService.delete(
        `/organisations/${orgId}/assessment-groups/${groupId}/members/${memberId}`
      );
      return response;
    },
    onSuccess: (_, { orgId }) => {
      toast.success("User removed successfully!");
      queryClient.invalidateQueries({ queryKey: ['groups', 'organization', orgId] });
    },
    onError: () => {
      toast.error("Failed to remove user");
    },
  });
} 