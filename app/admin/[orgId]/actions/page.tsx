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
import { useParams, useRouter } from "next/navigation";
import React from "react";

interface Action {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export default function OrganizationActionsPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const [actions, setActions] = useState<Action[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<Action | null>(null);
  const [userSystemRole, setUserSystemRole] = useState<string>("");
  const [newAction, setNewAction] = useState<Omit<Action, "id" | "createdAt">>({
    name: "",
    description: "",
  });

  useEffect(() => {
    const systemRole = localStorage.getItem("systemRole") || "ORG_USER";
    setUserSystemRole(systemRole);
    
    // Redirect if not SuperAdmin
    if (systemRole !== "SUPER_USER") {
      router.push(`/admin/${orgId}/dashboard`);
      return;
    }

    if (orgId) {
      fetchActions(orgId);
    } else {
      toast.error("No organization selected");
    }
  }, [orgId, router]);

  const fetchActions = async (organizationId: string) => {
    try {
      const response = await mcApiService.get(`/organisations/${organizationId}/actions`);
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

    if (!orgId) {
      toast.error("No organization selected");
      return;
    }

    try {
      const action = {
        name: newAction.name,
        description: newAction.description,
      };
      await mcApiService.post(`/organisations/${orgId}/actions`, action);
      toast.success(`Action "${action.name}" created successfully`);
      setIsDialogOpen(false);
      setNewAction({ name: "", description: "" });
      fetchActions(orgId); // Refresh the actions list
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

    if (!orgId || !currentAction) {
      toast.error("No organization or action selected");
      return;
    }

    try {
      const updatedAction = {
        name: newAction.name,
        description: newAction.description,
      };
      await mcApiService.patch(
        `/organisations/${orgId}/actions/${currentAction.id}`,
        updatedAction
      );
      toast.success(`Action "${updatedAction.name}" updated successfully`);
      setIsDialogOpen(false);
      setCurrentAction(null);
      setNewAction({ name: "", description: "" });
      fetchActions(orgId); // Refresh the actions list
    } catch (error) {
      toast.error("Failed to update action");
    }
  };

  const handleDeleteAction = async () => {
    if (!orgId || !currentAction) return;

    try {
      await mcApiService.delete(`/organisations/${orgId}/actions/${currentAction.id}`);
      toast.success(`Action "${currentAction.name}" deleted successfully`);
      setIsDeleteDialogOpen(false);
      setCurrentAction(null);
      fetchActions(orgId); // Refresh the actions list
    } catch (error) {
      toast.error("Failed to delete action");
    }
  };

  // Access control check
  if (userSystemRole !== "SUPER_USER") {
    return (
      <div className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            SuperAdmin role required to access this page.
          </p>
        </div>
      </div>
    );
  }

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
                className="text-red-600"
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Actions</h1>
          <p className="text-muted-foreground">SuperAdmin only - System level actions</p>
        </div>
        <Button
          onClick={() => {
            setCurrentAction(null);
            setNewAction({ name: "", description: "" });
            setIsDialogOpen(true);
          }}
          className="rounded-full px-6 py-3"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Action
        </Button>
      </div>

      <DataTable columns={columns} data={actions} />

      {/* Add/Edit Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentAction ? "Edit Action" : "Add Action"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Action Name"
              value={newAction.name}
              onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
            />
            <Textarea
              placeholder="Action Description"
              value={newAction.description}
              onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={currentAction ? handleUpdateAction : handleAddAction}>
              {currentAction ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Action Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{currentAction?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
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