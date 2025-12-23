import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mcApiService } from '@/lib/mcApiService';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import type { Project, CreateProjectData, UpdateProjectData, GroupedProjects } from '@/lib/types';

// Projects by Organization Hook
export function useProjectsByOrganization(orgId: string) {
  return useQuery({
    queryKey: queryKeys.projects.byOrg(orgId),
    queryFn: async () => {
      const response = await mcApiService.get(`/organisations/${orgId}/projects`);
      return response.projects as Project[];
    },
    enabled: !!orgId,
  });
}

// Single Project Hook - Updated to use organization-scoped endpoint
export function useProject(projectId: string, orgId?: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: async () => {
      // If we have orgId, we could fetch from org projects list and find the project
      // But since we don't have a direct project endpoint, we'll use a different approach
      if (orgId) {
        const response = await mcApiService.get(`/organisations/${orgId}/projects`);
        const project = response.projects.find((p: any) => p.id === projectId);
        if (project) {
          return project as Project;
        }
        throw new Error('Project not found in organization');
      }
      throw new Error('Organization ID required to fetch project details');
    },
    enabled: !!projectId && !!orgId,
  });
}

// User Projects Grouped by Organization Hook
export function useUserProjectsGrouped(userId: string) {
  return useQuery({
    queryKey: ['projects', 'user', userId, 'grouped'],
    queryFn: async () => {
      // Get user's organizations first
      const orgsResponse = await mcApiService.get(`/organisations/getUserOrganisations/${userId}`);
      const grouped: GroupedProjects = {};
      
      // Fetch projects for each organization in parallel
      const orgProjectPromises = orgsResponse.organisations.map(async (org: any) => {
        try {
          const projectsResponse = await mcApiService.get(`/organisations/${org.id}/projects`);
          
          if (projectsResponse.projects.length > 0) {
            return {
              orgId: org.id,
              orgName: org.name,
              projects: projectsResponse.projects.map((project: any) => ({
                ...project,
                organisationId: org.id,
                organisationName: org.name
              }))
            };
          }
        } catch (error) {
          // User might not have access to projects in this org
          console.log(`No project access for org ${org.id}`);
          return null;
        }
      });
      
      const results = await Promise.all(orgProjectPromises);
      
      // Build grouped object
      results.forEach(result => {
        if (result) {
          grouped[result.orgId] = {
            organisationName: result.orgName,
            projects: result.projects
          };
        }
      });
      
      return grouped;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Project Organization Hook (to find which org a project belongs to)
export function useProjectOrganization(projectId: string, organizations: any[]) {
  return useQuery({
    queryKey: ['projects', projectId, 'organization'],
    queryFn: async () => {
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
    enabled: !!projectId && organizations.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes - this doesn't change often
  });
}

// Create Project Mutation
export function useCreateProject(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const response = await mcApiService.post(`/organisations/${orgId}/projects`, data);
      return response.project as Project;
    },
    onSuccess: (newProject) => {
      // Invalidate projects for this organization
      invalidateQueries.projectsByOrg(orgId);
      
      // Also invalidate user projects grouped query
      queryClient.invalidateQueries({ queryKey: ['projects', 'user'] });
      
      toast.success(`Project "${newProject.name}" created successfully`);
    },
    onError: (error: any) => {
      const message = error?.response?.message || 'Failed to create project';
      toast.error(message);
    },
  });
}

// Update Project Mutation
export function useUpdateProject(orgId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProjectData) => {
      const response = await mcApiService.patch(`/organisations/${orgId}/projects/${projectId}`, data);
      return response.project as Project;
    },
    onSuccess: (updatedProject) => {
      // Update cache for specific project
      queryClient.setQueryData(
        queryKeys.projects.detail(projectId),
        updatedProject
      );
      
      // Invalidate projects for this organization
      invalidateQueries.projectsByOrg(orgId);
      
      toast.success(`Project "${updatedProject.name}" updated successfully`);
    },
    onError: (error: any) => {
      const message = error?.response?.message || 'Failed to update project';
      toast.error(message);
    },
  });
}

// Delete Project Mutation
export function useDeleteProject(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      await mcApiService.delete(`/organisations/${orgId}/projects/${projectId}`);
      return projectId;
    },
    onSuccess: (deletedProjectId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(deletedProjectId) });
      
      // Invalidate projects for this organization
      invalidateQueries.projectsByOrg(orgId);
      
      // Also invalidate user projects grouped query
      queryClient.invalidateQueries({ queryKey: ['projects', 'user'] });
      
      toast.success('Project deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.message || 'Failed to delete project';
      toast.error(message);
    },
  });
}

// Hook for optimistic project navigation
export function useProjectNavigation() {
  const queryClient = useQueryClient();

  const prefetchProject = (projectId: string, orgId?: string) => {
    if (!orgId) return; // Can't prefetch without orgId
    
    queryClient.prefetchQuery({
      queryKey: queryKeys.projects.detail(projectId),
      queryFn: async () => {
        const response = await mcApiService.get(`/organisations/${orgId}/projects`);
        const project = response.projects.find((p: any) => p.id === projectId);
        if (project) {
          return project as Project;
        }
        throw new Error('Project not found in organization');
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetchProject };
} 