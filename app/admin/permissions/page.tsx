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
import React from "react";

interface Permission {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

interface Action {
  id: string;
  name: string;
  description?: string;
  organisationId?: string | null;
  extras?: any;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

interface ActionMap {
  [name: string]: Action;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [availableActions, setAvailableActions] = useState<Action[]>([]);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [actionSearchTerm, setActionSearchTerm] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<Permission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMap, setActionMap] = useState<ActionMap>({});
  const [actionById, setActionById] = useState<Record<string, Action>>({});
  const [newPermission, setNewPermission] = useState<Omit<Permission, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">>({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchPermissions();
    fetchAvailableActions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await mcApiService.get("/permissions");
      const list = response.permissions || response.data || response || [];
      setPermissions(list);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      toast.error("Failed to fetch permissions");
    }
  };

  const fetchAvailableActions = async () => {
    try {
      const response = await mcApiService.get("/actions");
      const actions = response.actions || response.data || response || [];
      // create maps by name and by id
      const actionMapTemp: ActionMap = {};
      const idMap: Record<string, Action> = {};
      actions.forEach((a: Action) => {
        if (a?.name) actionMapTemp[a.name] = a;
        if (a?.id) idMap[a.id] = a;
      });
      setActionMap(actionMapTemp);
      setActionById(idMap);
      const sorted = [...actions].sort((a: Action, b: Action) => a.name.localeCompare(b.name));
      setAvailableActions(sorted);
      return { actions: sorted, actionMap: actionMapTemp, actionById: idMap };
    } catch (error) {
      console.error("Failed to fetch available actions:", error);
      toast.error("Failed to fetch available actions");
      return { actions: [], actionMap: {}, actionById: {} };
    }
  };

  const fetchPermissionActions = async (permissionId: string, idMap?: Record<string, Action>): Promise<string[]> => {
    try {
      const response = await mcApiService.get(`/permissions/${permissionId}/actions`);
      const items: any[] = response.actions || response.data || response || [];
      const byId = idMap || actionById;
      // items can be objects ({id,name}), strings (ids or names), or a mix.
      const names = items
        .map((it: any) => {
          if (!it) return "";
          if (typeof it === "string") {
            // string may be id or name
            const foundById = byId?.[it];
            if (foundById) return foundById.name;
            // fallback assume it's already a name
            return it;
          }
          if (typeof it === "object") {
            if (it.name) return it.name;
            if (it.id && byId?.[it.id]) return byId[it.id].name;
          }
          return "";
        })
        .filter(Boolean);
      return names;
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

    setIsLoading(true);
    try {
      const permission = { name: newPermission.name, description: newPermission.description };
      const response = await mcApiService.post("/permissions", permission);
      const permissionId = response.permission?.id || response.data?.id || response.id;
      if (!permissionId) throw new Error("No permission id returned");

      if (selectedActionIds.length > 0) {
        const actionIdsToAdd = selectedActionIds
          .map(name => actionMap[name]?.id)
          .filter(id => id) as string[];
        if (actionIdsToAdd.length > 0) {
          await mcApiService.post(`/permissions/${permissionId}/actions`, { actionIds: actionIdsToAdd });
        }
      }

      toast.success(`Permission "${permission.name}" created successfully`);
      handleDialogClose();
      fetchPermissions();
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
      setNewPermission({ name: permission.name, description: permission.description || "" });
      // ensure we have up-to-date actions & maps, then fetch permission actions and map ids->names if necessary
      const { actionById: idMap } = await fetchAvailableActions();
      const actionNames = await fetchPermissionActions(permission.id, idMap);
      setSelectedActionIds(actionNames);
      setActionSearchTerm("");
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
    if (!currentPermission) {
      toast.error("No permission selected");
      return;
    }

    setIsLoading(true);
    try {
      const updatedPermission = { name: newPermission.name, description: newPermission.description };
      await mcApiService.patch(`/d/permission/${currentPermission.id}`, updatedPermission);

      const currentActionNames = await fetchPermissionActions(currentPermission.id);

      const actionsToAdd = selectedActionIds.filter(name => !currentActionNames.includes(name));
      const actionsToRemove = currentActionNames.filter(name => !selectedActionIds.includes(name));

      const actionIdsToAdd = actionsToAdd.map(name => actionMap[name]?.id).filter(Boolean) as string[];
      const actionIdsToRemove = actionsToRemove.map(name => actionMap[name]?.id).filter(Boolean) as string[];

      if (actionIdsToAdd.length > 0) {
        await mcApiService.post(`/permissions/${currentPermission.id}/actions`, { actionIds: actionIdsToAdd });
      }
      if (actionIdsToRemove.length > 0) {
        await mcApiService.delete(`/permissions/${currentPermission.id}/actions`, { body: { actionIds: actionIdsToRemove } });
      }

      toast.success(`Permission "${updatedPermission.name}" updated successfully`);
      handleDialogClose();
      fetchPermissions();
    } catch (error) {
      console.error("Failed to update permission:", error);
      toast.error("Failed to update permission");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePermission = async () => {
    if (!currentPermission) return;
    setIsLoading(true);
    try {
      await mcApiService.delete(`/d/permission/${currentPermission.id}`);
      toast.success(`Permission "${currentPermission.name}" deleted successfully`);
      setIsDeleteDialogOpen(false);
      setCurrentPermission(null);
      fetchPermissions();
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

  // filter & sort actions: selected first, then alphabetically and by search
  const filteredActions = availableActions
    .filter(a =>
      a.name.toLowerCase().includes(actionSearchTerm.toLowerCase()) ||
      (a.description || "").toLowerCase().includes(actionSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aSelected = selectedActionIds.includes(a.name);
      const bSelected = selectedActionIds.includes(b.name);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.name.localeCompare(b.name);
    });

  const handleActionToggle = (actionName: string) => {
    setSelectedActionIds(prev => prev.includes(actionName) ? prev.filter(n => n !== actionName) : [...prev, actionName]);
  };

  const columns: ColumnDef<Permission>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
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
                          onClick={() => setSelectedActionIds(prev => Array.from(new Set([...prev, ...filteredActions.map(a => a.name)])))}
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
                            <Button type="button" variant="link" size="sm" onClick={() => setActionSearchTerm("")} className="text-xs mt-1">
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
                            className={`flex items-start space-x-3 p-2 rounded-lg transition-colors ${isSelected ? 'bg-secondary/50' : 'hover:bg-secondary/20'}`}
                          >
                            <Checkbox id={action.name} checked={isSelected} onCheckedChange={() => handleActionToggle(action.name)} />
                            <div className="flex-1 min-w-0">
                              <Label htmlFor={action.name} className={`text-sm font-medium cursor-pointer ${isSelected ? 'text-primary' : ''}`}>
                                {action.name}
                              </Label>
                              {action.description && <p className="text-xs text-muted-foreground mt-1">{action.description}</p>}
                            </div>
                            {isSelected && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => handleActionToggle(action.name)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
                        <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedActionIds([])} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          Remove All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedActionIds.map(actionName => {
                          const action = availableActions.find(a => a.name === actionName);
                          if (!action) return null;
                          return (
                            <span key={actionName} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-black text-xs rounded-md">
                              {action.name}
                              <button type="button" onClick={() => handleActionToggle(actionName)} className="hover:bg-primary/20 rounded-full p-0.5">
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
            <Button onClick={currentPermission ? handleUpdatePermission : handleAddPermission} disabled={isLoading}>
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
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePermission} disabled={isLoading}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
