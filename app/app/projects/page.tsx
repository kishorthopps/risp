"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, FolderKanban, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from '@tanstack/react-query';
import { mcApiService } from "@/lib/mcApiService";
import { queryKeys } from "@/lib/queryClient";
import { useState, useMemo, useEffect } from "react";

interface ProjectWithOrg {
  id: string;
  name: string;
  description: string;
  organisationId: string;
  organisationName: string;
  createdAt: string;
}

interface GroupedProjects {
  [orgId: string]: {
    organisationName: string;
    projects: ProjectWithOrg[];
  };
}

export default function ProjectSelectorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, organizations } = useAuth();

  // Set initial selected org from query param (if provided)
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  // Replace previous useMemo default logic with effect that respects query param
  useEffect(() => {
    const paramOrg = searchParams?.get?.("orgId") || "";
    if (paramOrg) {
      setSelectedOrgId(paramOrg);
      return;
    }

    // fallback to first organization when none in query
    if (!selectedOrgId && organizations.length > 0) {
      setSelectedOrgId(organizations[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizations, searchParams]);

  // Use TanStack Query for data fetching - fetch only projects assigned to the user
  const { 
    data: groupedProjects = {}, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: queryKeys.projects.byUser(user?.id || ''),
    queryFn: async (): Promise<GroupedProjects> => {
      if (!user?.id) throw new Error('No user ID');
      
      const grouped: GroupedProjects = {};
      
      // For each organization, fetch projects assigned to the user
      for (const org of organizations) {
        try {
          const response = await mcApiService.get(`/organisations/${org.id}/users/${user.id}/projects`);
          
          if (response.projects?.length > 0) {
            grouped[org.id] = {
              organisationName: org.name,
              projects: response.projects.map((project: any) => ({
                ...project,
                organisationId: org.id,
                organisationName: org.name
              }))
            };
          }
        } catch (error) {
          // User might not have access to projects in this org or no projects assigned - skip silently
          console.log(`No assigned projects for user ${user.id} in org ${org.id}`);
        }
      }
      
      return grouped;
    },
    enabled: !!user?.id && organizations.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filtered projects based on selected organization
  const filteredGroupedProjects = useMemo(() => {
    if (!selectedOrgId) return {};
    if (groupedProjects[selectedOrgId]) {
      return { [selectedOrgId]: groupedProjects[selectedOrgId] };
    }
    return {};
  }, [groupedProjects, selectedOrgId]);

  const handleProjectClick = (projectId: string, organizationId: string, projectName: string) => {
    router.push(`/app/${projectId}/dashboard`);
  };

  // Handle hover for potential prefetching
  const handleProjectHover = (projectId: string) => {
    // Could add prefetching logic here in the future
  };

  // Loading state with skeletons
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="space-y-8">
          {[1, 2].map((org) => (
            <div key={org} className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-muted-foreground animate-pulse" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((project) => (
                  <Card key={project} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-9 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg font-semibold text-destructive mb-2">Failed to load projects</div>
            <p className="text-muted-foreground mb-4">There was an error loading your projects.</p>
            <Button onClick={() => refetch()} variant="outline">
              <Loader2 className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No projects state (check filteredGroupedProjects)
  if (Object.keys(filteredGroupedProjects).length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Projects</h1>
          
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-lg font-semibold mb-2">No projects found</div>
            <p className="text-muted-foreground">You don't have any projects yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Projects</h1>
       
      </div>
      <div className="space-y-8">
        {Object.entries(filteredGroupedProjects).map(([orgId, orgData]) => (
          <div key={orgId} className="space-y-4">
            {/* Organization Header */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center space-x-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{orgData.organisationName}</h2>
                <Badge variant="secondary">{orgData.projects.length} projects</Badge>
              </div>
            </div>
            {/* Projects Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {orgData.projects.map((project) => (
                <Card 
                  key={project.id} 
                  className="hover:shadow-md transition-all duration-200 cursor-pointer border-2 hover:border-primary/20"
                  onClick={() => handleProjectClick(project.id, project.organisationId, project.name)}
                  onMouseEnter={() => handleProjectHover(project.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(project.createdAt || Date.now()).toLocaleDateString()}
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}