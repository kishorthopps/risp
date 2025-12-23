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
import { toast } from "sonner";
import { mcApiService } from "@/lib/mcApiService";
import { UserDetailsForm, type UserFormData, ProjectUserView } from "@/components/users";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  extras?: any;
  systemRole?: string; // added: systemRole from API
}

interface Role {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
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
  projectIds: string[]; // removed roleId
}

export default function UsersPage() {
  // Local state and lists
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [userProjectsLoading, setUserProjectsLoading] = useState(false);
  const [userProjectsData, setUserProjectsData] = useState<Project[] | null>(null);

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
    projectIds: [],
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchProjects();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await mcApiService.get("/d/user");
      setUsers(res.users || res.data || res || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await mcApiService.get("/d/role");
      setRoles(res.roles || res.data || res || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load roles");
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await mcApiService.get("/d/project");
      setProjects(res.projects || res.data || res || []);
    } catch (err) {
      console.error(err);
      // projects optional
    }
  };

  const fetchUserProjects = async (userId: string) => {
    if (!userId) return [];
    setUserProjectsLoading(true);
    try {
      const res = await mcApiService.get(`/d/user/${userId}/projects`);
      const list = res.projects || res.data || [];
      setUserProjectsData(list);
      setUserProjectsLoading(false);
      return list;
    } catch (err) {
      setUserProjectsLoading(false);
      console.error(err);
      return [];
    }
  };

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

  const createProjectPayload = (user: NewUserState) => ({
    email: user.email,
    name: user.name,
    systemRole: "SUPER_USER",
  });

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
    projectIds: [],
  });

  useEffect(() => {
    if (editingUserId && isDialogOpen) {
      fetchUserProjects(editingUserId)
        .then((list) => {
          const ids = list.map((p: any) => p.id) || [];
          setNewUser((prev) => ({ ...prev, projectIds: ids }));
        })
        .catch(() => {});
    }
  }, [editingUserId, isDialogOpen]);

  // derive system role options from users list
  const systemRoleOptions = Array.from(new Set(users.map((u: any) => u.systemRole).filter(Boolean)));

  const filteredUsers = users.filter((user: any) => {
    const matchesName =
      user.name?.toLowerCase().includes(nameFilter.toLowerCase()) ||
      user.email?.toLowerCase().includes(nameFilter.toLowerCase());
    if (roleFilter === "all") return matchesName;
    if (roleFilter === "no-role") {
      const hasNoSystemRole = !user.systemRole || user.systemRole.trim() === "";
      return matchesName && hasNoSystemRole;
    }
    return matchesName && user.systemRole === roleFilter;
  });

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingUserId(null);
      setCurrentUser(null);
      setNewUser(resetUserState());
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name.trim()) return toast.error("Please enter a user name");
    if (!newUser.email.trim()) return toast.error("Please enter an email address");
    if (!newUser.password.trim()) return toast.error("Please enter a password");

    try {
      // Create user (use systemRole always)
      await mcApiService.post("/auth/register", {
        email: newUser.email,
        password: newUser.password,
        name: newUser.name,
        systemRole: "SUPER_USER"
      });

      // Assign to projects
      let assigned = 0;
      for (const projectId of newUser.projectIds) {
        try {
          await mcApiService.post(`/d/project/${projectId}/usersassign`, createProjectPayload(newUser));
          assigned++;
        } catch (err: any) {
          if (err?.response?.data?.message?.includes("already")) assigned++;
        }
      }

      toast.success(`User created and assigned to ${assigned} project(s)`);
      handleDialogClose(false);
      fetchUsers();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to create user";
      toast.error(message);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setCurrentUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      password: "",
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
      projectIds: [],
    });
    setIsDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!currentUser) return toast.error("No user selected for update");
    if (!newUser.name.trim()) return toast.error("Please enter a user name");
    if (!newUser.email.trim()) return toast.error("Please enter an email address");

    try {
      await mcApiService.patch(`/d/user/${currentUser.id}`, {
        name: newUser.name,
        email: newUser.email,
        systemRole: "SUPER_USER"
      });

      // update project assignments: fetch current, diff, unassign/add
      const currentProjects = await fetchUserProjects(currentUser.id);
      const currentIds = currentProjects.map((p: { id: any }) => p.id);
      const toRemove = currentIds.filter((id: string) => !newUser.projectIds.includes(id));
      const toAdd = newUser.projectIds.filter((id) => !currentIds.includes(id));

      let ops = 0;
      for (const pid of toRemove) {
        try {
          await mcApiService.delete(`/d/project/${pid}/unassign/${currentUser.id}`);
          ops++;
        } catch (err: any) {
          if (err?.status === 404 || err?.response?.status === 404) ops++;
        }
      }
      for (const pid of toAdd) {
        try {
          await mcApiService.post(`/d/project/${pid}/usersassign`, createProjectPayload(newUser));
          ops++;
        } catch (err: any) {
          if (err?.response?.data?.message?.includes("already")) ops++;
        }
      }

      if (toAdd.length + toRemove.length === 0) {
        // no project changes
      } else if (ops > 0) {
        toast.success(`User updated with project assignment changes`);
      } else {
        toast.warning("User updated but project assignment changes failed");
      }

      handleDialogClose(false);
      fetchUsers();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to update user";
      toast.error(message);
    }
  };

  const handleDeleteUser = async () => {
    if (!currentUser) return;
    try {
      await mcApiService.delete(`/d/user/${currentUser.id}`);
      setIsDeleteDialogOpen(false);
      setCurrentUser(null);
      fetchUsers();
      toast.success("User deleted");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete user");
    }
  };

  const handleToggleProject = (projectId: string) => {
    setNewUser((prev) => {
      const newProjectIds = prev.projectIds.includes(projectId)
        ? prev.projectIds.filter((id) => id !== projectId)
        : [...prev.projectIds, projectId];
      return { ...prev, projectIds: newProjectIds };
    });
  };

  const handleRemoveProject = (projectId: string) => {
    setNewUser((prev) => ({ ...prev, projectIds: prev.projectIds.filter((id) => id !== projectId) }));
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
    setIsViewDialogOpen(true);
  };

  const handleDialogOpen = (isOpen: boolean) => {
    setIsDialogOpen(isOpen);
  };

  const columns: ColumnDef<User>[] = [
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
      accessorKey: "email",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    // {
    //   accessorKey: "role",
    //   header: "Roles",
    // },
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
              {/* <DropdownMenuItem onClick={() => handleViewUser(user)}>
                <UserCircle className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem> */}
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
        <h1 className="text-3xl font-bold">Users</h1>
        <Button
          onClick={() => {
            setCurrentUser(null);
            setNewUser(resetUserState());
            setIsDialogOpen(true);
          }}
          className="rounded-full px-6 py-3"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Super User
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Name filter */}
        <div>
          <label className="text-sm font-medium">Filter by Name</label>
          <Input placeholder="Enter name" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} className="mt-2" />
        </div>

        {/* Role filter */}
        <div>
          <label className="text-sm font-medium">Filter by Role</label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="no-role">No Role</SelectItem>
              {systemRoleOptions.map((sr) => (
                <SelectItem key={sr} value={sr}>
                  {sr}
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
                onChange={(updatedUser: UserFormData) => setNewUser((prev) => ({ ...prev, ...updatedUser }))
                }
              />
            </div>

            {/* Password field for new users */}
            {!currentUser && (
              <div>
                <Input type="password" placeholder="Password *" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
            )}

            {/* Role Selection */}
            {/* <div>
              <label className="text-sm font-medium">Select User Role</label>
              <Select value={newUser.roleId} onValueChange={(value) => setNewUser((prev) => ({ ...prev, roleId: value }))}>
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
            </div> */}

            {/* Project Selection */}
            {/* <div>
              <label className="text-sm font-medium">Assign to Projects *</label>
              {currentUser && editingUserId && userProjectsLoading && (
                <p className="text-sm text-muted-foreground mt-1">Loading current project assignments...</p>
              )}
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded p-3">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-2">
                      <input type="checkbox" id={project.id} checked={newUser.projectIds.includes(project.id)} onChange={() => handleToggleProject(project.id)} />
                      <label htmlFor={project.id} className="text-sm">
                        {project.name}
                      </label>
                      {newUser.projectIds.includes(project.id) && (
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveProject(project.id)} className="ml-auto">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No projects available</p>
                )}
              </div>
            </div> */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogClose(false)}>
              Cancel
            </Button>
            <Button onClick={currentUser ? handleUpdateUser : handleAddUser}>{currentUser ? "Update User" : "Add User"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) {
            setViewingUser(null);
          }
        }}
      >
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
                roleId: roles.find((role) => viewingUser.systemRole === role.name)?.id,
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
              showEditButton={false}
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
            <Button
              onClick={() => {
                if (viewingUser) {
                  setIsViewDialogOpen(false);
                  handleEditUser(viewingUser);
                }
              }}
            >
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
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the user.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
