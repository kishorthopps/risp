"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mcApiService } from '@/lib/mcApiService';
import { toast } from 'sonner';

export interface Questionnaire {
  id: string;
  slug: string;
  title: string;
  description?: string;
  questionnaire: any; // JSON object
  minSpanDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionnaireData {
  title: string;
  slug: string;
  description?: string;
  questionnaire: any;
  minSpanDays: number;
}

export interface UpdateQuestionnaireData extends Partial<CreateQuestionnaireData> {}

// Hook to get all questionnaires
export const useQuestionnaires = (orgId: string | undefined) => {
  return useQuery<Questionnaire[]>({
    queryKey: ['questionnaires', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID is required');
      
      const response = await mcApiService.get(
        `/organisations/${orgId}/questionnaires`,
        {
          headers: {
            'x-organisation-id': orgId
          }
        }
      );
      
      return response.questionnaires || [];
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get a single questionnaire
export const useQuestionnaire = (orgId: string | undefined, questionnaireId: string | undefined) => {
  return useQuery<Questionnaire>({
    queryKey: ['questionnaire', orgId, questionnaireId],
    queryFn: async () => {
      if (!orgId || !questionnaireId) throw new Error('Organization ID and Questionnaire ID are required');
      
      const response = await mcApiService.get(
        `/organisations/${orgId}/questionnaires/${questionnaireId}`,
        {
          headers: {
            'x-organisation-id': orgId
          }
        }
      );
      
      return response.questionnaire;
    },
    enabled: !!orgId && !!questionnaireId,
  });
};

// Hook to create a questionnaire
export const useCreateQuestionnaire = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orgId, questionnaireData }: { 
      orgId: string; 
      questionnaireData: CreateQuestionnaireData;
    }) => {
      const response = await mcApiService.post(
        `/organisations/${orgId}/questionnaires`,
        questionnaireData,
        {
          headers: {
            'x-organisation-id': orgId
          }
        }
      );
      
      return response.questionnaire;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch questionnaires list
      queryClient.invalidateQueries({ 
        queryKey: ['questionnaires', variables.orgId] 
      });
      toast.success('Questionnaire created successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create questionnaire';
      toast.error(message);
      throw error;
    }
  });
};

// Hook to update a questionnaire
export const useUpdateQuestionnaire = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orgId, 
      questionnaireId, 
      questionnaireData 
    }: { 
      orgId: string; 
      questionnaireId: string;
      questionnaireData: UpdateQuestionnaireData;
    }) => {
      const response = await mcApiService.patch(
        `/organisations/${orgId}/questionnaires/${questionnaireId}`,
        questionnaireData,
        {
          headers: {
            'x-organisation-id': orgId
          }
        }
      );
      
      return response.questionnaire;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch both the list and the specific questionnaire
      queryClient.invalidateQueries({ 
        queryKey: ['questionnaires', variables.orgId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['questionnaire', variables.orgId, variables.questionnaireId] 
      });
      toast.success('Questionnaire updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update questionnaire';
      toast.error(message);
      throw error;
    }
  });
};

// Hook to delete a questionnaire
export const useDeleteQuestionnaire = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orgId, questionnaireId }: { 
      orgId: string; 
      questionnaireId: string;
    }) => {
      await mcApiService.delete(
        `/organisations/${orgId}/questionnaires/${questionnaireId}`,
        {
          headers: {
            'x-organisation-id': orgId
          }
        }
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch questionnaires list
      queryClient.invalidateQueries({ 
        queryKey: ['questionnaires', variables.orgId] 
      });
      // Remove the specific questionnaire from cache
      queryClient.removeQueries({ 
        queryKey: ['questionnaire', variables.orgId, variables.questionnaireId] 
      });
      toast.success('Questionnaire deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete questionnaire';
      toast.error(message);
      throw error;
    }
  });
};

// Export default hook that includes all questionnaire operations
export const useQuestionnaireOperations = (orgId: string | undefined) => {
  const questionnaires = useQuestionnaires(orgId);
  const createMutation = useCreateQuestionnaire();
  const updateMutation = useUpdateQuestionnaire();
  const deleteMutation = useDeleteQuestionnaire();
  
  return {
    // Data
    questionnaires: questionnaires.data || [],
    isLoading: questionnaires.isLoading,
    isError: questionnaires.isError,
    error: questionnaires.error,
    refetch: questionnaires.refetch,
    
    // Mutations
    createQuestionnaire: createMutation.mutateAsync,
    updateQuestionnaire: updateMutation.mutateAsync,
    deleteQuestionnaire: deleteMutation.mutateAsync,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
