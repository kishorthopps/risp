import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Create query client with configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.status >= 400 && error?.status < 500 && 
            error?.status !== 408 && error?.status !== 429) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      onError: (error: any) => {
        // Global error handling for mutations
        const message = error?.response?.message || 
                       error?.message || 
                       'An unexpected error occurred';
        console.error('Mutation Error:', error);
        toast.error(message);
      },
    },
  },
});

// Query keys factory for consistent cache management
export const queryKeys = {
  // Authentication
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },

  // Organizations
  organizations: {
    all: ['organizations'] as const,
    user: (userId: string) => [...queryKeys.organizations.all, 'user', userId] as const,
    detail: (orgId: string) => [...queryKeys.organizations.all, 'detail', orgId] as const,
    permissions: (orgId: string) => [...queryKeys.organizations.all, 'permissions', orgId] as const,
    stats: (userId: string) => [...queryKeys.organizations.all, 'stats', userId] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    byOrg: (orgId: string) => [...queryKeys.projects.all, 'organization', orgId] as const,
    byUser: (userId: string) => [...queryKeys.projects.all, 'user', userId] as const,
    grouped: (userId: string) => [...queryKeys.projects.all, 'grouped', userId] as const,
    detail: (projectId: string) => [...queryKeys.projects.all, 'detail', projectId] as const,
    org: (projectId: string) => [...queryKeys.projects.all, 'org', projectId] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    byOrg: (orgId: string) => [...queryKeys.users.all, 'organization', orgId] as const,
    byProject: (orgId: string, projectId: string) => [...queryKeys.users.all, 'project', orgId, projectId] as const,
    detail: (userId: string) => [...queryKeys.users.all, 'detail', userId] as const,
    available: (orgId: string) => [...queryKeys.users.all, 'available', orgId] as const,
    assignments: (orgId: string) => [...queryKeys.users.all, 'assignments', orgId] as const,
    projects: (orgId: string, userId: string) => [...queryKeys.users.all, 'projects', orgId, userId] as const,
  },

  // Roles
  roles: {
    all: ['roles'] as const,
    byOrg: (orgId: string) => [...queryKeys.roles.all, 'organization', orgId] as const,
    detail: (roleId: string) => [...queryKeys.roles.all, 'detail', roleId] as const,
  },

  // Permissions
  permissions: {
    all: ['permissions'] as const,
    byOrg: (orgId: string) => [...queryKeys.permissions.all, 'organization', orgId] as const,
  },

  // Groups
  groups: {
    all: ['groups'] as const,
    byOrg: (orgId: string) => [...queryKeys.groups.all, 'organization', orgId] as const,
    admins: (orgId: string) => [...queryKeys.groups.all, 'admins', orgId] as const,
    assignments: (orgId: string) => [...queryKeys.groups.all, 'assignments', orgId] as const,
  },

  // Assessments
  assessments: {
    all: ['assessments'] as const,
    byProject: (projectId: string) => [...queryKeys.assessments.all, 'project', projectId] as const,
    detail: (assessmentId: string) => [...queryKeys.assessments.all, 'detail', assessmentId] as const,
  },

  // Assessment Assignments
  assignments: {
    all: ['assessment-assignments'] as const,
    byOrg: (orgId: string) => [...queryKeys.assignments.all, 'organization', orgId] as const,
    byProject: (projectId: string) => [...queryKeys.assignments.all, 'project', projectId] as const,
    detail: (assignmentId: string) => [...queryKeys.assignments.all, 'detail', assignmentId] as const,
  },
} as const;

// Helper functions for cache invalidation
export const invalidateQueries = {
  // Auth
  auth: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }),

  // Organizations
  organizations: () => queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all }),
  organizationsByUser: (userId: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.organizations.user(userId) }),
  organizationDetail: (orgId: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(orgId) }),

  // Projects
  projects: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
  projectsByOrg: (orgId: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.byOrg(orgId) }),
  projectsByUser: (userId: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.byUser(userId) }),

  // Users
  users: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  usersByOrg: (orgId: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.users.byOrg(orgId) }),
  usersByProject: (orgId: string, projectId: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.users.byProject(orgId, projectId) }),

  // Roles
  roles: () => queryClient.invalidateQueries({ queryKey: queryKeys.roles.all }),
  rolesByOrg: (orgId: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.roles.byOrg(orgId) }),

  // Groups
  groups: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups.all }),
  groupsByOrg: (orgId: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.byOrg(orgId) }),

  // Assessments
  assessments: () => queryClient.invalidateQueries({ queryKey: queryKeys.assessments.all }),
  assessmentsByProject: (projectId: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.assessments.byProject(projectId) }),

  // Assignments
  assignments: () => queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all }),
  assignmentsByOrg: (orgId: string) => 
    queryClient.invalidateQueries({ queryKey: queryKeys.assignments.byOrg(orgId) }),

  // Clear all cache
  all: () => queryClient.clear(),
}; 