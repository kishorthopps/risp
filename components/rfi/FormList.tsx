import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, useDeleteForm } from "@/hooks/useForms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, FileText, Calendar, Plus, Loader2, Search } from "lucide-react";
import { ProtectedComponent } from "@/components/rbac/ProtectedComponent";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface FormListProps {
    forms: Form[];
    projectId: string;
    organisationId: string;
    isLoading?: boolean;
}

export function FormList({ forms, projectId, organisationId, isLoading }: FormListProps) {
    const router = useRouter();
    const deleteFormMutation = useDeleteForm();

    const [formToDelete, setFormToDelete] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleDeleteClick = (formId: string) => {
        setFormToDelete(formId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!formToDelete) return;
        try {
            await deleteFormMutation.mutateAsync({
                id: formToDelete,
                organisationId,
                projectId
            });
        } catch (error) {
            // handled by hook
        } finally {
            setIsDeleteDialogOpen(false);
            setFormToDelete(null);
        }
    };


    const [searchQuery, setSearchQuery] = useState("");

    const filteredForms = forms.filter(form =>
        form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (forms.length === 0) {
        return (
            <div className="text-center py-16">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Forms yet</h3>
                <p className="text-muted-foreground mb-6">Create your first form to get started</p>
                <ProtectedComponent requiredAction="assessments.create" orgId={organisationId}>
                    <Button
                        onClick={() => router.push(`/form-builder?returnUrl=${encodeURIComponent(`/app/${projectId}/assessments`)}&projectId=${projectId}&organisationId=${organisationId}`)}
                        className="rounded-full px-6 py-3"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Create Form
                    </Button>
                </ProtectedComponent>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search forms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 max-w-md"
                    />
                </div>

                {filteredForms.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No forms found matching "{searchQuery}"</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredForms.map((form) => (
                            <Card
                                key={form.id}
                                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 group"
                                onClick={() => router.push(`/form-preview?formId=${form.id}&returnUrl=${encodeURIComponent(`/app/${projectId}/assessments`)}&projectId=${projectId}&organisationId=${organisationId}`)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0 mr-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant={form.status === 'COMPLETED' ? "default" : "secondary"} className={form.status === 'COMPLETED' ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}>
                                                    {form.status || 'DRAFT'}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                                                {form.title || "Untitled Form"}
                                            </CardTitle>
                                            <CardDescription className="line-clamp-2 mt-1">
                                                {form.description || "No description"}
                                            </CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/form-builder?formId=${form.id}&returnUrl=${encodeURIComponent(`/app/${projectId}/assessments`)}&projectId=${projectId}&organisationId=${organisationId}`);
                                                    }}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(form.id);
                                                    }}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        {/*  We can inspect schema to show fields count if we want, but for now just showing date */}
                                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground w-full flex justify-between">
                                            <span>Created {new Date(form.createdAt).toLocaleDateString()}</span>
                                            {form.createdByUser && <span>By {form.createdByUser.name}</span>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Form?</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this form? This action cannot be undone.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
