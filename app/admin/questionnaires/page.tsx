"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuestionnaireOperations } from "@/hooks/useQuestionnaires";
import { ProtectedComponent } from "@/components/rbac/ProtectedComponent";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  ArrowUpDown,
  FileText 
} from "lucide-react";
import { toast } from "sonner";

interface Questionnaire {
  id: string;
  slug: string;
  title: string;
  description?: string;
  questionnaire: any;
  minSpanDays: number;
  createdAt: string;
  updatedAt: string;
}

export default function QuestionnairesPage() {
  const { user, organizations } = useAuth();
  
  // For now, use the first organization or require organization selection
  // You might want to add organization selection later
  const currentOrgId = organizations[0]?.id;
  
  const {
    questionnaires,
    isLoading,
    refetch,
    createQuestionnaire,
    updateQuestionnaire,
    deleteQuestionnaire,
    isCreating,
    isUpdating,
    isDeleting,
  } = useQuestionnaireOperations(currentOrgId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentQuestionnaire, setCurrentQuestionnaire] = useState<Questionnaire | null>(null);
  const [newQuestionnaire, setNewQuestionnaire] = useState({
    title: "",
    slug: "",
    description: "",
    questionnaire: "",
    minSpanDays: 15,
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [questionnaireToDelete, setQuestionnaireToDelete] = useState<string | null>(null);

  const handleEditQuestionnaire = (questionnaire: Questionnaire) => {
    setCurrentQuestionnaire(questionnaire);
    setNewQuestionnaire({
      title: questionnaire.title,
      slug: questionnaire.slug,
      description: questionnaire.description || "",
      questionnaire: JSON.stringify(questionnaire.questionnaire, null, 2),
      minSpanDays: questionnaire.minSpanDays,
    });
    setIsDialogOpen(true);
  };

  const handleSaveQuestionnaire = async () => {
    if (!newQuestionnaire.title.trim() || !newQuestionnaire.slug.trim()) {
      toast.error("Title and Questionnaire Access Code are required");
      return;
    }

    if (!currentOrgId) {
      toast.error("Organisation context required");
      return;
    }

    try {
      let questionnaireData: any;
      try {
        questionnaireData = newQuestionnaire.questionnaire 
          ? JSON.parse(newQuestionnaire.questionnaire) 
          : {};
      } catch {
        toast.error("Invalid JSON format in questionnaire field");
        return;
      }

      const formattedQuestionnaire = {
        ...newQuestionnaire,
        questionnaire: questionnaireData,
      };

      if (currentQuestionnaire) {
        await updateQuestionnaire({
          orgId: currentOrgId,
          questionnaireId: currentQuestionnaire.id,
          questionnaireData: formattedQuestionnaire,
        });
      } else {
        await createQuestionnaire({
          orgId: currentOrgId,
          questionnaireData: formattedQuestionnaire,
        });
      }
      
      setIsDialogOpen(false);
      setCurrentQuestionnaire(null);
      setNewQuestionnaire({ 
        title: "", 
        slug: "", 
        description: "", 
        questionnaire: "", 
        minSpanDays: 15 
      });
      refetch();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const confirmDeleteQuestionnaire = (id: string) => {
    setQuestionnaireToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!questionnaireToDelete || !currentOrgId) return;
    
    try {
      await deleteQuestionnaire({
        orgId: currentOrgId,
        questionnaireId: questionnaireToDelete,
      });
      refetch();
    } catch (error) {
      // Error handling is done in the mutation hook
    } finally {
      setIsDeleteDialogOpen(false);
      setQuestionnaireToDelete(null);
    }
  };

  const columns: ColumnDef<Questionnaire>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "slug",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Questionnaire Access Code
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ getValue }) => {
        const description = getValue() as string;
        return (
          <div className="max-w-xs truncate">
            {description || "No description"}
          </div>
        );
      },
    },
    {
      accessorKey: "minSpanDays",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Min Span Days
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const questionnaire = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <ProtectedComponent 
                requiredAction="questionnaires.update"
                orgId={currentOrgId}
              >
                <DropdownMenuItem
                  onClick={() => handleEditQuestionnaire(questionnaire)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </ProtectedComponent>
              <ProtectedComponent 
                requiredAction="questionnaires.delete"
                orgId={currentOrgId}
              >
                <DropdownMenuItem
                  onClick={() => confirmDeleteQuestionnaire(questionnaire.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </ProtectedComponent>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (!currentOrgId) {
    return (
      <div className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="text-center py-10">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No Organization</h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to be part of an organization to manage questionnaires.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 mx-auto max-w-7xl">
      <div className="h-10"></div>
      
      <ProtectedComponent 
        requiredActions={["questionnaires.list", "questionnaires.read"]}
        orgId={currentOrgId}
        fallback={
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have permission to access questionnaire management.
            </p>
          </div>
        }
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Questionnaires</h1>
          <ProtectedComponent 
            requiredAction="questionnaires.create"
            orgId={currentOrgId}
          >
            <Button
              onClick={() => {
                setCurrentQuestionnaire(null);
                setNewQuestionnaire({ 
                  title: "", 
                  slug: "", 
                  description: "", 
                  questionnaire: "", 
                  minSpanDays: 15 
                });
                setIsDialogOpen(true);
              }}
              className="rounded-full px-6 py-3"
              disabled={isCreating}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Questionnaire
            </Button>
          </ProtectedComponent>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded"></div>
            <div className="h-96 bg-muted animate-pulse rounded"></div>
          </div>
        ) : (
          <DataTable columns={columns} data={questionnaires || []} />
        )}
      </ProtectedComponent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentQuestionnaire ? "Edit Questionnaire" : "Add Questionnaire"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title *"
              value={newQuestionnaire.title}
              onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, title: e.target.value })}
            />
            <Input
              placeholder="Questionnaire Access Code * (e.g., KINDL717)"
              value={newQuestionnaire.slug}
              onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, slug: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={newQuestionnaire.description}
              onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, description: e.target.value })}
              rows={4}
            />
            <div>
              <label className="block text-sm font-medium mb-2">Min Span Days *</label>
              <Input
                type="number"
                min="1"
                placeholder="15"
                value={newQuestionnaire.minSpanDays}
                onChange={(e) => setNewQuestionnaire({ 
                  ...newQuestionnaire, 
                  minSpanDays: parseInt(e.target.value) || 15 
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Questionnaire JSON
              </label>
              <Textarea
                placeholder='{"questions": [{"id": 1, "text": "How are you feeling?", "type": "text"}]}'
                value={newQuestionnaire.questionnaire}
                onChange={(e) => setNewQuestionnaire({ 
                  ...newQuestionnaire, 
                  questionnaire: e.target.value 
                })}
                rows={3}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveQuestionnaire}
              disabled={isCreating || isUpdating}
            >
              {(isCreating || isUpdating) && "Saving..."}
              {!isCreating && !isUpdating && (currentQuestionnaire ? "Save Changes" : "Add Questionnaire")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this questionnaire? This action cannot be undone.</p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
