import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mcApiService } from '@/lib/mcApiService';
import type { 
  AssessmentSchedule, 
  AssessmentInstance, 
  AssessmentAssignment, 
  GroupAssignmentReportResponse,
  User, 
  Group,
  CreateAssessmentData,
  UpdateAssessmentScheduleData,
  UpdateAssessmentInstanceData,
  Assessment
} from '@/lib/types';

// Assessment Schedules Hook
export function useAssessments(projectId: string, orgId: string) {
  return useQuery({
    queryKey: ['assessment-schedules', 'project', projectId],
    queryFn: async () => {
      const url = `/organisations/project/${projectId}/assessments`;
      
      const response = await mcApiService.get(url, {
        headers: {
          'x-organisation-id': orgId
        }
      });
      
      // The API returns assessmentInstances, not assessments
      const schedules = response.assessmentSchedules as AssessmentSchedule[];
      
      // Normalize the data - copy assessmentInstances to assessments for compatibility
      const normalizedSchedules = schedules.map(schedule => ({
        ...schedule,
        assessments: schedule.assessmentInstances || schedule.assessments || []
      }));
      
      return normalizedSchedules;
    },
    enabled: !!projectId && !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Single Assessment Schedule Hook
export function useAssessment(projectId: string, assessmentId: string, orgId: string) {
  return useQuery({
    queryKey: ['assessments', 'detail', assessmentId],
    queryFn: async () => {
      const response = await mcApiService.get(
        `/organisations/project/${projectId}/assessments/${assessmentId}`,
        {
          headers: {
            'x-organisation-id': orgId
          }
        }
      );
      // Response only contains assessmentSchedule now
      return response.assessmentSchedule as AssessmentSchedule;
    },
    enabled: !!projectId && !!assessmentId && !!orgId,
  });
}

export function useMyAssignments(orgId: string, projectId: string) {
  return useQuery({
    queryKey: ['my-assignments', 'organization', orgId, 'project', projectId],
    queryFn: async () => {
      const response = await mcApiService.get(
        `/organisations/${orgId}/projects/${projectId}/my-assignments`
      );
      // The backend now provides both started assignments and available assessments
      return response.assignments as AssessmentAssignment[];
    },
    enabled: !!orgId && !!projectId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Assessment Assignments Hook
export function useAssessmentAssignments(
  orgId: string, 
  projectId: string, 
  filters?: { groupId?: string; assessmentId?: string; userId?: string }
) {
  return useQuery({
    queryKey: ['assessment-assignments', 'organization', orgId, 'project', projectId, filters],
    queryFn: async () => {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (projectId) queryParams.append('projectId', projectId);
      if (filters?.groupId) queryParams.append('groupId', filters.groupId);
      if (filters?.assessmentId) queryParams.append('assessmentId', filters.assessmentId);
      if (filters?.userId) queryParams.append('userId', filters.userId);
      
      const queryString = queryParams.toString();
      const assignmentsUrl = `/organisations/${orgId}/assessment-assignments${queryString ? `?${queryString}` : ''}`;

      // Since the backend now provides all needed data directly, we just need to call it
      const assignmentsResponse = await mcApiService.get(assignmentsUrl);
      
      return assignmentsResponse.assignments as AssessmentAssignment[];
    },
    enabled: !!orgId && !!projectId && !!filters?.assessmentId, // Only fetch when assessmentId is provided
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Group Assignment Report Hook - for group level reports
export function useGroupAssignmentReport(
  orgId: string, 
  projectId: string, 
  groupId: string
) {
  return useQuery({
    queryKey: ['group-assignment-report', 'organization', orgId, 'project', projectId, 'group', groupId],
    queryFn: async () => {
      const reportUrl = `/organisations/${orgId}/groups/${groupId}/assignment-report`;
      const response = await mcApiService.get(reportUrl);
      return response as GroupAssignmentReportResponse;
    },
    enabled: !!orgId && !!projectId && !!groupId,
    staleTime: 1 * 60 * 1000, // 1 minute,
  });
}

// Users for Assignments Hook
export function useUsersForAssignments(orgId: string) {
  return useQuery({
    queryKey: ['users', 'assignments', orgId],
    queryFn: async () => {
      const response = await mcApiService.get(`/organisations/${orgId}/project-group-users`);
      return response.users as User[];
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Groups for Assignments Hook
export function useGroupsForAssignments(orgId: string) {
  return useQuery({
    queryKey: ['groups', 'assignments', orgId],
    queryFn: async () => {
      const response = await mcApiService.get(`/organisations/${orgId}/assessment-groups`);
      return response.groups as Group[];
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Start Assessment Hook
export function useStartAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orgId, 
      projectId, 
      assessmentInstanceId,
      userId
    }: { 
      orgId: string; 
      projectId: string;
      assessmentInstanceId: string;
      userId?: string; // Optional - if provided, starts assessment for this user (must be alternate contact)
    }) => {
      const requestBody: any = { 
        assessmentInstanceId
      };
      
      // Include userId if provided (for alternate contact scenario)
      if (userId) {
        requestBody.userId = userId;
      }
      
      const response = await mcApiService.post(
        `/organisations/${orgId}/projects/${projectId}/start-assessment`,
        requestBody
      );
      return response;
    },
    onSuccess: (_, { orgId, projectId }) => {
      toast.success("Assessment started successfully!");
      queryClient.invalidateQueries({ queryKey: ['assessment-assignments', 'organization', orgId, 'project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['my-assignments', 'organization', orgId, 'project', projectId] });
    },
    onError: () => {
      toast.error("Failed to start assessment");
    },
  });
}

// Create Assessment Assignment
export function useCreateAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      projectId, 
      orgId,
      assessmentData 
    }: { 
      projectId: string; 
      orgId: string;
      assessmentData: CreateAssessmentData;
    }) => {
      const response = await mcApiService.post(
        `/organisations/project/${projectId}/assessments`,
        assessmentData,
        {
          headers: {
            'x-organisation-id': orgId
          }
        }
      );
      return response;
    },
    onSuccess: (_, { projectId }) => {
      toast.success("Assessment schedule created successfully!");
      queryClient.invalidateQueries({ queryKey: ['assessment-schedules', 'project', projectId] });
    },
    onError: () => {
      toast.error("Failed to create assessment schedule");
    },
  });
}

// Update Assessment Schedule or Instance
export function useUpdateAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      projectId, 
      assessmentId, 
      orgId,
      assessmentData 
    }: { 
      projectId: string; 
      assessmentId: string;
      orgId: string;
      assessmentData: UpdateAssessmentScheduleData | UpdateAssessmentInstanceData;
    }) => {
      const response = await mcApiService.patch(
        `/organisations/project/${projectId}/assessments/${assessmentId}`,
        assessmentData,
        {
          headers: {
            'x-organisation-id': orgId
          }
        }
      );
      return response;
    },
    onSuccess: (response, { projectId, assessmentId }) => {
      // Determine the type of update based on response message
      const message = response?.message || "";
      const assignmentCount = response?.assignmentCount;
      
      let toastMessage = "Assessment updated successfully!";
      
      if (message.includes("assignments preserved")) {
        toastMessage = `Assessment dates updated successfully! ${assignmentCount ? `(${assignmentCount} assignment${assignmentCount > 1 ? 's' : ''} preserved)` : '(assignments preserved)'}`;
      } else if (message.includes("Assessment schedule updated")) {
        toastMessage = "Assessment schedule updated successfully!";
      } else if (message.includes("Assessment instance updated")) {
        if (assignmentCount && assignmentCount > 0) {
          toastMessage = `Assessment dates updated successfully! (${assignmentCount} assignment${assignmentCount > 1 ? 's' : ''} preserved)`;
        } else {
          toastMessage = "Assessment dates updated successfully!";
        }
      }
      
      toast.success(toastMessage);
      queryClient.invalidateQueries({ queryKey: ['assessment-schedules', 'project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['assessments', 'detail', assessmentId] });
    },
    onError: (error: any) => {
      // Enhanced error handling with specific messages
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update assessment";
      const errorCode = error?.response?.data?.code;
      
      if (errorCode === "GROUPS_HAVE_ASSIGNMENTS" || errorMessage.includes("Cannot remove groups with existing student assignments")) {
        toast.error("Cannot remove groups with active student assignments.", {
          duration: 6000,
        });
      } else if (errorMessage.includes("Cannot delete assessment instances with existing assignments")) {
        toast.error("Cannot remove assessment periods that have active assignments. You can still update their dates.", {
          duration: 5000,
        });
      } else if (errorMessage.includes("Cannot change questionnaire: Assessment assignments already exist")) {
        toast.error("Cannot change questionnaire when student assignments exist.", {
          duration: 6000,
        });
      } else if (errorMessage.includes("Assessment must span at least")) {
        toast.error(errorMessage, {
          duration: 4000,
        });
      } else if (errorMessage.includes("endDate must be after startDate")) {
        toast.error("End date must be after start date");
      } else if (errorMessage.includes("Invalid date format")) {
        toast.error("Please enter valid dates");
      } else {
        toast.error(errorMessage);
      }
    },
  });
}

// Delete Assessment Schedule or Instance
export function useDeleteAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      projectId, 
      assessmentId,
      orgId
    }: { 
      projectId: string; 
      assessmentId: string;
      orgId: string;
    }) => {
      const response = await mcApiService.delete(
        `/organisations/project/${projectId}/assessments/${assessmentId}`,
        {
          headers: {
            'x-organisation-id': orgId
          }
        }
      );
      return response;
    },
    onSuccess: (_, { projectId }) => {
      toast.success("Assessment deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['assessment-schedules', 'project', projectId] });
    },
    onError: (error: any) => {
      // Enhanced error handling for deletion restrictions
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete assessment";
      const errorCode = error?.response?.data?.code;
      
      if (errorCode === "ASSIGNMENTS_EXIST" || errorMessage.includes("assignments exist")) {
        toast.error("Cannot delete assessment - student assignments in progress or completed exist.", {
          duration: 6000,
        });
      } else if (errorMessage.includes("not found")) {
        toast.error("Assessment not found or already deleted");
      } else {
        toast.error(errorMessage);
      }
    },
  });
}

// Create Assessment Assignment
export function useCreateAssessmentAssignment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orgId, 
      assignmentData 
    }: { 
      orgId: string; 
      assignmentData: {
        userId?: string;
        groupId?: string;
        submittedAt: string;
        submittedBy: string;
        status: string;
        responses: any;
        report: any;
        assessmentId: string;
      }
    }) => {
      const response = await mcApiService.post(
        `/organisations/${orgId}/assessment-assignments`,
        assignmentData
      );
      return response;
    },
    onSuccess: (_, { orgId }) => {
      toast.success("Assessment assignment created successfully!");
      queryClient.invalidateQueries({ queryKey: ['assessment-assignments', 'organization', orgId] });
    },
    onError: () => {
      toast.error("Failed to create assessment assignment");
    },
  });
}

// Update Assessment Assignment
export function useUpdateAssessmentAssignment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orgId, 
      assignmentId, 
      updateData 
    }: { 
      orgId: string; 
      assignmentId: string;
      updateData: {
        status?: string;
        accessSecret?: string;
        accessCode?: string;
      }
    }) => {
      const response = await mcApiService.patch(
        `/organisations/${orgId}/assessment-assignments/${assignmentId}`,
        updateData
      );
      return response;
    },
    onSuccess: (_, { orgId }) => {
      toast.success("Assignment updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['assessment-assignments', 'organization', orgId] });
    },
    onError: () => {
      toast.error("Failed to update assignment");
    },
  });
}

// Delete Assessment Assignment
export function useDeleteAssessmentAssignment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orgId, 
      assignmentId 
    }: { 
      orgId: string; 
      assignmentId: string 
    }) => {
      const response = await mcApiService.delete(
        `/organisations/${orgId}/assessment-assignments/${assignmentId}`
      );
      return response;
    },
    onSuccess: (_, { orgId }) => {
      toast.success("Assessment assignment deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['assessment-assignments', 'organization', orgId] });
    },
    onError: () => {
      toast.error("Failed to delete assessment assignment");
    },
  });
}

// School Assignment Report Hook
export function useSchoolAssignmentReport(orgId: string, projectId: string) {
  return useQuery({
    queryKey: ['school-assignment-report', orgId, projectId],
    queryFn: async (): Promise<GroupAssignmentReportResponse> => {
      const response = await mcApiService.get(
        `/organisations/${orgId}/projects/${projectId}/school-assignment-report`,
        {
          headers: {
            'x-organisation-id': orgId
          }
        }
      );
      return response;
    },
    enabled: !!orgId && !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
} 