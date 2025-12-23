"use client";

import React, { useState, useEffect } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Edit, Trash2, ArrowUpDown, UserCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { 
  useOrganizationUsers, 
  useOrganizationRoles,
  useOrganizationProjects,
  useAddOrganizationUser,
  useUpdateOrganizationUser,
  useDeleteOrganizationUser,
  useUserProjects
} from "@/hooks/useOrganizations";
import { useCreateUser } from "@/hooks/useUsers";
import { mcApiService } from "@/lib/mcApiService";
import { UserDetailsForm, type UserFormData, ProjectUserView } from "@/components/users";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  extras?: any;
}

interface Role {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
}

interface NewUserState {
  name: string;
  email: string;
  password: string;
  mobile: string;
  aadhaar: string;
  dob: string;
  nationality: string;
  address: string;
  country: string;
  state: string;
  religion: string;
  caste: string;
  annualIncome: string;
  languagePreference: string;
  roleId: string;
  projectIds: string[];
}

export default function OrganizationUsersPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  // TanStack Query hooks
  const { 
    data: usersData, 
    isLoading: usersLoading, 
    error: usersError 
  } = useOrganizationUsers(orgId);
  
  const { 
    data: rolesData = [], 
    isLoading: rolesLoading 
  } = useOrganizationRoles(orgId);

  const { 
    data: projectsData = [], 
    isLoading: projectsLoading 
  } = useOrganizationProjects(orgId);

  // Mutations
  const addUserMutation = useAddOrganizationUser();
  const updateUserMutation = useUpdateOrganizationUser();
  const deleteUserMutation = useDeleteOrganizationUser();

  // Local state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Filter states
  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Hook to fetch user projects when editing
  const { 
    data: userProjectsData, 
    isLoading: userProjectsLoading,
    error: userProjectsError 
  } = useUserProjects(orgId, editingUserId || '');

  const [newUser, setNewUser] = useState<NewUserState>({
    name: "",
    email: "",
    password: "",
    mobile: "",
    aadhaar: "",
    dob: "",
    nationality: "",
    address: "",
    country: "",
    state: "",
    religion: "",
    caste: "",
    annualIncome: "",
    languagePreference: "",
    roleId: "",
    projectIds: [],
  });

  // Extract users, roles, and projects from query data
  const users = usersData?.users || [];
  const roles = rolesData;
  const projects = projectsData;

  // Filter users based on name and role
  const filteredUsers = users.filter((user) => {
    const matchesName = user.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
                       user.email.toLowerCase().includes(nameFilter.toLowerCase());
    
    if (roleFilter === "all") {
      return matchesName;
    }
    
    if (roleFilter === "no-role") {
      // Check if user has no roles (empty role string or just whitespace/commas)
      const hasNoRoles = !user.role || user.role.trim() === "" || user.role.trim() === ",";
      return matchesName && hasNoRoles;
    }
    
    // Check if user has the selected role
    const userRoles = user.role.split(", ");
    const selectedRole = roles.find(role => role.id === roleFilter);
    const matchesRole = selectedRole ? userRoles.includes(selectedRole.name) : false;
    
    return matchesName && matchesRole;
  });

  // Helper function to create extras object from user data
  const createExtrasObject = (user: NewUserState) => ({
    mobile: user.mobile,
    aadhaar: user.aadhaar,
    dob: user.dob,
    nationality: user.nationality,
    address: user.address,
    country: user.country,
    state: user.state,
    religion: user.religion,
    caste: user.caste,
    annualIncome: user.annualIncome,
    languagePreference: user.languagePreference,
  });

  // Helper function to create project assignment payload
  const createProjectPayload = (user: NewUserState) => ({
    email: user.email,
    name: user.name,
    extras: createExtrasObject(user),
    roleId: user.roleId === "no-role" ? undefined : user.roleId
  });

  // Helper function to reset user state
  const resetUserState = (): NewUserState => ({
    name: "",
    email: "",
    password: "",
    mobile: "",
    aadhaar: "",
    dob: "",
    nationality: "",
    address: "",
    country: "",
    state: "",
    religion: "",
    caste: "",
    annualIncome: "",
    languagePreference: "",
    roleId: "no-role",
    projectIds: [],
  });

  // Effect to update user projects when editing and projects data is fetched
  useEffect(() => {
    if (editingUserId && userProjectsData && currentUser && isDialogOpen) {
      console.log("Raw user projects data:", userProjectsData);
      const userProjectIds = userProjectsData.map((project: any) => project.id) || [];
      
      // Update the form to include the user's current projects
      setNewUser(prev => ({
        ...prev,
        projectIds: userProjectIds,
      }));
      
      console.log("Updated form with user projects:", userProjectIds);
    }
  }, [userProjectsData, editingUserId, currentUser, isDialogOpen]);

  // Effect to handle user projects loading error
  useEffect(() => {
    if (editingUserId && userProjectsError && currentUser && isDialogOpen) {
      console.error("Error fetching user projects:", userProjectsError);
      toast.warning("Could not load user's current project assignments. Please manually select projects.");
    }
  }, [userProjectsError, editingUserId, currentUser, isDialogOpen]);

  // Loading state
  if (usersLoading || rolesLoading || projectsLoading) {
    return (
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded"></div>
          <div className="h-96 bg-muted animate-pulse rounded"></div>
        </div>
      </main>
    );
  }

  // Error state
  if (usersError) {
    return (
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load users. Please try again.</p>
        </div>
      </main>
    );
  }

  const handleDialogOpen = (isOpen: boolean) => {
    setIsDialogOpen(isOpen);
  };

  const handleAddUser = async () => {
    // Detailed validation with specific error messages
    if (!newUser.name.trim()) {
      toast.error("Please enter a user name");
      return;
    }
    
    if (!newUser.email.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    
    if (!newUser.password.trim()) {
      toast.error("Please enter a password");
      return;
    }

    if (newUser.projectIds.length === 0) {
      toast.error("Please select at least one project");
      return;
    }

    // Debug logging
    console.log("User creation data:", {
      projectIds: newUser.projectIds,
      projectCount: newUser.projectIds.length,
      roleId: newUser.roleId,
      userData: newUser
    });

    try {
      console.log("Creating user with project assignments...");
      // Strategy: First create the organization user, then assign to projects
      // Step 1: Create the organization user with all details
      const userResponse = await addUserMutation.mutateAsync({
        orgId,
        userData: {
          email: newUser.email,
          password: newUser.password,
          name: newUser.name,
          roleIds: newUser.roleId === "no-role" ? [] : [newUser.roleId],
          extras: createExtrasObject(newUser),
        },
      });

      console.log("User created successfully, now assigning to projects...");

      // Step 2: Assign user to each selected project
      let successfulAssignments = 0;
      for (const projectId of newUser.projectIds) {
        try {
          console.log(`Assigning user to project ${projectId}...`);
          // We need to find the orgUserId for the newly created user
          // For now, let's try using the project assignment endpoint with basic info
          const projectPayload = createProjectPayload(newUser);
          
          console.log(`Project assignment payload for ${projectId}:`, projectPayload);
          
          await mcApiService.post(
            `/organisations/${orgId}/projects/${projectId}/usersassign`,
            projectPayload
          );
          console.log(`Successfully assigned user to project ${projectId}`);
          successfulAssignments++;
        } catch (error: any) {
          console.error(`Error assigning user to project ${projectId}:`, error);
          // If user already exists, that's expected
          if (error?.response?.data?.message?.includes("already exists")) {
            console.log(`User already exists, assignment may have succeeded for project ${projectId}`);
            successfulAssignments++; // Count as success since user exists
          } else {
            console.error(`Failed to assign user to project ${projectId}:`, error);
          }
        }
      }
      
      if (successfulAssignments > 0) {
        toast.success(`User created and assigned to ${successfulAssignments} project(s)`);
      } else {
        toast.warning("User created but project assignment failed");
      }
      
      handleDialogClose(false);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create user";
      toast.error(errorMessage);
      console.error("Error creating user:", error);
    }
  };

  const handleEditUser = (user: User) => {
    console.log("Editing user:", user);
    
    // Set the user ID to trigger the hook to fetch user projects
    setEditingUserId(user.id);
    setCurrentUser(user);
    
    // Pre-populate form with user data (projects will be set via useEffect)
    const currentRole = roles.find((role) => user?.role.split(", ").includes(role.name));

    setNewUser({
      name: user.name,
      email: user.email,
      password: "", // Don't pre-fill password for security
      mobile: user.extras?.mobile || "",
      aadhaar: user.extras?.aadhaar || "",
      dob: user.extras?.dob || "",
      nationality: user.extras?.nationality || "",
      address: user.extras?.address || "",
      country: user.extras?.country || "",
      state: user.extras?.state || "",
      religion: user.extras?.religion || "",
      caste: user.extras?.caste || "",
      annualIncome: user.extras?.annualIncome || "",
      languagePreference: user.extras?.languagePreference || "",
      roleId: currentRole?.id || "no-role",
      projectIds: [], // Will be populated when projects are fetched
    });

    setIsDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    // Detailed validation with specific error messages
    if (!currentUser) {
      toast.error("No user selected for update");
      return;
    }
    
    if (!newUser.name.trim()) {
      toast.error("Please enter a user name");
      return;
    }
    
    if (!newUser.email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (newUser.projectIds.length === 0) {
      toast.error("Please select at least one project");
      return;
    }

    // Debug logging for update
    console.log("User update data:", {
      currentUser: currentUser,
      projectIds: newUser.projectIds,
      projectCount: newUser.projectIds.length,
      roleId: newUser.roleId,
      userData: newUser
    });

    try {
      // Update the user's basic details and roles using the PATCH endpoint
      // The backend handles role additions and removals automatically
      await updateUserMutation.mutateAsync({
        orgId,
        userId: currentUser.id,
        userData: {
          name: newUser.name,
          email: newUser.email,
          roleIds: newUser.roleId === "no-role" ? [] : [newUser.roleId],
          extras: createExtrasObject(newUser),
        },
      });

      console.log("User updated successfully, now handling project assignments...");

      // Handle project assignments - both adding and removing
      console.log("Updating user project assignments...");
      
      // Get current project assignments from the hook data
      const currentProjectIds = userProjectsData?.map((project: any) => project.id) || [];
      const newProjectIds = newUser.projectIds;
      
      console.log("Raw userProjectsData:", userProjectsData);
      console.log("Current projects:", currentProjectIds);
      console.log("New projects:", newProjectIds);
      
      // Only proceed with comparisons if we have valid current project data
      let projectsToRemove: string[] = [];
      let projectsToAdd: string[] = [];
      
      if (!userProjectsData) {
        console.warn("No current project data available, skipping project removal logic");
        // Just add to new projects
        projectsToAdd = newProjectIds;
      } else {
        // Projects to remove (in current but not in new)
        projectsToRemove = currentProjectIds.filter((id: string) => !newProjectIds.includes(id));
        
        // Projects to add (in new but not in current)
        projectsToAdd = newProjectIds.filter((id: string) => !currentProjectIds.includes(id));
      }
      
      console.log("Projects to remove:", projectsToRemove);
      console.log("Projects to add:", projectsToAdd);
      
      let successfulOperations = 0;
      
      // Remove user from projects they're no longer assigned to
      for (const projectId of projectsToRemove) {
        try {
          console.log(`Removing user from project ${projectId}...`);
          
          await mcApiService.delete(
            `/organisations/${orgId}/projects/${projectId}/unassign/${currentUser.id}`
          );
          console.log(`Successfully unassigned user from project ${projectId}`);
          successfulOperations++;
        } catch (error: any) {
          console.error(`Error unassigning user from project ${projectId}:`, error);
          
          // If user was not found in project (404), treat as success since goal is achieved
          if (error?.status === 404 || error?.response?.status === 404) {
            console.log(`User was not assigned to project ${projectId} (404), treating as success`);
            successfulOperations++;
          } else {
            console.error(`Failed to unassign user from project ${projectId}:`, error.message);
          }
        }
      }
      
      // Add user to new projects
      for (const projectId of projectsToAdd) {
        try {
          console.log(`Assigning user to project ${projectId}...`);
          
          const projectPayload = createProjectPayload(newUser);
          
          console.log(`Project assignment payload for ${projectId}:`, projectPayload);
          
          await mcApiService.post(
            `/organisations/${orgId}/projects/${projectId}/usersassign`,
            projectPayload
          );
          console.log(`Successfully assigned user to project ${projectId}`);
          successfulOperations++;
        } catch (error: any) {
          console.error(`Error assigning user to project ${projectId}:`, error);
          // If user already exists in project, that's expected
          if (error?.response?.data?.message?.includes("already assigned") || 
              error?.response?.data?.message?.includes("already exists")) {
            console.log(`User already assigned to project ${projectId}`);
            successfulOperations++; // Count as success since user is assigned
          } else {
            console.error(`Failed to assign user to project ${projectId}:`, error);
          }
        }
      }
      
      // Show appropriate success message
      const totalChanges = projectsToRemove.length + projectsToAdd.length;
      if (totalChanges === 0) {
      } else if (successfulOperations > 0) {
        toast.success(`User updated with project assignment changes`);
      } else {
        toast.warning("User updated but project assignment changes failed");
      }

      handleDialogClose(false);
      
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update user";
      toast.error(errorMessage);
      // console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async () => {
    if (!currentUser) return;

    deleteUserMutation.mutate(
      { orgId, userId: currentUser.id },
      {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setCurrentUser(null);
        },
      }
    );
  };

  const handleRemoveRole = (roleId: string) => {
    // For single role selection, we just clear the role
    setNewUser((prev) => ({
      ...prev,
      roleId: "no-role",
    }));
  };

  const handleToggleRole = (roleId: string) => {
    // For single role selection, we set the role directly
    setNewUser((prev) => ({
      ...prev,
      roleId: prev.roleId === roleId ? "" : roleId,
    }));
  };

  const handleToggleProject = (projectId: string) => {
    console.log("Toggling project:", projectId);
    setNewUser((prev) => {
      const newProjectIds = prev.projectIds.includes(projectId)
        ? prev.projectIds.filter((id) => id !== projectId)
        : [...prev.projectIds, projectId];
      
      console.log("Updated projectIds:", newProjectIds);
      
      return {
        ...prev,
        projectIds: newProjectIds,
      };
    });
  };

  const handleRemoveProject = (projectId: string) => {
    setNewUser((prev) => ({
      ...prev,
      projectIds: prev.projectIds.filter((id) => id !== projectId),
    }));
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
    setIsViewDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Reset editing state when dialog is closed
      setEditingUserId(null);
      setCurrentUser(null);
      setNewUser(resetUserState());
    }
  };

  const columns: ColumnDef<User>[] = [
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
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "role",
      header: "Roles",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: User } }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                <UserCircle className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setCurrentUser(user);
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
      <div className="h-10"></div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Organization Users</h1>
        <Button
          onClick={() => {
            setCurrentUser(null);
            setNewUser(resetUserState());
            setIsDialogOpen(true);
          }}
          className="rounded-full px-6 py-3"
        >
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Name filter */}
        <div>
          <label className="text-sm font-medium">Filter by Name</label>
          <Input
            placeholder="Enter name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Role filter */}
        <div>
          <label className="text-sm font-medium">Filter by Role</label>
          <Select
            value={roleFilter}
            onValueChange={setRoleFilter}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="no-role">No Role</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable columns={columns} data={filteredUsers} hideFilter={true} />

      {/* Add/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentUser ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* User Details Form */}
            <div>
              <h3 className="text-lg font-medium mb-4">User Details</h3>
              <UserDetailsForm 
                user={newUser as UserFormData} 
                onChange={(updatedUser: UserFormData) => 
                  setNewUser(prev => ({ ...prev, ...updatedUser }))
                } 
              />
            </div>

            {/* Password field for new users */}
            {!currentUser && (
              <div>
                <Input
                  type="password"
                  placeholder="Password *"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="text-sm font-medium">Select User Org Role</label>
              <Select
                value={newUser.roleId}
                onValueChange={(value) => setNewUser(prev => ({ ...prev, roleId: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-role">No Role</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project Selection */}
            <div>
              <label className="text-sm font-medium">Assign to Projects *</label>
              {currentUser && editingUserId && userProjectsLoading && (
                <p className="text-sm text-muted-foreground mt-1">Loading current project assignments...</p>
              )}
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded p-3">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={project.id}
                        checked={newUser.projectIds.includes(project.id)}
                        onChange={() => handleToggleProject(project.id)}
                      />
                      <label htmlFor={project.id} className="text-sm">
                        {project.name}
                      </label>
                      {newUser.projectIds.includes(project.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProject(project.id)}
                          className="ml-auto"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No projects available</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogClose(false)}>
              Cancel
            </Button>
            <Button
              onClick={currentUser ? handleUpdateUser : handleAddUser}
              disabled={
                currentUser
                  ? updateUserMutation.isPending
                  : addUserMutation.isPending
              }
            >
              {currentUser
                ? updateUserMutation.isPending
                  ? "Updating..."
                  : "Update User"
                : addUserMutation.isPending
                ? "Adding..."
                : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        setIsViewDialogOpen(open);
        if (!open) {
          setViewingUser(null);
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View User Details</DialogTitle>
          </DialogHeader>
          
          {viewingUser ? (
            <ProjectUserView 
              user={{
                id: viewingUser.id,
                name: viewingUser.name,
                email: viewingUser.email,
                roleId: roles.find(role => viewingUser.role.includes(role.name))?.id,
                mobile: viewingUser.extras?.mobile,
                aadhaar: viewingUser.extras?.aadhaar,
                dob: viewingUser.extras?.dob,
                nationality: viewingUser.extras?.nationality,
                address: viewingUser.extras?.address,
                country: viewingUser.extras?.country,
                state: viewingUser.extras?.state,
                religion: viewingUser.extras?.religion,
                caste: viewingUser.extras?.caste,
                annualIncome: viewingUser.extras?.annualIncome,
                languagePreference: viewingUser.extras?.languagePreference,
              }}
              roles={roles}
              onEdit={() => {
                if (viewingUser) {
                  setIsViewDialogOpen(false);
                  handleEditUser(viewingUser);
                }
              }}
              showEditButton={false} // We'll show it in the footer
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Unable to load user details</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              if (viewingUser) {
                setIsViewDialogOpen(false);
                handleEditUser(viewingUser);
              }
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}