import type { ToastActionElement, ToastProps } from '@/components/ui/toast';
import * as React from 'react';

// Toast Types
export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

export type ActionType = typeof actionTypes;

export const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;

export type Action =
  | {
      type: ActionType['ADD_TOAST'];
      toast: ToasterToast;
    }
  | {
      type: ActionType['UPDATE_TOAST'];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType['DISMISS_TOAST'];
      toastId?: ToasterToast['id'];
    }
  | {
      type: ActionType['REMOVE_TOAST'];
      toastId?: ToasterToast['id'];
    };

export interface ToastState {
  toasts: ToasterToast[];
}

// User Types (Extended from existing)
export interface User {
  id: string;
  email: string;
  name: string;
  isVerified?: boolean;
  systemRole: 'SUPER_USER' | 'ORG_ADMIN' | 'ORG_USER';
  refreshToken?: string | null;
  createdAt?: string;
  orgUser?: {
    user?: {
      id?: string;
      alternateContacts?: ExistingAlternateContact[];
    };
    userId?: string;
  };
  mobile?: string;
  aadhaar?: string;
  dob?: string;
  nationality?: string;
  address?: string;
  country?: string;
  state?: string;
  religion?: string;
  caste?: string;
  annualIncome?: string;
  languagePreference?: string;
  roleId?: string;
  roleIds?: string[]; // Multiple roles support
}

export interface CreateUserData {
  name: string;
  email: string;
  roleId?: string; // Keep for backward compatibility
  roleIds?: string[]; // Multiple roles support
  extras?: {
    mobile?: string;
    aadhaar?: string;
    dob?: string;
    nationality?: string;
    address?: string;
    country?: string;
    state?: string;
    religion?: string;
    caste?: string;
    annualIncome?: string;
    languagePreference?: string;
  };
}

export interface UpdateUserData extends Partial<CreateUserData> {}

export interface AuthResponse {
  token: string;
  user: User;
}

// Organization Types (Extended from existing)
export interface Organization {
  id: string;
  name: string;
  description?: string;
  status?: string;
  members?: number;
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
}

export interface OrganizationProject {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  role: string;
  extras?: any;
}

export interface OrganizationRole {
  id: string;
  name: string;
}

export interface OrganizationStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalMembers: number;
  recentActivity: number;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  organisationId: string;
  organisationName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
}

export interface GroupedProjects {
  [orgId: string]: {
    organisationName: string;
    projects: Project[];
  };
}

// Group Types
export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  managerId?: string;
  manager?: { id: string; name: string };
  members?: { id: string; user: { name: string } }[];
}

export interface GroupAdmin {
  id: string;
  name: string;
}

// Assessment Types
export interface AssessmentSchedule {
  id: string;
  title: string;
  description: string;
  questionnaireId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  questionnaire?: {
    id: string;
    slug: string;
    title: string;
    minSpanDays: number;
  };
  groupIds?: string[]; // Multiple groups support
  groups?: {
    id: string;
    name: string;
  }[];
  assessmentInstances?: {
    id: string;
    startDate: string;
    endDate: string;
  }[];
  assessments?: AssessmentInstance[];
}

export interface AssessmentInstance {
  id: string;
  startDate: string;
  endDate: string;
  assessmentScheduleId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DateRange {
  instanceId?: string; // For existing assessment instances
  startDate: string;
  endDate?: string;
}

export interface CreateAssessmentData {
  title: string;
  description: string;
  questionnaireId: string;
  groupIds: string[]; // Multiple groups support
  dateRanges: DateRange[];
}

export interface UpdateAssessmentScheduleData {
  title?: string;
  description?: string;
  questionnaireId?: string;
  groupIds?: string[]; // Multiple groups support
  dateRanges?: DateRange[];
}

export interface UpdateAssessmentInstanceData {
  dateRange: {
    startDate: string;
    endDate?: string;
  };
}

// Legacy Assessment interface for backward compatibility
export interface Assessment {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  questionnaire?: string;
  slug: string;
}

export interface AssessmentAssignment {
  id: string;
  userName?: string;
  assessmentName?: string;
  status?: string;
  responses?: any;
  accessSecret?: string;
  accessCode?: string;
  userId?: string;
  assessmentId?: string;
  groupId?: string;
  groupName?: string;
  startDate?: string;
  endDate?: string;
}

export interface GroupAssignmentReportResponse {
  assignments: AssessmentAssignment[];
  questionnaire: {
    id: string;
    slug: string;
    title: string;
  } | null;
}

// Role Types (Extended from existing)
export interface Role {
  id: string;
  name: string;
}

// Contact Types
export interface ExistingUserDetails {
  id: string;
  email: string;
  name: string;
  extras?: {
    mobile?: string;
    aadhaar?: string;
    dob?: string;
    nationality?: string;
    address?: string;
    country?: string;
    state?: string;
    religion?: string;
    caste?: string;
    annualIncome?: string;
    languagePreference?: string;
  };
  roleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExistingAlternateContact {
  id: string;
  userId: string;
  contactId: string;
  relationship: string;
  contact: {
    id: string;
    name: string;
    email: string;
    extras?: {
      mobile?: string;
      aadhaar?: string;
      dob?: string;
      nationality?: string;
      address?: string;
      country?: string;
      state?: string;
      religion?: string;
      caste?: string;
      annualIncome?: string;
      languagePreference?: string;
    };
    orgUsers?: { roleId?: string }[];
  };
}

export interface AlternateContact {
  id: string;
  email: string;
  name: string;
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
  relationship: string;
  roleId: string; // Keep for backward compatibility
  roleIds?: string[]; // Multiple roles support
  isExistingUser: boolean;
  existingUserDetails?: ExistingUserDetails | null;
  hasCheckedEmail: boolean;
  isExistingAlternateContact?: boolean;
  existingAlternateContactId?: string;
  markedForDeletion?: boolean;
}

export interface NewUserState {
  name: string;
  email: string;
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
}

// Auth-specific types
export interface AuthOrganization {
  id: string;
  name: string;
  permissions: string[];
  role: string | null;
}