"use client";

import { use } from "react";
import { useAuth, useProjectOrg } from "@/hooks/useAuth";
import { useProject } from "@/hooks/useProjects";
import { useForm } from "@/hooks/useForms";
import { useFormMedia, useDeleteMedia } from "@/hooks/useMedia";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileVideo, FileText, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function FormMediaPage({ params }: { params: Promise<{ projectId: string; formId: string }> }) {
    const { projectId, formId } = use(params);
    const { user } = useAuth();
    const { orgId: currentOrgId } = useProjectOrg(projectId);
    const router = useRouter();

    const { data: projectData } = useProject(projectId, currentOrgId || undefined);
    const { data: form, isLoading: formLoading } = useForm(formId, currentOrgId || undefined);
    const { data: mediaFiles, isLoading: mediaLoading } = useFormMedia(formId);
    const deleteMedia = useDeleteMedia();

    const onConfirmDelete = async (id: string) => {
        try {
            await deleteMedia.mutateAsync({ id, formId });
            toast.success("Media deleted successfully");
        } catch (error) {
            console.error("Failed to delete media:", error);
            toast.error("Failed to delete media");
        }
    };


    const isLoading = formLoading || mediaLoading;

    if (isLoading) {
        return (
            <div className="p-4 md:p-10 mx-auto max-w-7xl">
                <div className="space-y-4">
                    <div className="h-8 w-1/4 bg-muted animate-pulse rounded"></div>
                    <div className="h-96 bg-muted animate-pulse rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-10 mx-auto max-w-[1440px]">
            <div className="h-10"></div>

            <Button
                variant="ghost"
                className="mb-4 pl-0 hover:bg-transparent hover:text-primary_orange"
                onClick={() => router.back()}
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Gallery
            </Button>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">{form?.title || "Form Media"}</h1>
                    <p className="text-muted-foreground mt-2">
                        Viewing media for {projectData?.name}
                    </p>
                </div>
            </div>

            {!mediaFiles || mediaFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-md bg-gray-50">
                    <FileVideo className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <h3 className="text-lg font-medium text-gray-900">No media found</h3>
                    <p>This form does not have any recorded or uploaded media.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mediaFiles.map((file) => (
                        <div key={file.id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="aspect-video bg-gray-100 relative group">
                                {file.type === 'VIDEOCALL' || file.type === 'VIDEO' ? (
                                    <video src={file.path} className="w-full h-full object-cover" controls playsInline />
                                ) : file.type === 'IMAGE' ? (
                                    <img src={file.path} alt={file.filename} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FileText className="h-12 w-12 text-gray-400" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <span className="text-xs text-white bg-black/60 px-2 py-1 rounded capitalize">
                                        {file.type.toLowerCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3">
                                <h4 className="font-medium truncate" title={file.filename}>
                                    {file.filename}
                                </h4>
                                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                    <span>{(file.size ? file.size / 1024 / 1024 : 0).toFixed(1)} MB</span>
                                </div>
                                <div className="mt-3 flex justify-end gap-2">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                disabled={deleteMedia.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the video recording from our servers.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onConfirmDelete(file.id)} className="bg-red-600 hover:bg-red-700">
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <Button variant="secondary" size="sm" asChild>
                                        <a href={file.path} target="_blank" rel="noopener noreferrer">View</a>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
