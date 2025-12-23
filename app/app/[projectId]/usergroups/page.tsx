"use client";
import React, { use, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Edit, Trash2, ArrowUpDown, Eye, Search, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useProjectOrg } from "@/hooks/useAuth";
import { useProject } from "@/hooks/useProjects";
import { ProtectedComponent } from "@/components/rbac/ProtectedComponent";
import { useUsersByProject } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useUsers";
import { 
  useGroups, 
  useGroupAdmins, 
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useAssignUsersToGroup,
  useRemoveUserFromGroup
} from "@/hooks/useGroups";
import { UserDetailsModal } from "@/components/user/UserDetailsModal";
import GroupLevelReport from '@/components/report/GroupLevelReport';
interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  managerId?: string;
  manager?: { id: string; name: string };
  members?: { id: string; user: { name: string } }[];
}

export default function GroupsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();  const { orgId: currentOrgId } = useProjectOrg(projectId);

  // Fetch project details dynamically using project ID
  const { data: projectData, isLoading: projectLoading } = useProject(projectId, currentOrgId || undefined);
  
  // Use fetched project name, fallback to "Loading..." or "Unknown Project"
  const projectName = projectData?.name || (projectLoading ? "Loading..." : "Unknown Project");

  // TanStack Query hooks
  const { data: groups = [], isLoading: groupsLoading } = useGroups(currentOrgId || '');
  const { data: groupAdmins = [], isLoading: groupAdminsLoading } = useGroupAdmins(currentOrgId || '');
  const { data: projectUsers = [], isLoading: projectUsersLoading } = useUsersByProject(currentOrgId || '', projectId);
  const { data: roles = [], isLoading: rolesLoading } = useRoles(currentOrgId || '');

  // Mutations
  const createGroupMutation = useCreateGroup();
  const updateGroupMutation = useUpdateGroup();
  const deleteGroupMutation = useDeleteGroup();
  const assignUsersMutation = useAssignUsersToGroup();
  const removeUserMutation = useRemoveUserFromGroup();

  // Local state
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [newGroup, setNewGroup] = useState<Omit<Group, "id" | "createdAt" | "description">>({
    name: "",
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isAssignUsersDialogOpen, setIsAssignUsersDialogOpen] = useState(false);
  const [isViewUsersDialogOpen, setIsViewUsersDialogOpen] = useState(false);
  const [groupToAssignUsers, setGroupToAssignUsers] = useState<Group | null>(null);
  const [groupToViewUsers, setGroupToViewUsers] = useState<Group | null>(null);
  // State for viewing user details modal
  const [isViewUserDetailModalOpen, setIsViewUserDetailModalOpen] = useState(false);
  const [viewUserDetail, setViewUserDetail] = useState<any | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // Manager selection state
  const [managerSearchTerm, setManagerSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");

  // User assignment role filter state
  const [userAssignRoleFilter, setUserAssignRoleFilter] = useState<string>("all");

  const [isRemoveUserDialogOpen, setIsRemoveUserDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ groupId: string; memberId: string } | null>(null);
  const [isGroupReportOpen, setIsGroupReportOpen] = useState(false);
  const [groupForReport, setGroupForReport] = useState<Group | null>(null);

  // Filter users based on search term and role filter for user assignment
  const filteredUsers = React.useMemo(() => {
    let filtered = projectUsers;

    // Filter by role if selected
    if (userAssignRoleFilter !== "all") {
      filtered = filtered.filter(user => {
        const userRoles = Array.isArray(user.roleIds) ? user.roleIds : (user.roleId ? [user.roleId] : []);
        return userRoles.includes(userAssignRoleFilter);
      });
    }

    // Filter by search term (name or email)
    if (userSearchTerm.trim()) {
      const searchTerm = userSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [projectUsers, userAssignRoleFilter, userSearchTerm]);

  // Get current group member user IDs for checking if user is already in group
  const currentMemberUserIds = React.useMemo(() => {
    if (!groupToAssignUsers?.members) return new Set();
    return new Set(groupToAssignUsers.members.map((member: any) => member.userId));
  }, [groupToAssignUsers?.members]);

  // Get current group member user IDs for view dialog
  const currentViewMemberUserIds = React.useMemo(() => {
    if (!groupToViewUsers?.members) return new Set();
    return new Set(groupToViewUsers.members.map((member: any) => member.userId));
  }, [groupToViewUsers?.members]);

  // Extract unique roles from project users for filtering
  const availableRoles = React.useMemo(() => {
    const roleMap = new Map();
    
    projectUsers.forEach(user => {
      const userRoles = Array.isArray(user.roleIds) ? user.roleIds : (user.roleId ? [user.roleId] : []);
      userRoles.forEach(roleId => {
        if (roleId && !roleMap.has(roleId)) {
          // Find role name from roles data
          const roleData = roles.find(role => role.id === roleId);
          roleMap.set(roleId, {
            id: roleId,
            name: roleData?.name || `Role ${roleId.substring(0, 8)}...`
          });
        }
      });
    });
    
    return Array.from(roleMap.values());
  }, [projectUsers, roles]);

  // Filter and search project users for manager selection
  const filteredManagerCandidates = React.useMemo(() => {
    let filtered = projectUsers;

    // Filter by role if selected
    if (selectedRoleFilter !== "all") {
      filtered = filtered.filter(user => {
        const userRoles = Array.isArray(user.roleIds) ? user.roleIds : (user.roleId ? [user.roleId] : []);
        return userRoles.includes(selectedRoleFilter);
      });
    }

    // Filter by search term (name or email)
    if (managerSearchTerm.trim()) {
      const searchTerm = managerSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [projectUsers, selectedRoleFilter, managerSearchTerm]);

  // Create combined list of available managers (group admins + current managers) - DEPRECATED
  // Keeping for backward compatibility if needed
  const availableManagers = React.useMemo(() => {
    const adminIds = new Set(groupAdmins.map(admin => admin.id));
    const currentManagers = groups
      .filter(group => group.manager && !adminIds.has(group.manager!.id))
      .map(group => group.manager!)
      .filter((manager, index, self) => 
        index === self.findIndex(m => m.id === manager.id)
      ); // Remove duplicates
    
    return [...groupAdmins, ...currentManagers];
  }, [groupAdmins, groups]);

  // Loading state
  if (groupsLoading || groupAdminsLoading || rolesLoading) {
    return (
      <div className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="h-10"></div>
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded"></div>
          <div className="h-96 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  const handleSaveGroup = async () => {
    if (!newGroup.name.trim() || !selectedManagerId) {
      return;
    }

    const groupData = {
      name: newGroup.name,
      managerId: selectedManagerId,
      ...(currentGroup ? {} : { projectId }),
    };

    if (currentGroup) {
      updateGroupMutation.mutate(
        { orgId: currentOrgId!, groupId: currentGroup.id, groupData },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setCurrentGroup(null);
            setNewGroup({ name: "" });
            setSelectedManagerId(null);
            setManagerSearchTerm("");
            setSelectedRoleFilter("all");
          },
        }
      );
    } else {
      createGroupMutation.mutate(
        { orgId: currentOrgId!, groupData },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setCurrentGroup(null);
            setNewGroup({ name: "" });
            setSelectedManagerId(null);
            setManagerSearchTerm("");
            setSelectedRoleFilter("all");
          },
        }
      );
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete || !currentOrgId) {
      return;
    }

    deleteGroupMutation.mutate(
      { orgId: currentOrgId, groupId: groupToDelete },
      {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setGroupToDelete(null);
        },
      }
    );
  };

  const handleAssignUsers = async () => {
    if (!groupToAssignUsers || selectedUserIds.length === 0) {
      return;
    }

    // Convert projectUser IDs to actual user IDs
    const actualUserIds = selectedUserIds.map(projectUserId => {
      const projectUser = projectUsers.find(u => u.id === projectUserId);
      // Extract the actual user ID from the nested structure: projectUser.orgUser.user.id
      const actualUserId = projectUser?.orgUser?.user?.id;
      return actualUserId || projectUserId; // Fallback to projectUserId if not found
    });

    assignUsersMutation.mutate(
      {
        orgId: currentOrgId!,
        groupId: groupToAssignUsers.id,
        userIds: actualUserIds,
      },
      {
        onSuccess: () => {
          setSelectedUserIds([]);
          setUserSearchTerm("");
          setUserAssignRoleFilter("all");
          setIsAssignUsersDialogOpen(false);
          setGroupToAssignUsers(null);
        },
      }
    );
  };

  const handleRemoveUser = async () => {
    if (!memberToRemove || !currentOrgId) {
      return;
    }

    removeUserMutation.mutate(
      {
        orgId: currentOrgId,
        groupId: memberToRemove.groupId,
        memberId: memberToRemove.memberId,
      },
      {
        onSuccess: () => {
          setIsRemoveUserDialogOpen(false);
          setMemberToRemove(null);
          // Close whichever dialog is open
          setIsAssignUsersDialogOpen(false);
          setIsViewUsersDialogOpen(false);
          setGroupToAssignUsers(null);
          setGroupToViewUsers(null);
          // Reset user assignment filters
          setUserSearchTerm("");
          setUserAssignRoleFilter("all");
        },
      }
    );
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };  const columns = [
    {
      accessorKey: "name",
      header: ({ column }: { column: any }) => (
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
      id: "viewUsers",
      header: "View Users", 
      cell: ({ row }: { row: { original: Group } }) => {
        const group = row.original;
        return (
          <ProtectedComponent requiredAction="groups.read" orgId={currentOrgId || undefined}>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => {
                setGroupToViewUsers(group);
                setIsViewUsersDialogOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </ProtectedComponent>
        );
      },
    },
    {
      id: "assignUsers",
      header: "Assign Users",
      cell: ({ row }: { row: { original: Group } }) => {
        const group = row.original;
        return (
          <ProtectedComponent requiredAction="groups.addUserToGroup" orgId={currentOrgId || undefined}>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => {
                setGroupToAssignUsers(group);
                setSelectedUserIds([]);
                setUserSearchTerm("");
                setUserAssignRoleFilter("all");
                setIsAssignUsersDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </ProtectedComponent>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: Group } }) => {
        const group = row.original;
        return (
          <ProtectedComponent
            requiredActions={["groups.update", "groups.read", "groups.delete"]}
            requireAll={false}
            orgId={currentOrgId || undefined}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <ProtectedComponent requiredAction="groups.update" orgId={currentOrgId || undefined}>
                  <DropdownMenuItem
                    onClick={() => {
                      setCurrentGroup(group);
                      setNewGroup({ name: group.name });
                      // Set manager ID from either managerId field or manager object
                      setSelectedManagerId(group.managerId || group.manager?.id || null);
                      setManagerSearchTerm("");
                      setSelectedRoleFilter("all");
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                </ProtectedComponent>
                <ProtectedComponent requiredAction="groups.read" orgId={currentOrgId || undefined}>
                <DropdownMenuItem
                  onClick={() => {
                    setGroupForReport(group);
                    setIsGroupReportOpen(true);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Group Report
                </DropdownMenuItem>
                </ProtectedComponent>
                <ProtectedComponent requiredAction="groups.delete" orgId={currentOrgId || undefined}>
                  <DropdownMenuItem
                    onClick={() => {
                      setGroupToDelete(group.id);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </ProtectedComponent>
              </DropdownMenuContent>
            </DropdownMenu>
          </ProtectedComponent>
        );
      },
    }
  ];

  return (
    <div className="p-4 md:p-10 mx-auto max-w-7xl">
      <div className="h-10"></div>      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{projectName} - User Groups</h1>
        <ProtectedComponent requiredAction="groups.create" orgId={currentOrgId || undefined}>
          <Button
            onClick={() => {
              setCurrentGroup(null);
              setNewGroup({ name: "" });
              setSelectedManagerId(null);
              setManagerSearchTerm("");
              setSelectedRoleFilter("all");
              setIsDialogOpen(true);
            }}
            className="rounded-full px-6 py-3"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Group
          </Button>
        </ProtectedComponent>
      </div>

      <DataTable columns={columns} data={groups} />

      {isGroupReportOpen && groupForReport && (
        <GroupLevelReport
          orgId={currentOrgId || ''}
          projectId={projectId}
          groupId={groupForReport.id}
          groupName={groupForReport.name}
          onClose={() => {
            setIsGroupReportOpen(false);
            setGroupForReport(null);
          }}
        />
      )}

      {/* Add/Edit Group Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          // Reset search state when dialog closes
          setManagerSearchTerm("");
          setSelectedRoleFilter("all");
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentGroup ? "Edit Group" : "Add Group"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Group Name"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium mb-4">Manager Selection</label>
              
              {/* Role Filter */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-2">Filter by Role</label>
                <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Input */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-2">Search Manager</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name or email..."
                    value={managerSearchTerm}
                    onChange={(e) => setManagerSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Manager Selection */}
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {projectUsersLoading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : filteredManagerCandidates.length > 0 ? (
                  <div className="divide-y">
                    {filteredManagerCandidates.map((user) => {
                      const isSelected = selectedManagerId === user.orgUser?.user?.id;
                      const actualUserId = user.orgUser?.user?.id;
                      const userRoles = Array.isArray(user.roleIds) ? user.roleIds : (user.roleId ? [user.roleId] : []);
                      
                      return (
                        <div
                          key={user.id}
                          className={`p-3 transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedManagerId(actualUserId || null)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                                  isSelected 
                                    ? 'bg-blue-500 border-blue-500' 
                                    : 'border-gray-300'
                                }`}>
                                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {user.name}
                                  </div>
                                  <div className="text-sm text-blue-600">
                                    {user.email}
                                  </div>
                                  {userRoles.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Roles: {userRoles.map(roleId => {
                                        const roleData = roles.find(r => r.id === roleId);
                                        return roleData?.name || `${roleId.substring(0, 8)}...`;
                                      }).join(', ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {managerSearchTerm || selectedRoleFilter !== "all" 
                      ? 'No users found matching your criteria' 
                      : 'No users available for manager selection'}
                  </div>
                )}
              </div>

              {/* Selected Manager Info */}
              {selectedManagerId && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-sm font-medium text-green-800">Selected Manager:</div>
                  {(() => {
                    const selectedUser = projectUsers.find(u => u.orgUser?.user?.id === selectedManagerId);
                    return selectedUser ? (
                      <div className="text-sm text-green-700">
                        {selectedUser.name} ({selectedUser.email})
                      </div>
                    ) : (
                      <div className="text-sm text-green-700">Manager selected</div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <ProtectedComponent 
              requiredAction={currentGroup ? "groups.update" : "groups.create"} 
              orgId={currentOrgId || undefined}
            >
              <Button 
                onClick={handleSaveGroup}
                disabled={currentGroup ? updateGroupMutation.isPending : createGroupMutation.isPending}
              >
                {currentGroup 
                  ? updateGroupMutation.isPending 
                    ? "Saving..." 
                    : "Save Changes"
                  : createGroupMutation.isPending 
                    ? "Creating..." 
                    : "Add Group"
                }
              </Button>
            </ProtectedComponent>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this group? This action cannot be undone.</p>          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <ProtectedComponent requiredAction="groups.delete" orgId={currentOrgId || undefined}>
              <Button 
                variant="destructive" 
                onClick={handleDeleteGroup}
                disabled={deleteGroupMutation.isPending}
              >
                {deleteGroupMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </ProtectedComponent>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Users Dialog */}
      <Dialog open={isAssignUsersDialogOpen} onOpenChange={(open) => {
        setIsAssignUsersDialogOpen(open);
        if (!open) {
          // Reset search and filter state when dialog closes
          setUserSearchTerm("");
          setUserAssignRoleFilter("all");
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Assign Users to Group - {groupToAssignUsers?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Add New Users Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Select Project Users to Assign</h3>
              <div className="text-sm text-gray-600 mb-3">
                <span className="inline-flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                  Already in group
                </span>
                <span className="inline-flex items-center gap-1 ml-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  Selected to add
                </span>
              </div>
              
              {/* Role Filter for User Assignment */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Filter by Role</label>
                <Select value={userAssignRoleFilter} onValueChange={setUserAssignRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

            {/* Selected Users Summary */}
            {selectedUserIds.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm font-medium mb-2">
                  Selected Users ({selectedUserIds.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedUserIds.map(userId => {
                    const user = projectUsers.find(u => u.id === userId);
                    return user ? (
                      <div key={userId} className="bg-blue-100 px-2 py-1 rounded text-sm flex items-center gap-1">
                        <span>{user.name}</span>
                        <button
                          onClick={() => handleUserSelection(userId)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Results Summary */}
            <div className="text-sm text-gray-600 mb-4">
              Showing {filteredUsers.length} of {projectUsers.length} users
              {(userAssignRoleFilter !== "all" || userSearchTerm.trim()) && (
                <span> (filtered)</span>
              )}
            </div>

            {/* Users List */}
            <div className="border rounded-md max-h-96 overflow-y-auto">
              {projectUsersLoading ? (
                <div className="text-center py-8">Loading project users...</div>
              ) : filteredUsers.length > 0 ? (
                <div className="divide-y">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    const actualUserId = user.orgUser?.user?.id;
                    const isAlreadyMember = actualUserId && currentMemberUserIds.has(actualUserId);
                    const isDisabled = isAlreadyMember;
                    
                    return (
                      <div
                        key={user.id}
                        className={`p-4 transition-colors ${
                          isDisabled 
                            ? 'bg-gray-50 cursor-not-allowed opacity-60' 
                            : isSelected 
                              ? 'border-l-4 border-l-black cursor-pointer' 
                              : 'hover:bg-gray-50 cursor-pointer'
                        }`}
                        onClick={() => !isDisabled && handleUserSelection(user.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center ${
                                isAlreadyMember 
                                  ? 'bg-green-500 border-green-500' 
                                  : isSelected 
                                    ? 'bg-blue-500 border-blue-500' 
                                    : 'border-gray-300'
                              }`}>
                                {(isSelected || isAlreadyMember) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1">
                                <div className={`font-medium ${isAlreadyMember ? 'text-gray-600' : 'text-gray-900'}`}>
                                  {user.name}
                                  {isAlreadyMember && <span className="ml-2 text-xs text-green-600 font-normal">(Already in group)</span>}
                                </div>
                                <div className="text-sm text-gray-600">{user.email}</div>
                                {user.mobile && (
                                  <div className="text-sm text-gray-500">{user.mobile}</div>
                                )}
                                {/* Display user roles */}
                                {(() => {
                                  const userRoles = Array.isArray(user.roleIds) ? user.roleIds : (user.roleId ? [user.roleId] : []);
                                  if (userRoles.length > 0) {
                                    return (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Roles: {userRoles.map(roleId => {
                                          const roleData = roles.find(r => r.id === roleId);
                                          return roleData?.name || `${roleId.substring(0, 8)}...`;
                                        }).join(', ')}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {userSearchTerm || userAssignRoleFilter !== "all" 
                    ? 'No users found matching your criteria' 
                    : 'No project users available'}
                </div>
              )}
            </div>
            </div>
          </div>          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignUsersDialogOpen(false)}>
              Cancel
            </Button>
            <ProtectedComponent requiredAction="groups.addUserToGroup" orgId={currentOrgId || undefined}>
              <Button 
                onClick={handleAssignUsers}
                disabled={assignUsersMutation.isPending || selectedUserIds.length === 0}
              >
                {assignUsersMutation.isPending 
                  ? "Assigning..." 
                  : `Assign ${selectedUserIds.length} User${selectedUserIds.length !== 1 ? 's' : ''}`
                }
              </Button>
            </ProtectedComponent>
          </DialogFooter>
        </DialogContent>
              </Dialog>

      {/* View Users Dialog */}
      <Dialog open={isViewUsersDialogOpen} onOpenChange={setIsViewUsersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Group Members - {groupToViewUsers?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Group Members ({groupToViewUsers?.members?.length || 0})</h3>
            <div className="border rounded-md max-h-96 overflow-y-auto">
              {groupToViewUsers?.members && groupToViewUsers.members.length > 0 ? (
                <div className="divide-y">
                  {groupToViewUsers.members.map((member: any) => (
                    <div key={member.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-sm text-gray-600">{member.user.email}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setViewUserDetail(member.user);
                            setIsViewUserDetailModalOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                        <ProtectedComponent requiredAction="groups.addUserToGroup" orgId={currentOrgId || undefined}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMemberToRemove({ groupId: groupToViewUsers.id, memberId: member.id });
                              setIsRemoveUserDialogOpen(true);
                            }}
                            disabled={removeUserMutation.isPending}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </Button>
                        </ProtectedComponent>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No members in this group
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewUsersDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Details Modal */}
      {/** @ts-ignore */}
      <UserDetailsModal 
        open={isViewUserDetailModalOpen} 
        onOpenChange={setIsViewUserDetailModalOpen} 
        user={viewUserDetail} 
      />


      {/* Remove User Dialog */}
      <Dialog open={isRemoveUserDialogOpen} onOpenChange={setIsRemoveUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User from Group</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to remove this user from the group?</p>          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveUserDialogOpen(false)}>
              Cancel
            </Button>
            <ProtectedComponent requiredAction="groups.addUserToGroup" orgId={currentOrgId || undefined}>
              <Button 
                variant="destructive" 
                onClick={handleRemoveUser}
                disabled={removeUserMutation.isPending}
              >
                {removeUserMutation.isPending ? "Removing..." : "Remove"}
              </Button>
            </ProtectedComponent>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 