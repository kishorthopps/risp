"use client";

import { use } from "react";
import { useAuth, useProjectOrg } from "@/hooks/useAuth";
import { useProject } from "@/hooks/useProjects";
import { useForms } from "@/hooks/useForms";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { FileVideo, Image as ImageIcon } from "lucide-react";

export default function MyAssignmentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const { orgId: currentOrgId } = useProjectOrg(projectId);

  const { data: projectData, isLoading: projectLoading } = useProject(projectId, currentOrgId || undefined);

  // Fetch only forms that have media
  const { data: formsWithMedia, isLoading: formsLoading } = useForms(currentOrgId || "", projectId, true);

  const projectName = projectData?.name || (projectLoading ? "Loading..." : "Unknown Project");

  if (formsLoading || projectLoading) {
    return (
      <div className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="space-y-4">
          <div className="h-8 w-1/3 bg-muted animate-pulse rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 mx-auto max-w-[1440px]">
      <div className="h-10"></div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{projectName} - Media Gallery</h1>
          <p className="text-muted-foreground mt-2">
            Select a form to view its uploaded media and recordings.
          </p>
        </div>
      </div>

      {!formsWithMedia || formsWithMedia.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-md bg-gray-50">
          <FileVideo className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <h3 className="text-lg font-medium text-gray-900">No media found</h3>
          <p>No forms with uploaded media were found in this project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {formsWithMedia.map((form) => (
            <Card
              key={form.id}
              className="cursor-pointer hover:shadow-lg transition-shadow border-t-4 border-t-primary_orange"
              onClick={() => router.push(`/app/${projectId}/assignments/${form.id}`)}
            >
              <CardHeader>
                <CardTitle className="truncate" title={form.title}>{form.title}</CardTitle>
                <CardDescription className="line-clamp-2">{form.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileVideo className="h-4 w-4" />
                    <ImageIcon className="h-4 w-4" />
                    <span>View Media</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}