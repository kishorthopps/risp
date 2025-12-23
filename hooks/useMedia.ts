import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { mcApiService } from "@/lib/mcApiService";

export interface Media {
    id: string;
    filename: string;
    path: string;
    mimetype: string;
    size: number;
    type: 'IMAGE' | 'VIDEOCALL' | 'VIDEO' | 'FILE';
    formId: string;
    projectId: string;
    createdAt: string;
    form?: {
        title: string;
    }
}

export const useFormMedia = (formId: string) => {
    return useQuery({
        queryKey: ["media", "form", formId],
        queryFn: async (): Promise<Media[]> => {
            return mcApiService.get(`/media/form/${formId}`);
        },
        enabled: !!formId,
    });
};

export const useProjectMedia = (projectId: string) => {
    return useQuery({
        queryKey: ["media", "project", projectId],
        queryFn: async (): Promise<Media[]> => {
            return mcApiService.get(`/media/project/${projectId}`);
        },
        enabled: !!projectId,
    });
};

export const useDeleteMedia = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id }: { id: string, formId?: string }) => {
            return mcApiService.delete(`/media/${id}`);
        },
        onSuccess: (_, variables) => {
            // Invalidate form media query if formId is present (it should be)
            if (variables.formId) {
                queryClient.invalidateQueries({ queryKey: ["media", "form", variables.formId] });
            }
            // Also invalidate project media just in case
            queryClient.invalidateQueries({ queryKey: ["media", "project"] });
        },
    });
};
