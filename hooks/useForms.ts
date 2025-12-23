"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mcApiService } from '@/lib/mcApiService';
import { toast } from 'sonner';
import { FormStatus } from '@/types/form';

export interface Form {
    id: string;
    title: string;
    description?: string;
    status: FormStatus;
    schema: any; // JSON object
    createdAt: string;
    updatedAt: string;
    organisationId: string;
    projectId: string;
    createdBy: string;
    createdByUser?: {
        id: string;
        name: string;
        email: string;
    };
}

export interface CreateFormData {
    title: string;
    description?: string;
    status: FormStatus;
    schema: any;
    organisationId: string;
    projectId: string;
}

export interface UpdateFormData extends Partial<Omit<CreateFormData, 'organisationId' | 'projectId'>> { }

// Hook to get all forms
export const useForms = (organisationId: string | undefined, projectId: string | undefined, hasMedia?: boolean) => {
    return useQuery<Form[]>({
        queryKey: ['forms', organisationId, projectId, hasMedia],
        queryFn: async () => {
            if (!organisationId || !projectId) throw new Error('Organisation ID and Project ID are required');

            const response = await mcApiService.get(
                `/forms?organisationId=${organisationId}&projectId=${projectId}${hasMedia ? '&hasMedia=true' : ''}`,
                {
                    headers: {
                        'x-organisation-id': organisationId
                    }
                }
            );

            return response || [];
        },
        enabled: !!organisationId && !!projectId,
        staleTime: 5 * 60 * 1000,
    });
};

// Hook to get a single form
export const useForm = (id: string | undefined, organisationId: string | undefined) => {
    return useQuery<Form>({
        queryKey: ['form', id],
        queryFn: async () => {
            if (!id || !organisationId) throw new Error('Form ID and Organisation ID are required');

            const response = await mcApiService.get(
                `/forms/${id}`,
                {
                    headers: {
                        'x-organisation-id': organisationId
                    }
                }
            );

            return response;
        },
        enabled: !!id && !!organisationId,
    });
};

// Hook to create a form
export const useCreateForm = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: CreateFormData) => {
            const response = await mcApiService.post(
                `/forms`,
                formData,
                {
                    headers: {
                        'x-organisation-id': formData.organisationId
                    }
                }
            );
            return response;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['forms', variables.organisationId, variables.projectId]
            });
            toast.success('Form created successfully');
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to create form';
            toast.error(message);
            throw error;
        }
    });
};

// Hook to update a form
export const useUpdateForm = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data,
            organisationId,
            projectId
        }: {
            id: string;
            data: UpdateFormData;
            organisationId: string;
            projectId: string;
        }) => {
            const response = await mcApiService.patch(
                `/forms/${id}`,
                data,
                {
                    headers: {
                        'x-organisation-id': organisationId
                    }
                }
            );
            return response;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['forms', variables.organisationId, variables.projectId]
            });
            queryClient.invalidateQueries({
                queryKey: ['form', variables.id]
            });
            toast.success('Form updated successfully');
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to update form';
            toast.error(message);
            throw error;
        }
    });
};

// Hook to delete a form
export const useDeleteForm = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            organisationId,
            projectId
        }: {
            id: string;
            organisationId: string;
            projectId: string;
        }) => {
            await mcApiService.delete(
                `/forms/${id}`,
                {
                    headers: {
                        'x-organisation-id': organisationId
                    }
                }
            );
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['forms', variables.organisationId, variables.projectId]
            });
            toast.success('Form deleted successfully');
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to delete form';
            toast.error(message);
            throw error;
        }
    });
};
