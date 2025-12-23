"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Edit, Trash2, ArrowUpDown, Search } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { mcApiService } from "@/lib/mcApiService";
import { useParams } from "next/navigation";
import React from "react";

interface Permission {
  id: string;
  name: string;
  description: string;
  organisationId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface Action {
  id: string;
  name: string;
  description: string;
  organisationId: string | null;
  extras: any;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface ActionMap {
  [name: string]: Action;
}

export default function OrganizationPermissionsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [availableActions, setAvailableActions] = useState<Action[]>([]);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [actionSearchTerm, setActionSearchTerm] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<Permission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMap, setActionMap] = useState<ActionMap>({});
  const [newPermission, setNewPermission] = useState<Omit<Permission, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "organisationId">>({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (orgId) {
      fetchPermissions(orgId);
      fetchAvailableActions(orgId);
    } else {
      toast.error("No organization selected");
    }
  }, [orgId]);

  const fetchPermissions = async (organizationId: string) => {
    try {
      const response = await mcApiService.get(`/organisations/${organizationId}/permissions`);
      if (response.permissions) {
        setPermissions(response.permissions);
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      toast.error("Failed to fetch permissions");
    }
  };

  const fetchAvailableActions = async (organizationId: string) => {
    try {
      const response = await mcApiService.get(`/organisations/${organizationId}/actions`);
      if (response.actions) {
        // Create a map of action names to action objects
        const actionMapTemp: ActionMap = {};
        response.actions.forEach((action: Action) => {
          actionMapTemp[action.name] = action;
        });
        setActionMap(actionMapTemp);
        
        // Sort actions by name
        const sortedActions = response.actions.sort((a: Action, b: Action) => 
          a.name.localeCompare(b.name)
        );
        setAvailableActions(sortedActions);
      }
    } catch (error) {
      console.error("Failed to fetch available actions:", error);
      toast.error("Failed to fetch available actions");
    }
  };

  const fetchPermissionActions = async (permissionId: string): Promise<string[]> => {
    try {
      const response = await mcApiService.get(`/organisations/${orgId}/permissions/${permissionId}/actions`);
      // Map the action objects to their names since that's what we use for selection
      return response.actions?.map((action: Action) => action.name) || [];
    } catch (error) {
      console.error("Failed to fetch permission actions:", error);
      toast.error("Failed to fetch permission actions");
      return [];
    }
  };

  const handleAddPermission = async () => {
    if (!newPermission.name.trim() || !newPermission.description.trim()) {
      toast.error("Both name and description are required");
      return;
    }

    if (!orgId) {
      toast.error("No organization selected");
      return;
    }

    setIsLoading(true);
    try {
      const permission = {
        name: newPermission.name,
        description: newPermission.description,
      };
      
      // Create the permission first
      const response = await mcApiService.post(`/organisations/${orgId}/permissions`, permission);
      const permissionId = response.permission.id;
      
      // Add actions to the permission if any are selected
      if (selectedActionIds.length > 0) {
        // Convert action names to IDs
        const actionIdsToAdd = selectedActionIds
          .map(name => actionMap[name]?.id)
          .filter(id => id) as string[];

        await mcApiService.post(`/organisations/${orgId}/permissions/${permissionId}/actions`, {
          actionIds: actionIdsToAdd
        });
      }
      
      toast.success(`Permission "${permission.name}" created successfully`);
      handleDialogClose();
      fetchPermissions(orgId); // Refresh the permissions list
    } catch (error) {
      console.error("Failed to create permission:", error);
      toast.error("Failed to create permission");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPermission = async (permission: Permission) => {
    setIsLoading(true);
    try {
      setCurrentPermission(permission);
      setNewPermission({ 
        name: permission.name, 
        description: permission.description || "" 
      });
      
      // Fetch the actions for this permission
      const actionNames = await fetchPermissionActions(permission.id);
      setSelectedActionIds(actionNames);
      setActionSearchTerm(""); // Reset search when opening edit dialog
      
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to load permission actions:", error);
      toast.error("Failed to load permission actions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePermission = async () => {
    if (!newPermission.name.trim() || !newPermission.description.trim()) {
      toast.error("Both name and description are required");
      return;
    }

    if (!orgId || !currentPermission) {
      toast.error("No organization or permission selected");
      return;
    }

    setIsLoading(true);
    try {
      const updatedPermission = {
        name: newPermission.name,
        description: newPermission.description,
      };
      
      // Update the permission
      await mcApiService.patch(
        `/organisations/${orgId}/permissions/${currentPermission.id}`,
        updatedPermission
      );
      
      // Get current permission actions
      const currentActionNames = await fetchPermissionActions(currentPermission.id);
      
      // Find actions to add and remove (using names)
      const actionsToAdd = selectedActionIds.filter(name => !currentActionNames.includes(name));
      const actionsToRemove = currentActionNames.filter(name => !selectedActionIds.includes(name));
      
      // Convert names to IDs for API calls
      const actionIdsToAdd = actionsToAdd
        .map(name => actionMap[name]?.id)
        .filter(id => id) as string[];
      
      const actionIdsToRemove = actionsToRemove
        .map(name => actionMap[name]?.id)
        .filter(id => id) as string[];
      
      // Add new actions
      if (actionIdsToAdd.length > 0) {
        await mcApiService.post(`/organisations/${orgId}/permissions/${currentPermission.id}/actions`, {
          actionIds: actionIdsToAdd
        });
      }
      
      // Remove old actions
      if (actionIdsToRemove.length > 0) {
        await mcApiService.delete(`/organisations/${orgId}/permissions/${currentPermission.id}/actions`, {
          body: { actionIds: actionIdsToRemove }
        });
      }
      
      toast.success(`Permission "${updatedPermission.name}" updated successfully`);
      handleDialogClose();
      fetchPermissions(orgId); // Refresh the permissions list
    } catch (error) {
      console.error("Failed to update permission:", error);
      toast.error("Failed to update permission");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePermission = async () => {
    if (!orgId || !currentPermission) return;

    setIsLoading(true);
    try {
      await mcApiService.delete(`/organisations/${orgId}/permissions/${currentPermission.id}`);
      toast.success(`Permission "${currentPermission.name}" deleted successfully`);
      setIsDeleteDialogOpen(false);
      setCurrentPermission(null);
      fetchPermissions(orgId); // Refresh the permissions list
    } catch (error) {
      console.error("Failed to delete permission:", error);
      toast.error("Failed to delete permission");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setCurrentPermission(null);
    setNewPermission({ name: "", description: "" });
    setSelectedActionIds([]);
    setActionSearchTerm("");
    setIsLoading(false);
  };

  // Filter and sort actions based on search term and selection status
  const filteredActions = availableActions
    .filter(action =>
      action.name.toLowerCase().includes(actionSearchTerm.toLowerCase()) ||
      action.description?.toLowerCase().includes(actionSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort selected items first
      const aSelected = selectedActionIds.includes(a.name);
      const bSelected = selectedActionIds.includes(b.name);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      // Then sort alphabetically
      return a.name.localeCompare(b.name);
    });

  const handleActionToggle = (actionName: string) => {
    setSelectedActionIds(prev => 
      prev.includes(actionName)
        ? prev.filter(name => name !== actionName)
        : [...prev, actionName]
    );
  };

  const columns: ColumnDef<Permission>[] = [
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
      cell: ({ row }: { row: { original: Permission } }) => {
        const permission = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditPermission(permission)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setCurrentPermission(permission);
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
        <h1 className="text-3xl font-bold">Permissions</h1>
        <Button
          onClick={() => {
            setCurrentPermission(null);
            setNewPermission({ name: "", description: "" });
            setSelectedActionIds([]);
            setIsDialogOpen(true);
          }}
          className="rounded-full px-6 py-3"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Permission
        </Button>
      </div>

      <DataTable columns={columns} data={permissions} />

      {/* Add/Edit Permission Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentPermission ? "Edit Permission" : "Create New Permission"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., create:projects"
                  value={newPermission.name}
                  onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this permission allows"
                  value={newPermission.description}
                  onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                />
              </div>
            </div>

            {/* Actions Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select the actions that this permission should allow. You can leave this empty if needed.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Action Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search actions... (e.g., users.list, project.create)"
                      value={actionSearchTerm}
                      onChange={(e) => setActionSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Action Management Controls */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedActionIds.length} of {availableActions.length} actions selected
                      {actionSearchTerm && ` (${filteredActions.length} shown)`}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedActionIds(availableActions.map(a => a.name))}
                        disabled={selectedActionIds.length === availableActions.length}
                      >
                        Select All
                      </Button>
                      {actionSearchTerm && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedActionIds(prev => 
                            Array.from(new Set([...prev, ...filteredActions.map(a => a.name)]))
                          )}
                          disabled={filteredActions.every(action => selectedActionIds.includes(action.name))}
                        >
                          Select Filtered
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Actions List */}
                  <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-3">
                    {filteredActions.length === 0 ? (
                      <div className="text-center py-4">
                        {actionSearchTerm ? (
                          <div>
                            <p className="text-sm text-muted-foreground">No actions match "{actionSearchTerm}"</p>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={() => setActionSearchTerm("")}
                              className="text-xs mt-1"
                            >
                              Clear search
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No actions available</p>
                        )}
                      </div>
                    ) : (
                      filteredActions.map((action) => {
                        const isSelected = selectedActionIds.includes(action.name);
                        return (
                          <div 
                            key={action.name} 
                            className={`flex items-start space-x-3 p-2 rounded-lg transition-colors ${
                              isSelected ? 'bg-secondary/50' : 'hover:bg-secondary/20'
                            }`}
                          >
                            <Checkbox
                              id={action.name}
                              checked={isSelected}
                              onCheckedChange={() => handleActionToggle(action.name)}
                            />
                            <div className="flex-1 min-w-0">
                              <Label 
                                htmlFor={action.name} 
                                className={`text-sm font-medium cursor-pointer ${
                                  isSelected ? 'text-primary' : ''
                                }`}
                              >
                                {action.name}
                              </Label>
                              {action.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {action.description}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleActionToggle(action.name)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Selected Actions Preview */}
                  {selectedActionIds.length > 0 && (
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Selected Actions ({selectedActionIds.length})</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedActionIds([])}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedActionIds.map(actionName => {
                          const action = availableActions.find(a => a.name === actionName);
                          if (!action) return null;
                          return (
                            <span 
                              key={actionName} 
                              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-black text-xs rounded-md"
                            >
                              {action.name}
                              <button
                                type="button"
                                onClick={() => handleActionToggle(actionName)}
                                className="hover:bg-primary/20 rounded-full p-0.5"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button onClick={currentPermission ? handleUpdatePermission : handleAddPermission}>
              {currentPermission ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Permission Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Permission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{currentPermission?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePermission}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 