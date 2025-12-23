"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useProjectOrg } from "@/hooks/useAuth";
import { useProject } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users, Group, ClipboardList, FileText } from "lucide-react";
import React from "react";
import { ProtectedComponent } from "@/components/rbac/ProtectedComponent";
import dynamic from 'next/dynamic';
import { useState } from 'react';
const SchoolLevelReport = dynamic(() => import('@/components/report/SchoolLevelReport'), { ssr: false });

export default function ProjectDashboard({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const { organizations } = useAuth();
  const { orgId: currentOrgId } = useProjectOrg(projectId);

  // Fetch project details dynamically using project ID
  const { data: projectData, isLoading: projectLoading, error: projectError } = useProject(projectId, currentOrgId || undefined);
  
  // Use fetched project name, fallback to "Loading..." or "Unknown Project"
  const projectName = projectData?.name || (projectLoading ? "Loading..." : "Unknown Project");

  // Get organization name from AuthContext
  const currentOrg = organizations.find(org => org.id === currentOrgId);
  const organisationName = currentOrg?.name || "Unknown Organization";
  const [showSchoolReport, setShowSchoolReport] = useState(false);

  // Show loading state if we're still loading project data or org data
  if (projectLoading || !currentOrgId) {
    return (
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="h-10"></div>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-8 w-8 mx-auto" />
                </CardHeader>
                <CardContent className="text-center">
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
    <ProtectedComponent 
      requiredAction="project.read"
      orgId={currentOrgId}
      fallback={
        <main className="p-4 md:p-10 mx-auto max-w-7xl">
          <div className="h-10"></div>
          <div className="text-center py-8">
            <p className="text-red-600">You don't have permission to access this project dashboard.</p>
            <Button onClick={() => router.push("/app/projects")} className="mt-4">
              Back to Projects
            </Button>
          </div>
        </main>
      }
    >
      {/* Show error state if project fetch failed */}
      {projectError ? (
        <main className="p-4 md:p-10 mx-auto max-w-7xl">
          <div className="h-10"></div>
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load project details. Please try again.</p>
          </div>
        </main>
      ) : (
        <main className="p-4 md:p-10 mx-auto max-w-7xl">
          {/* <Button variant="outline" onClick={() => router.push("/app/projects")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button> */}
          <div className="h-10"></div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">{projectName}</h2>
              {/* <p className="text-muted-foreground">
                Organization: {organisationName || "Unknown Organization"}
              </p> */}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
            <ProtectedComponent 
              requiredAction="users.read"
              orgId={currentOrgId}
              fallback={null}
            >
              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 mx-auto text-muted-foreground" /> {/* Icon for Students */}
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    variant="link"
                    className="text-black"
                    onClick={() => router.push(`/app/${projectId}/users`)}
                  >
                    Manage Users
                  </Button>
                </CardContent>
              </Card>
            </ProtectedComponent>
            
            <ProtectedComponent 
              requiredAction="groups.read"
              orgId={currentOrgId}
              fallback={null}
            >
              <Card>
                <CardHeader>
                  <Group className="h-8 w-8 mx-auto text-muted-foreground" /> {/* Icon for Groups */}
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    variant="link"
                    className="text-black"
                    onClick={() => router.push(`/app/${projectId}/usergroups`)}
                  >
                    Manage Groups
                  </Button>
                </CardContent>
              </Card>
            </ProtectedComponent>
            
            <ProtectedComponent 
              requiredAction="assessments.read"
              orgId={currentOrgId}
              fallback={null}
            >
              <Card>
                <CardHeader>
                  <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground" /> {/* Icon for Assessments */}
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    variant="link"
                    className="text-black"
                    onClick={() => router.push(`/app/${projectId}/assessments`)}
                  >
                    Manage RFIs
                  </Button>
                </CardContent>
              </Card>
            </ProtectedComponent>

            <ProtectedComponent 
              requiredAction="assessments.read"
              orgId={currentOrgId}
              fallback={null}
            >
              <Card>
                <CardHeader>
                  <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground" /> {/* Icon for Assessments */}
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    variant="link"
                    className="text-black"
                    onClick={() => router.push(`/app/${projectId}/assessments`)}
                  >
                    Manage Documents
                  </Button>
                </CardContent>
              </Card>
            </ProtectedComponent>
            
            <ProtectedComponent 
              requiredAction="assignments.read"
              orgId={currentOrgId}
              fallback={null}
            >
              <Card>
                <CardHeader>
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground" /> {/* Icon for Assignments */}
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    variant="link"
                    className="text-black"
                    onClick={() => router.push(`/app/${projectId}/assignments`)}
                  >
                    Manage RFI Assignments
                  </Button>
                </CardContent>
              </Card>
            </ProtectedComponent>

            <ProtectedComponent 
              requiredActions={["users.create","users.read","users.list","users.update","users.delete"]}
              orgId={currentOrgId}
              requireAll={true}
              fallback={null}
            >
              <Card>
                <CardHeader>
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    variant="link"
                    className="text-black"
                    onClick={() => setShowSchoolReport(true)}
                  >
                    RFI Reports
                  </Button>
                </CardContent>
              </Card>
            </ProtectedComponent>
          </div>

          {/* Heading for My Assignments */}
          <h3 className="text-2xl font-bold mt-10 mb-4">My Area</h3>

          {/* Second row of cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
            {/* My Assignments Card */}
              <Card>
                <CardHeader>
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground" /> {/* Icon for My Assignments */}
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    variant="link"
                    className="text-black"
                    onClick={() => router.push(`/app/${projectId}/myassignments`)}
                  >
                    My RFI Assignments
                  </Button>
                </CardContent>
              </Card>
          </div>
        </main>
      )}
    </ProtectedComponent>
    {showSchoolReport && currentOrgId && (
      <SchoolLevelReport orgId={currentOrgId!} projectId={projectId} projectName={projectName} onClose={() => setShowSchoolReport(false)} />
    )}
    </>
  );
} 