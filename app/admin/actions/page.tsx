"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Edit, Trash2, ArrowUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { mcApiService } from "@/lib/mcApiService";
import { useRouter } from "next/navigation";
import React from "react";
import { RouteGuard } from "@/components/rbac/RouteGuard";
import { useAuth } from "@/hooks/useAuth";

interface Action {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

function GlobalActionsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<Action | null>(null);
  const [newAction, setNewAction] = useState<Omit<Action, "id" | "createdAt">>({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const response = await mcApiService.get("/actions");
      setActions(response.actions);
    } catch (error) {
      toast.error("Failed to fetch actions");
    }
  };

  const handleAddAction = async () => {
    if (!newAction.name.trim() || !newAction.description.trim()) {
      toast.error("Both name and description are required");
      return;
    }

    try {
      const action = {
        name: newAction.name,
        description: newAction.description,
      };
      await mcApiService.post("/actions", action);
      toast.success(`Action "${action.name}" created successfully`);
      setIsDialogOpen(false);
      setNewAction({ name: "", description: "" });
      fetchActions(); // Refresh the actions list
    } catch (error) {
      toast.error("Failed to create action");
    }
  };

  const handleEditAction = (action: Action) => {
    setCurrentAction(action);
    setNewAction({ name: action.name, description: action.description });
    setIsDialogOpen(true);
  };

  const handleUpdateAction = async () => {
    if (!newAction.name.trim() || !newAction.description.trim()) {
      toast.error("Both name and description are required");
      return;
    }

    if (!currentAction) {
      toast.error("No action selected");
      return;
    }

    try {
      const updatedAction = {
        name: newAction.name,
        description: newAction.description,
      };
      await mcApiService.patch(`/actions/${currentAction.id}`, updatedAction);
      toast.success(`Action "${updatedAction.name}" updated successfully`);
      setIsDialogOpen(false);
      setCurrentAction(null);
      setNewAction({ name: "", description: "" });
      fetchActions(); // Refresh the actions list
    } catch (error) {
      toast.error("Failed to update action");
    }
  };

  const handleDeleteAction = async () => {
    if (!currentAction) return;

    try {
      await mcApiService.delete(`/actions/${currentAction.id}`);
      toast.success(`Action "${currentAction.name}" deleted successfully`);
      setIsDeleteDialogOpen(false);
      setCurrentAction(null);
      fetchActions(); // Refresh the actions list
    } catch (error) {
      toast.error("Failed to delete action");
    }
  };

  const columns: ColumnDef<Action>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return date.toLocaleDateString();
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: Action } }) => {
        const action = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditAction(action)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setCurrentAction(action);
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="p-4 md:p-10 mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Global Actions Management</h1>
        <p className="text-muted-foreground">
          Manage system-wide actions and permissions. Only accessible to Super Users.
        </p>
      </div>

      <div className="mb-6">
        <Button onClick={() => setIsDialogOpen(true)} className="mb-4">
          <Plus className="mr-2 h-4 w-4" />
          Add Action
        </Button>
      </div>

      <DataTable columns={columns} data={actions} />

      {/* Add/Edit Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentAction ? "Edit Action" : "Add New Action"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                value={newAction.name}
                onChange={(e) =>
                  setNewAction({ ...newAction, name: e.target.value })
                }
                placeholder="Enter action name"
              />
            </div>
            <div>
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={newAction.description}
                onChange={(e) =>
                  setNewAction({ ...newAction, description: e.target.value })
                }
                placeholder="Enter action description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setCurrentAction(null);
                setNewAction({ name: "", description: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={currentAction ? handleUpdateAction : handleAddAction}
            >
              {currentAction ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the action "{currentAction?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setCurrentAction(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAction}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GlobalActionsPage() {
  return (
    <RouteGuard 
      requiredSystemRole="SUPER_USER"
      redirectTo="/admin/organisations"
    >
      <GlobalActionsPageContent />
    </RouteGuard>
  );
} 