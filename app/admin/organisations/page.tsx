"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCreateOrganization, useAllOrganizations, useOrganizations, useUpdateOrganization, useDeleteOrganization } from "@/hooks/useOrganizations";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Settings, Users, FolderKanban, Plus, MoreVertical, ArrowRight, Search } from "lucide-react";
import { toast } from "sonner";

// Add a simple DropdownMenu component (replace with your UI lib if available)
function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        className="p-2 rounded-full hover:bg-muted"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">{children}</div>
        </div>
      )}
    </div>
  );
}

export default function OrganisationsPage() {
  const { user, isSuperAdmin } = useAuth();
  const router = useRouter();
  const createOrganizationMutation = useCreateOrganization();
  const updateOrganizationMutation = useUpdateOrganization();
  const deleteOrganizationMutation = useDeleteOrganization();

  // Use different hooks based on user role
  const {
    data: userOrganizations = [],
    isLoading: userOrgsLoading,
    error: userOrgsError
  } = useOrganizations(user?.id);

  const {
    data: allOrganizations = [],
    isLoading: allOrgsLoading,
    error: allOrgsError
  } = useAllOrganizations(isSuperAdmin);

  // Determine which data to use based on user role
  const organizations = isSuperAdmin ? allOrganizations : userOrganizations;
  const isLoading = isSuperAdmin ? allOrgsLoading : userOrgsLoading;
  const error = isSuperAdmin ? allOrgsError : userOrgsError;

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    adminEmail: "",
    adminPassword: "",
    adminName: "",
  });
  const [editOrg, setEditOrg] = useState<any | null>(null); // null = create, org object = edit

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<{ id: string; name?: string } | null>(null);

  // Search state
  const [search, setSearch] = useState("");

  // Filter organizations by name (case-insensitive)
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOrganizationClick = (orgId: string, orgName: string) => {
    // Navigate to organization admin dashboard
    toast.success(`Now managing ${orgName}`);
    router.push(`/admin/${orgId}/dashboard`);
  };

  // Open modal for creating
  const handleCreateOrganization = () => {
    setEditOrg(null);
    setFormData({ name: "", description: "", adminEmail: "", adminPassword: "", adminName: "" });
    setIsCreateModalOpen(true);
  };

  // Open modal for editing
  const handleEditOrganization = (org: any) => {
    setEditOrg(org);
    setFormData({
      name: org.name || "",
      description: org.description || "",
      adminEmail: org.adminEmail || "",
      adminPassword: "", // Don't prefill password
      adminName: org.adminName || "",
    });
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Organisation name is required");
      return;
    }

    if (!editOrg) {
      // Only validate admin fields on create
      if (!formData.adminEmail.trim()) {
        toast.error("Admin email is required");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.adminEmail.trim())) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (!formData.adminPassword.trim()) {
        toast.error("Admin password is required");
        return;
      }
      if (formData.adminPassword.trim().length < 6) {
        toast.error("Admin password must be at least 6 characters long");
        return;
      }
      if (!formData.adminName.trim()) {
        toast.error("Admin name is required");
        return;
      }
    }

    try {
      if (editOrg) {
        await updateOrganizationMutation.mutateAsync({
          orgId: editOrg.id,
          data: {
            name: formData.name.trim(),
            description: formData.description.trim(),
          },
        });
        setIsCreateModalOpen(false);
        setEditOrg(null);
      } else {
        await createOrganizationMutation.mutateAsync({
          name: formData.name.trim(),
          description: formData.description.trim(),
          adminEmail: formData.adminEmail.trim(),
          adminPassword: formData.adminPassword.trim(),
          adminName: formData.adminName.trim(),
        });
        setFormData({ name: "", description: "", adminEmail: "", adminPassword: "", adminName: "" });
        setIsCreateModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to create/update organisation:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", adminEmail: "", adminPassword: "", adminName: "" });
  };

  // Open a centered confirmation modal for deletion
  const handleDelete = (orgId: string, orgName?: string) => {
    setOrgToDelete({ id: orgId, name: orgName });
    setIsDeleteModalOpen(true);
  };

  // Confirm deletion (called from modal)
  const confirmDelete = async () => {
    if (!orgToDelete) return;
    try {
      await deleteOrganizationMutation.mutateAsync(orgToDelete.id);
      toast.success(`${orgToDelete.name ?? "Organisation"} deleted`);
    } catch (err) {
      console.error("Failed to delete organisation:", err);
      toast.error("Failed to delete organisation");
    } finally {
      setIsDeleteModalOpen(false);
      setOrgToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading organisations...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-500">
            Error loading organisations. Please try again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Title and subtitle at the top */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Organisations</h1>
        {/* <p className="text-muted-foreground">
          {isSuperAdmin 
            ? "Manage all organisations in the system" 
            : "Manage my organisations and their settings"
          }
        </p> */}
      </div>

      {/* Controls row: search, create, menu */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <Input
              type="text"
              placeholder="Search organisations by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 md:flex-row md:items-center">
          {isSuperAdmin && (
            <>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreateOrganization}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Organisation
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editOrg ? "Edit Organisation" : "Create New Organisation"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organisation Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter organisation name"
                        value={formData.name}
                        onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter organisation description (optional)"
                        value={formData.description}
                        onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    {/* Show read-only organisation info when editing */}
                    {editOrg && (
                      <div >
                        <h4 className="text-sm font-normal mb-1">Organisation Info</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <p className="text-xs font-medium">Projects</p>
                            <p className="text-sm">
                              {editOrg.projects?.length ?? editOrg.projectCount ?? 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium">Status</p>
                            <p className="text-sm capitalize">{editOrg.status ?? "Active"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium">Created</p>
                            <p className="text-sm">
                              {editOrg.createdAt ? new Date(editOrg.createdAt).toLocaleDateString() : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium">Organisation Users</p>
                            <p className="text-sm">{editOrg.orgUsers ? `${editOrg.orgUsers.length} users` : "0 users"}</p>
                          </div>
                        </div>

                        {/* {editOrg.orgUsers && editOrg.orgUsers.length > 0 && (
                          <div className="mt-3 text-sm">
                            {editOrg.orgUsers.slice(0, 3).map((ou: any) => (
                              <p key={ou.id} className="leading-tight">
                                {ou.user?.name ?? ou.name} {ou.user?.email ? `(${ou.user.email})` : ""}
                              </p>
                            ))}
                            {editOrg.orgUsers.length > 3 && (
                              <p className="text-xs text-muted-foreground">+{editOrg.orgUsers.length - 3} more...</p>
                            )}
                          </div>
                        )} */}
                      </div>
                    )}

                    {/* Divider and Admin User Section */}
                    {!editOrg && (
                      <div className="border-t pt-4">
                        <h3 className="text-lg font-medium mb-4">Organisation Administrator</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="adminName">Admin Name *</Label>
                            <Input
                              id="adminName"
                              type="text"
                              placeholder="Enter admin full name"
                              value={formData.adminName}
                              onChange={(e) => setFormData(f => ({ ...f, adminName: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="adminEmail">Admin Email *</Label>
                            <Input
                              id="adminEmail"
                              type="email"
                              placeholder="Enter admin email address"
                              value={formData.adminEmail}
                              onChange={(e) => setFormData(f => ({ ...f, adminEmail: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="adminPassword">Admin Password *</Label>
                            <Input
                              id="adminPassword"
                              type="password"
                              placeholder="Enter admin password (min 6 characters)"
                              value={formData.adminPassword}
                              onChange={(e) => setFormData(f => ({ ...f, adminPassword: e.target.value }))}
                              required
                              minLength={6}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          setEditOrg(null);
                          setFormData({ name: "", description: "", adminEmail: "", adminPassword: "", adminName: "" });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createOrganizationMutation.isPending}
                      >
                        {editOrg
                          ? "Update Organisation"
                          : (createOrganizationMutation.isPending ? "Creating..." : "Create Organisation")}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

            </>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog (centered) */}
      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => { if (!open) { setOrgToDelete(null); } setIsDeleteModalOpen(open); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Confirm delete</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium">{orgToDelete?.name ?? "this organisation"}</span>?
              This action cannot be undone.
            </p>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => { setIsDeleteModalOpen(false); setOrgToDelete(null); }}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteOrganizationMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteOrganizationMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrganizations.map((org) => (
          <Card
            key={org.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center cursor-pointer" onClick={() => handleEditOrganization(org)}>
                  <CardTitle className="text-lg flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    {org.name}
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {isSuperAdmin && (
                    <>
                      {/* <Badge variant="secondary" className="text-xs">
                        Super Admin
                      </Badge> */}
                      <DropdownMenu>
                        <button
                          className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                          onClick={() => handleEditOrganization(org)}
                        >
                          Edit
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(org.id, org.name)}
                        >
                          Delete
                        </button>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {org.description || "No description available"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{org.orgUsers?.length || 0} members</span>
                </div>
                <div className="flex items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.open(`/admin/${org.id}/dashboard`, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrganizations.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organisations found</h3>
          <p className="text-gray-500">
            {isSuperAdmin
              ? "Create your first organisation to get started."
              : "You don't have access to any organisations yet."
            }
          </p>
        </div>
      )}
    </div>
  );
}