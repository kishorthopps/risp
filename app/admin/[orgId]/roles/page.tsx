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
import { Checkbox } from "@/components/ui/checkbox";
import { useParams } from "next/navigation";
import React from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export default function OrganizationRolesPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState<Omit<Role, "id" | "createdAt">>({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (orgId) {
      fetchRoles(orgId);
      fetchAvailablePermissions(orgId);
    } else {
      toast.error("No organization selected");
    }
  }, [orgId]);

  const fetchRoles = async (organizationId: string) => {
    try {
      const response = await mcApiService.get(`/organisations/${organizationId}/roles`);
      setRoles(response.roles);
    } catch (error) {
      toast.error("Failed to fetch roles");
    }
  };

  const fetchAvailablePermissions = async (organizationId: string) => {
    try {
      const response = await mcApiService.get(`/organisations/${organizationId}/permissions`);
      setAvailablePermissions(response.permissions);
    } catch (error) {
      toast.error("Failed to fetch available permissions");
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const response = await mcApiService.get(`/organisations/${orgId}/roles/${roleId}/permissions`);
      return response.permissions.map((permission: Permission) => permission.id);
    } catch (error) {
      console.error("Failed to fetch role permissions:", error);
      return [];
    }
  };

  const handleAddRole = async () => {
    if (!newRole.name.trim() || !newRole.description.trim()) {
      toast.error("Both name and description are required");
      return;
    }

    if (!orgId) {
      toast.error("No organization selected");
      return;
    }

    try {
      const role = {
        name: newRole.name,
        description: newRole.description,
      };
      
      // Create the role first
      const response = await mcApiService.post(`/organisations/${orgId}/roles`, role);
      const roleId = response.role.id;
      
      // Add permissions to the role if any are selected
      if (selectedPermissionIds.length > 0) {
        await mcApiService.post(`/organisations/${orgId}/roles/${roleId}/permissions`, {
          permissionIds: selectedPermissionIds
        });
      }
      
      toast.success(`Role "${role.name}" created successfully`);
      setIsDialogOpen(false);
      setNewRole({ name: "", description: "" });
      setSelectedPermissionIds([]);
      fetchRoles(orgId); // Refresh the roles list
    } catch (error) {
      toast.error("Failed to create role");
    }
  };

  const handleEditRole = async (role: Role) => {
    setCurrentRole(role);
    setNewRole({ name: role.name, description: role.description });
    
    // Fetch the permissions for this role
    const permissionIds = await fetchRolePermissions(role.id);
    setSelectedPermissionIds(permissionIds);
    
    setIsDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!newRole.name.trim() || !newRole.description.trim()) {
      toast.error("Both name and description are required");
      return;
    }

    if (!orgId || !currentRole) {
      toast.error("No organization or role selected");
      return;
    }

    try {
      const updatedRole = {
        name: newRole.name,
        description: newRole.description,
      };
      
      // Update the role
      await mcApiService.patch(
        `/organisations/${orgId}/roles/${currentRole.id}`,
        updatedRole
      );
      
      // Get current role permissions
      const currentPermissionIds = await fetchRolePermissions(currentRole.id);
      
      // Find permissions to add and remove
      const permissionsToAdd = selectedPermissionIds.filter((id: string) => !currentPermissionIds.includes(id));
      const permissionsToRemove = currentPermissionIds.filter((id: string) => !selectedPermissionIds.includes(id));
      
      // Add new permissions
      if (permissionsToAdd.length > 0) {
        await mcApiService.post(`/organisations/${orgId}/roles/${currentRole.id}/permissions`, {
          permissionIds: permissionsToAdd
        });
      }
      
      // Remove old permissions
      if (permissionsToRemove.length > 0) {
        await mcApiService.delete(`/organisations/${orgId}/roles/${currentRole.id}/permissions`, {
          body: {
            permissionIds: permissionsToRemove
          }
        });
      }
      
      // Provide specific feedback about changes
      let changeMessage = `Role "${updatedRole.name}" updated successfully`;
      if (permissionsToAdd.length > 0 && permissionsToRemove.length > 0) {
        changeMessage += ` (${permissionsToAdd.length} permissions added, ${permissionsToRemove.length} permissions removed)`;
      } else if (permissionsToAdd.length > 0) {
        changeMessage += ` (${permissionsToAdd.length} permissions added)`;
      } else if (permissionsToRemove.length > 0) {
        changeMessage += ` (${permissionsToRemove.length} permissions removed)`;
      }
      
      // Special case: if all permissions were removed
      if (selectedPermissionIds.length === 0 && currentPermissionIds.length > 0) {
        changeMessage += ". This role now has no associated permissions.";
      }
      
      toast.success(changeMessage);
      setIsDialogOpen(false);
      setCurrentRole(null);
      setNewRole({ name: "", description: "" });
      setSelectedPermissionIds([]);
      fetchRoles(orgId); // Refresh the roles list
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleDeleteRole = async () => {
    if (!orgId || !currentRole) return;

    try {
      await mcApiService.delete(`/organisations/${orgId}/roles/${currentRole.id}`);
      toast.success(`Role "${currentRole.name}" deleted successfully`);
      setIsDeleteDialogOpen(false);
      setCurrentRole(null);
      fetchRoles(orgId); // Refresh the roles list
    } catch (error) {
      toast.error("Failed to delete role");
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissionIds(prev => 
      prev.includes(permissionId) 
        ? prev.filter((id: string) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleClearAllPermissions = () => {
    if (selectedPermissionIds.length > 0) {
      if (confirm(`Are you sure you want to remove all ${selectedPermissionIds.length} selected permissions? This will mean the role grants no specific permissions.`)) {
        setSelectedPermissionIds([]);
        toast.info("All permissions cleared from role");
      }
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setCurrentRole(null);
    setNewRole({ name: "", description: "" });
    setSelectedPermissionIds([]);
  };

  const handlePermissionSelection = (permissionId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const columns: ColumnDef<Role>[] = [
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
      cell: ({ row }: { row: { original: Role } }) => {
        const role = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditRole(role)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setCurrentRole(role);
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
        <h1 className="text-3xl font-bold">Roles</h1>
        <Button
          onClick={() => {
            setCurrentRole(null);
            setNewRole({ name: "", description: "" });
            setSelectedPermissionIds([]);
            setIsDialogOpen(true);
          }}
          className="rounded-full px-6 py-3"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Role
        </Button>
      </div>

      <DataTable columns={columns} data={roles} />

      {/* Add/Edit Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentRole ? "Edit Role" : "Create New Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Project Manager"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this role does"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                />
              </div>
            </div>

            {/* Permissions Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Permissions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select the permissions that this role should have. You can leave this empty if needed.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Permission Management Controls */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedPermissionIds.length} of {availablePermissions.length} permissions selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearAllPermissions}
                        disabled={selectedPermissionIds.length === 0}
                      >
                        Clear All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPermissionIds(availablePermissions.map(p => p.id))}
                        disabled={selectedPermissionIds.length === availablePermissions.length}
                      >
                        Select All
                      </Button>
                    </div>
                  </div>

                  {/* Permissions List */}
                  <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-3">
                    {availablePermissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No permissions available</p>
                    ) : (
                      availablePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-secondary/50">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissionIds.includes(permission.id)}
                            onCheckedChange={(checked) => handlePermissionToggle(permission.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <Label 
                              htmlFor={permission.id} 
                              className="text-sm font-medium cursor-pointer"
                            >
                              {permission.name}
                            </Label>
                            {permission.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {permission.description}
                              </p>
                            )}
                          </div>
                          {selectedPermissionIds.includes(permission.id) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePermissionToggle(permission.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Selected Permissions Preview */}
                  {selectedPermissionIds.length > 0 ? (
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Selected Permissions ({selectedPermissionIds.length})</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearAllPermissions}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedPermissionIds.map(permissionId => {
                          const permission = availablePermissions.find(p => p.id === permissionId);
                          return permission ? (
                            <span 
                              key={permissionId} 
                              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-black text-xs rounded-md"
                            >
                              {permission.name}
                              <button
                                type="button"
                                onClick={() => handlePermissionToggle(permission.id)}
                                className="hover:bg-primary/20 rounded-full p-0.5"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
                          <span className="text-yellow-800 text-xs font-bold">!</span>
                        </div>
                        <p className="text-sm text-yellow-800">
                          No permissions selected. This role will not grant any specific permissions.
                        </p>
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
            <Button onClick={currentRole ? handleUpdateRole : handleAddRole}>
              {currentRole ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{currentRole?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 