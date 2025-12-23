"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, Users, Shield, Settings, Activity } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  useOrganization, 
  useOrganizationProjects, 
  useOrganizationUsers,
  useOrganizationRoles
} from "@/hooks/useOrganizations";
import { RouteGuard } from "@/components/rbac/RouteGuard";

// Define types to match the API responses
type Organization = {
  id: string;
  name: string;
  description?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  permissions?: string[];
  role?: string | null;
  orgUsers?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
};

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  systemRole?: string;
  joinedAt: string;
  isVerified?: boolean;
  permissions?: string[];
};

type Role = {
  id: string;
  name: string;
  description?: string;
  isSystemRole?: boolean;
  permissions?: Permission[];
  userCount?: number;
};

type Permission = {
  id: string;
  name: string;
  description?: string;
  actions: string[];
};

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
};

function OrganizationDashboardPageContent() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const { user } = useAuth();
  
  // TanStack Query hooks for specific organization
  const { data: organization, isLoading: orgLoading } = useOrganization(orgId);
  const { data: usersData, isLoading: usersLoading } = useOrganizationUsers(orgId);
  const { data: roles = [], isLoading: rolesLoading } = useOrganizationRoles(orgId);
  const { data: projects = [], isLoading: projectsLoading } = useOrganizationProjects(orgId);
  
  // Extract users from the users data structure
  const members: Member[] = usersData?.users?.map((user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    systemRole: 'ORG_USER', // Default value since not provided by API
    joinedAt: new Date().toISOString(), // Mock value since not provided by API
    isVerified: true, // Mock value since not provided by API
  })) || [];

  // Loading state
  if (orgLoading || usersLoading || rolesLoading) {
    return (
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted animate-pulse rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted animate-pulse rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!organization) {
    return (
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-muted-foreground">Organisation not found</h2>
          {/* Show button only for SUPER_USER */}
          {/* {user?.systemRole === "SUPER_USER" && (
            <Button onClick={() => router.push("/admin/organisations")} className="mt-4">
              Back to Organizations
            </Button>
          )} */}
        </div>
      </main>
    );
  }

  const handleBackToOrganizations = () => {
    router.push("/admin/organisations");
  };

  // Calculate stats
  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter((m: Member) => m.isVerified).length,
    totalRoles: roles.length,
    systemRoles: roles.filter((r: Role) => r.isSystemRole).length,
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length
  };

  // Navigation handlers for clickable cards
  const handleNavigateToUsers = () => {
    router.push(`/admin/${orgId}/users`);
  };

  const handleNavigateToRoles = () => {
    router.push(`/admin/${orgId}/roles`);
  };

  const handleNavigateToProjects = () => {
    router.push(`/admin/${orgId}/projects`);
  };

  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl">
      {/* Show button only for SUPER_USER */}
      {/* {user?.systemRole === "SUPER_USER" && (
        <Button 
          variant="outline" 
          onClick={handleBackToOrganizations}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Organizations
        </Button>
      )} */}
      {/* Organization Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{organization.name}</h1>
          <p className="text-muted-foreground">{organization.description}</p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm text-muted-foreground">
              Created: {new Date(organization.createdAt).toLocaleDateString()}
            </span>
            {organization.updatedAt && (
              <span className="text-sm text-muted-foreground">
                Updated: {new Date(organization.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {/* <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            Invite Members
          </Button>
        </div> */}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow text-white bg-cool_blue"
          onClick={handleNavigateToProjects}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Building2 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs">
              {stats.totalProjects} active
            </p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-md text-white transition-shadow bg-primary_orange"
          onClick={handleNavigateToUsers}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs ">
              {stats.activeMembers} active
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow text-black bg-sunny_yellow"
          onClick={handleNavigateToRoles}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <Shield className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoles}</div>
            <p className="text-xs">
              Manage permissions
            </p>
          </CardContent>
        </Card>
        
        
      </div>

      {/* Organization Overview Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Organization Details */}
        <Card>
          <CardHeader>
            <CardTitle>Organisation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p>{organization.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p>{organization.description || "No description provided"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="capitalize">{organization.status || "Active"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p>{new Date(organization.createdAt).toLocaleDateString()}</p>
            </div>
            {organization.orgUsers && organization.orgUsers.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Organisation Users</p>
                <div className="mt-2 space-y-1">
                  {organization.orgUsers.slice(0, 3).map((orgUser) => (
                    <p key={orgUser.id} className="text-sm">
                      {orgUser.user.name} ({orgUser.user.email})
                    </p>
                  ))}
                  {organization.orgUsers.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      +{organization.orgUsers.length - 3} more...
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full bg-soft_pink`}>

                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground">No projects found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function OrganizationDashboardPage() {
  return (
    <RouteGuard 
      requiredSystemRole={["SUPER_USER", "ORG_ADMIN"]}
      redirectTo="/app/projects"
    >
      <OrganizationDashboardPageContent />
    </RouteGuard>
  );
}