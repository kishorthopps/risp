"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Building2, 
  Briefcase, 
  Settings, 
  Crown, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  Heart, 
  Users2, 
  DollarSign, 
  Languages,
  Key,
  Lock
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { User, AuthOrganization } from "@/lib/types";
import { useQuery } from '@tanstack/react-query';
import { mcApiService } from '@/lib/mcApiService';
import { ChangePasswordDialog } from "./ChangePasswordDialog";

// Interface definitions
interface ProfileComponentProps {
  user: User;
  organizations?: AuthOrganization[];
  context?: 'admin' | 'app' | 'unified';
  showOrganizations?: boolean;
  showAccessSummary?: boolean;
}

interface ProfileHeaderProps {
  user: User;
  context: 'admin' | 'app' | 'unified';
}

interface PersonalInfoCardProps {
  user: User;
  context: 'admin' | 'app' | 'unified';
}

interface OrganizationsCardProps {
  organizations: AuthOrganization[];
  user: User;
  context: 'admin' | 'app';
}

interface AccessSummaryCardProps {
  organizations: AuthOrganization[];
  user: User;
  context: 'admin' | 'app';
}

// Custom hook to fetch user details
function useUserDetails(userId: string) {
  return useQuery({
    queryKey: ['user-details', userId],
    queryFn: async () => {
      try {
        const response = await mcApiService.get(`/users/${userId}`);
        // Handle different possible response structures
        if (response?.user) {
          return response.user;
        } else if (response?.data?.user) {
          return response.data.user;
        } else if (response?.data) {
          return response.data;
        } else {
          return response;
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        // Return a fallback object instead of undefined
        return { extras: {} };
      }
    },
    enabled: !!userId,
  });
}

// Profile Header Component
function ProfileHeader({ user, context }: ProfileHeaderProps) {
  const getHeaderConfig = () => {
    switch (context) {
      default:
        return {
          gradientClass: "bg-soft_pink",
          title: "User Profile"
        };
    }
  };

  const { gradientClass, title } = getHeaderConfig();
  const showCrown = user.systemRole === 'SUPER_USER' && (context === 'admin' || context === 'unified');

  return (
    <div className="text-center space-y-2 sm:space-y-3">
      <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto ${gradientClass} rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold relative`}>
        {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
        {showCrown && (
          <Crown className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
        )}
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold">{user.name}</h1>
      <p className="text-sm sm:text-base text-muted-foreground">{title}</p>
    </div>
  );
}

// Personal Information Card Component
function PersonalInfoCard({ user, context }: PersonalInfoCardProps) {
  const { data: userDetails, isLoading } = useUserDetails(user.id);
  
  const getCardConfig = () => {
    switch (context) {
      case 'admin':
        return {
          cardTitle: "Administrator Information",
          description: "Your administrative account details and contact information."
        };
      case 'app':
        return {
          cardTitle: "Personal Information",
          description: "Your account details and contact information."
        };
      default:
        return {
          cardTitle: "Personal Information",
          description: "Your complete profile information and details."
        };
    }
  };

  const { cardTitle, description } = getCardConfig();
  const extras = userDetails?.extras || {};

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          {cardTitle}
        </CardTitle>
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-base font-medium break-words">{user.name || "N/A"}</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Email Address</label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-base break-all">{user.email || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Additional Details from Backend */}
        {!isLoading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-base">{extras.mobile || "N/A"}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-base">{extras.dob ? new Date(extras.dob).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Aadhaar Number</label>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-base">{extras.aadhaar || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nationality</label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-base">{extras.nationality || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Religion</label>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-base">{extras.religion || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Caste</label>
                <div className="flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-base">{extras.caste || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Annual Income</label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-base">{extras.annualIncome ? `₹${extras.annualIncome}` : "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Language Preference</label>
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-base">{extras.languagePreference || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <Separator />
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Address Information</label>
              
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{extras.address || "N/A"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">State</p>
                  <p className="text-sm text-muted-foreground">{extras.state || "N/A"}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Country</p>
                  <p className="text-sm text-muted-foreground">{extras.country || "N/A"}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Loading state for additional details */}
        {isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Organizations Card Component
function OrganizationsCard({ organizations, user, context }: OrganizationsCardProps) {
  const isAdmin = context === 'admin';
  const cardTitle = isAdmin ? "Organization Management" : "Project Access & Permissions";
  const description = isAdmin 
    ? "Organizations under your administrative control and management permissions."
    : "Organizations and projects you have access to with your specific permissions.";
  
  const emptyStateText = isAdmin 
    ? "No organizations assigned for management."
    : "No project access assigned.";
  
  const emptyStateSubtext = isAdmin
    ? (user.systemRole === 'SUPER_USER' ? 'You have system-wide access to all organizations.' : 'Contact system administrator for organization access.')
    : "Contact your administrator for project access.";

  const RoleIcon = isAdmin ? Settings : Briefcase;
  const roleLabel = isAdmin ? "Administrative Role:" : "Your Role:";
  const permissionsLabel = isAdmin ? "Administrative Permissions" : "Permissions";

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
          {cardTitle}
        </CardTitle>
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {organizations.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Building2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <p className="text-muted-foreground text-sm sm:text-base">{emptyStateText}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">{emptyStateSubtext}</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {organizations.map((org) => (
              <div key={org.id} className="border rounded-lg p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base break-words">{org.name}</h4>
                    </div>
                  </div>
                  
                  {org.role && (
                    <div className="flex items-center gap-2 pl-6">
                      <RoleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-muted-foreground">{roleLabel}</span>
                      <Badge variant="outline" className="text-xs">{org.role}</Badge>
                    </div>
                  )}

                  {org.permissions && org.permissions.length > 0 && (
                    <div className="pl-6 space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">{permissionsLabel}:</p>
                      <div className="flex flex-wrap gap-1">
                        {org.permissions.slice(0, 3).map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {org.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{org.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Access Summary Card Component
function AccessSummaryCard({ organizations, user, context }: AccessSummaryCardProps) {
  const isAdmin = context === 'admin';
  const cardTitle = isAdmin ? "Administrative Overview" : "Access Summary";
  
  const getPermissionCount = () => {
    if (isAdmin && user.systemRole === 'SUPER_USER') {
      return 'Unlimited';
    }
    return organizations.reduce((total, org) => total + org.permissions.length, 0).toString();
  };

  const getAccountTypeLabel = () => {
    if (isAdmin) {
      return user.systemRole === 'SUPER_USER' ? 'Super Admin' : 'Admin';
    }
    return 'Project User';
  };

  const getPermissionLabel = () => {
    return isAdmin ? 'Admin Permissions' : 'Total Permissions';
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg">{cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs sm:text-sm">Organizations</span>
          </div>
          <Badge variant="secondary" className="text-xs">{organizations.length}</Badge>
        </div>
        
        <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs sm:text-sm">{getPermissionLabel()}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {getPermissionCount()}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm">{isAdmin ? 'Access Level' : 'Account Type'}</span>
          </div>
          <Badge variant={user.systemRole === 'SUPER_USER' ? 'default' : 'secondary'} className="text-xs">
            {getAccountTypeLabel()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// Account Settings Card Component
function AccountSettingsCard({ context }: { context: 'admin' | 'app' | 'unified' }) {
  const getCardConfig = () => {
    switch (context) {
      case 'admin':
        return {
          cardTitle: "Administrator Security",
          description: "Manage your administrative account security settings."
        };
      case 'app':
        return {
          cardTitle: "Account Security",
          description: "Manage your account security and privacy settings."
        };
      default:
        return {
          cardTitle: "Account Settings",
          description: "Manage your account security and preferences."
        };
    }
  };

  const { cardTitle, description } = getCardConfig();

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
          {cardTitle}
        </CardTitle>
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Key className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Change Password</p>
                <p className="text-xs text-muted-foreground">Update your account password</p>
              </div>
            </div>
            <ChangePasswordDialog>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Lock className="h-3 w-3" />
                Change
              </Button>
            </ChangePasswordDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Component
export function ProfileLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="h-6 sm:h-8 w-32 sm:w-48 bg-muted animate-pulse rounded mb-4 sm:mb-6 mx-auto"></div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <div className="h-5 sm:h-6 w-24 sm:w-32 bg-muted animate-pulse rounded"></div>
                <div className="h-3 sm:h-4 w-36 sm:w-48 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="h-3 sm:h-4 w-full bg-muted animate-pulse rounded"></div>
                <div className="h-3 sm:h-4 w-3/4 bg-muted animate-pulse rounded"></div>
                <div className="h-3 sm:h-4 w-1/2 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          </div>
          <div className="xl:col-span-1">
            <Card>
              <CardHeader>
                <div className="h-5 sm:h-6 w-20 sm:w-24 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-8 sm:h-10 bg-muted animate-pulse rounded"></div>
                <div className="h-8 sm:h-10 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Not Authenticated Component
export function NotAuthenticatedProfile() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="text-center py-6 sm:py-8">
            <p className="text-muted-foreground text-sm sm:text-base">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main ProfileComponent
export default function ProfileComponent({ 
  user, 
  organizations = [], 
  context = 'unified',
  showOrganizations = false,
  showAccessSummary = false 
}: ProfileComponentProps) {
  const isUnified = context === 'unified';
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="mb-6 sm:mb-8">
          <ProfileHeader user={user} context={context} />
        </div>

        {/* Profile Content */}
        <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${!isUnified && (showOrganizations || showAccessSummary) ? 'xl:grid-cols-3' : 'max-w-7xl mx-auto'}`}>
          {/* Main Content */}
          <div className={`${!isUnified && (showOrganizations || showAccessSummary) ? 'xl:col-span-2' : ''}`}>
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              {/* Personal Info Card (now includes all user details) */}
              <div className="flex-1">
                <PersonalInfoCard user={user} context={context} />
              </div>
              
              {/* Account Settings Card */}
              <div className="lg:w-80 xl:w-96">
                <AccountSettingsCard context={context} />
              </div>
            </div>
            
            {/* Organizations Card (for context-specific profiles) */}
            {!isUnified && showOrganizations && (
              <div className="mt-4 sm:mt-6">
                <OrganizationsCard 
                  organizations={organizations} 
                  user={user} 
                  context={context as 'admin' | 'app'} 
                />
              </div>
            )}
          </div>

          {/* Sidebar Content (only for context-specific profiles) */}
          {!isUnified && showAccessSummary && (
            <div className="xl:col-span-1">
              <AccessSummaryCard 
                organizations={organizations} 
                user={user} 
                context={context as 'admin' | 'app'} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export individual components for backward compatibility
export {
  ProfileHeader,
  PersonalInfoCard,
  AccountSettingsCard,
  OrganizationsCard,
  AccessSummaryCard
};
