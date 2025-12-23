"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, ArrowUpDown } from "lucide-react";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { mcApiService } from "@/lib/mcApiService";
import { ColumnDef } from "@tanstack/react-table";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useParams } from "next/navigation";
import React from "react";

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  projectCode?: string; // renamed from `code` to `projectCode`
}

export default function OrganizationProjectsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false); // Track AlertDialog state
  const router = useRouter();

  useEffect(() => {
    if (orgId) {
      fetchProjects(orgId);
    } else {
      toast.error("No organization selected");
    }
  }, [orgId]);

  const fetchProjects = async (organizationId: string) => {
    try {
      const response = await mcApiService.get(`/organisations/${organizationId}/projects`);
      setProjects(response.projects);
    } catch (error) {
      toast.error("Failed to fetch projects");
    }
  };

  const handleAddProject = () => {
    setDialogMode("add");
    setCurrentProject({ id: "", name: "", description: "", createdAt: "", projectCode: "" }); // include projectCode
    setIsDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setDialogMode("edit");
    setCurrentProject(project);
    setIsDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!orgId || !projectToDelete) return;

    try {
      await mcApiService.delete(`/organisations/${orgId}/projects/${projectToDelete.id}`);
      toast.success(`Project "${projectToDelete.name}" has been deleted`);
      setProjectToDelete(null);
      setIsAlertDialogOpen(false); // Close the AlertDialog after deletion
      fetchProjects(orgId); // Refresh the project list
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const handleSubmit = async () => {
    if (!currentProject?.name.trim() || !currentProject?.description.trim()) {
      toast.error("Both project name and description are required");
      return;
    }

    if (!orgId) {
      toast.error("No organization selected");
      return;
    }

    try {
      if (dialogMode === "add") {
        const newProject = {
          name: currentProject.name,
          description: currentProject.description,
          projectCode: currentProject.projectCode || "", // include optional projectCode
        };
        await mcApiService.post(`/organisations/${orgId}/projects`, newProject);
        toast.success(`Project "${newProject.name}" has been created`);
      } else if (dialogMode === "edit" && currentProject.id) {
        const updatedProject = {
          name: currentProject.name,
          description: currentProject.description,
          projectCode: currentProject.projectCode || "", // use projectCode for updates
        };
        await mcApiService.patch(
          `/organisations/${orgId}/projects/${currentProject.id}`,
          updatedProject
        );
        toast.success(`Project "${updatedProject.name}" has been updated`);
      }
      setIsDialogOpen(false);
      setCurrentProject(null);
      fetchProjects(orgId); // Refresh the project list
    } catch (error) {
      toast.error("Failed to save project");
    }
  };

  const columns: ColumnDef<Project>[] = [
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
      cell: ({ row }) => (
        <Button
          variant="link"
          className="text-black"
          onClick={() => {
            const projectDashboardUrl = `/app/${row.original.id}/dashboard?projectName=${encodeURIComponent(
              row.original.name
            )}`;
            window.open(projectDashboardUrl, '_blank');
          }}
        >
          {row.original.name}
        </Button>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "projectCode", // changed from "code" to "projectCode"
      header: "Code",
      cell: ({ row }) => row.original.projectCode || "-",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: Project } }) => {
        const project = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditProject(project)}>
                Edit
              </DropdownMenuItem>
              <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event propagation
                      setProjectToDelete(project);
                      setIsAlertDialogOpen(true); // Open the AlertDialog
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the project.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event propagation
                        setIsAlertDialogOpen(false); // Close the AlertDialog
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event propagation
                        handleDeleteProject();
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="p-4 md:p-10 mx-auto max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button className="rounded-full px-6 py-2" onClick={handleAddProject}>
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={projects}
      />

      {/* Add/Edit Project Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Create Project" : "Edit Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              className="rounded-full px-4 py-2"
              placeholder="Project Name"
              value={currentProject?.name || ""}
              onChange={(e) =>
                setCurrentProject((prev) => ({
                  ...prev!,
                  name: e.target.value,
                }))
              }
            />
            <Input
              className="rounded-full px-4 py-2"
              placeholder="Project Code (optional)"
              value={currentProject?.projectCode || ""}
              onChange={(e) =>
                setCurrentProject((prev) => ({
                  ...prev!,
                  projectCode: e.target.value,
                }))
              }
            />
            <Textarea
              className="rounded-full px-4 py-2"
              placeholder="Project Description"
              value={currentProject?.description || ""}
              onChange={(e) =>
                setCurrentProject((prev) => ({
                  ...prev!,
                  description: e.target.value,
                }))
              }
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full px-6 py-2"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="rounded-full px-6 py-2" onClick={handleSubmit}>
              {dialogMode === "add" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}