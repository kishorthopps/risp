"use client";
import { useAuth, useProjectOrg } from "@/hooks/useAuth";
import { useState, useEffect, use } from "react";
import { ProtectedComponent } from "@/components/rbac/ProtectedComponent";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Edit, Trash2, ArrowUpDown, ArrowLeft, UserCircle, Check, X, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { CiCircleInfo } from "react-icons/ci";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

// TanStack Query hooks import
import {
  useUsersByProject,
  useUsersByOrganization,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useCheckEmail,
  useAddAlternateContact,
  useRemoveAlternateContact
} from "@/hooks/useUsers";
import { useOrganizationRoles } from "@/hooks/useOrganizations";
import { useProject } from "@/hooks/useProjects";

import {
  User,
  Role,
  ExistingUserDetails,
  ExistingAlternateContact,
  AlternateContact,
  NewUserState
} from "@/lib/types";

// MultiRoleSelect component for selecting multiple roles
function MultiRoleSelect({ 
  selectedRoleIds, 
  onSelectionChange, 
  roles, 
  placeholder = "Select roles..." 
}: {
  selectedRoleIds: string[];
  onSelectionChange: (roleIds: string[]) => void;
  roles: Role[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const handleRoleToggle = (roleId: string) => {
    const newSelection = selectedRoleIds.includes(roleId)
      ? selectedRoleIds.filter(id => id !== roleId)
      : [...selectedRoleIds, roleId];
    onSelectionChange(newSelection);
  };

  const getSelectedRoleNames = () => {
    return roles
      .filter(role => selectedRoleIds.includes(role.id))
      .map(role => role.name);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedRoleIds.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : selectedRoleIds.length === 1 ? (
            getSelectedRoleNames()[0]
          ) : (
            <span>{selectedRoleIds.length} roles selected</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search roles..." />
          <CommandEmpty>No roles found.</CommandEmpty>
          <CommandGroup>
            {roles.map((role) => (
              <CommandItem
                key={role.id}
                value={role.name}
                onSelect={() => handleRoleToggle(role.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center space-x-2 w-full">
                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                    selectedRoleIds.includes(role.id) 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-input'
                  }`}>
                    {selectedRoleIds.includes(role.id) && <Check className="h-3 w-3" />}
                  </div>
                  <span>{role.name}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type UserDetailsFormProps = {
  user: NewUserState | AlternateContact;
  onChange: (user: NewUserState | AlternateContact) => void;
  disabledFields?: Partial<Record<keyof (NewUserState & AlternateContact), boolean>>;
  prefix?: string;
};

// UserDetailsForm: shared form for user and alternate contact fields
function UserDetailsForm({ user, onChange, disabledFields = {}, prefix = "" }: UserDetailsFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        placeholder="Name *"
        value={user.name}
        onChange={(e) => onChange({ ...user, name: e.target.value })}
        disabled={!!disabledFields.name}
        id={`${prefix}name`}
      />
      <Input
        placeholder="Email *"
        value={user.email}
        onChange={(e) => onChange({ ...user, email: e.target.value })}
        disabled={!!disabledFields.email}
        id={`${prefix}email`}
      />
      <Input
        placeholder="Mobile"
        value={user.mobile}
        onChange={(e) => onChange({ ...user, mobile: e.target.value })}
        disabled={!!disabledFields.mobile}
        id={`${prefix}mobile`}
      />
      <Input
        placeholder="Aadhaar"
        value={user.aadhaar}
        onChange={(e) => onChange({ ...user, aadhaar: e.target.value })}
        disabled={!!disabledFields.aadhaar}
        id={`${prefix}aadhaar`}
      />
      <DatePicker
        value={user.dob}
        onChange={(date) => onChange({ ...user, dob: date })}
        disabled={!!disabledFields.dob}
        placeholder="Date of Birth"
        id={`${prefix}dob`}
      />
      <Input
        placeholder="Nationality"
        value={user.nationality}
        onChange={(e) => onChange({ ...user, nationality: e.target.value })}
        disabled={!!disabledFields.nationality}
        id={`${prefix}nationality`}
      />
      <Input
        placeholder="Address"
        value={user.address}
        onChange={(e) => onChange({ ...user, address: e.target.value })}
        disabled={!!disabledFields.address}
        id={`${prefix}address`}
      />
      <Input
        placeholder="Country"
        value={user.country}
        onChange={(e) => onChange({ ...user, country: e.target.value })}
        disabled={!!disabledFields.country}
        id={`${prefix}country`}
      />
      <Input
        placeholder="State"
        value={user.state}
        onChange={(e) => onChange({ ...user, state: e.target.value })}
        disabled={!!disabledFields.state}
        id={`${prefix}state`}
      />
      <Input
        placeholder="Religion"
        value={user.religion}
        onChange={(e) => onChange({ ...user, religion: e.target.value })}
        disabled={!!disabledFields.religion}
        id={`${prefix}religion`}
      />
      <Input
        placeholder="Caste"
        value={user.caste}
        onChange={(e) => onChange({ ...user, caste: e.target.value })}
        disabled={!!disabledFields.caste}
        id={`${prefix}caste`}
      />
      <Input
        placeholder="Annual Income"
        value={user.annualIncome}
        onChange={(e) => onChange({ ...user, annualIncome: e.target.value })}
        disabled={!!disabledFields.annualIncome}
        id={`${prefix}annualIncome`}
      />
      <Input
        placeholder="Language Preference"
        value={user.languagePreference}
        onChange={(e) => onChange({ ...user, languagePreference: e.target.value })}
        disabled={!!disabledFields.languagePreference}
        id={`${prefix}languagePreference`}
      />
    </div>
  );
}

export default function UsersPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const { } = useAuth(); const { orgId: currentOrgId } = useProjectOrg(projectId);

  // Fetch project details dynamically using project ID
  const { data: projectData, isLoading: projectLoading } = useProject(projectId, currentOrgId || undefined);

  // Use fetched project name, fallback to "Loading..." or "Unknown Project"
  const projectName = projectData?.name || (projectLoading ? "Loading..." : "Unknown Project");

  // TanStack Query hooks
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError
  } = useUsersByProject(currentOrgId || '', projectId);

  const {
    data: roles = [],
    isLoading: rolesLoading
  } = useOrganizationRoles(currentOrgId || '');

  const {
    data: allUsers = [],
    isLoading: allUsersLoading
  } = useUsersByOrganization(currentOrgId || '');

  // Local state
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Filter states
  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  const [newUser, setNewUser] = useState<NewUserState>({
    name: "",
    email: "",
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
  }); const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // View user dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [isLoadingViewUserDetails, setIsLoadingViewUserDetails] = useState<boolean>(false);

  // Mutations - declared after currentUser state
  const createUserMutation = useCreateUser(currentOrgId || '', projectId);
  const updateUserMutation = useUpdateUser(currentOrgId || '', projectId, currentUser?.id || '');
  const deleteUserMutation = useDeleteUser(currentOrgId || '', projectId);
  const checkEmailMutation = useCheckEmail();
  const addAlternateContactMutation = useAddAlternateContact(currentOrgId || '', projectId);
  const removeAlternateContactMutation = useRemoveAlternateContact(currentOrgId || '', projectId);

  // Filter users based on name and role
  const filteredUsers = users.filter((user) => {
    const matchesName = user.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
                       user.email.toLowerCase().includes(nameFilter.toLowerCase());
    
    if (roleFilter === "all") {
      return matchesName;
    }
    
    // Check if user has the selected role
    const matchesRole = user.roleId === roleFilter;
    
    return matchesName && matchesRole;
  });

  // Alternative Contacts states - simplified version
  const [alternateContacts, setAlternateContacts] = useState<AlternateContact[]>([
    {
      id: "1",
      email: "",
      name: "",
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
      relationship: "",
      roleId: "",
      roleIds: [], // Multiple roles support
      isExistingUser: false,
      existingUserDetails: null,
      hasCheckedEmail: false,
      isExistingAlternateContact: false,
      existingAlternateContactId: "",
      markedForDeletion: false,
    },
  ]);
  const [removingContactStates, setRemovingContactStates] = useState<Record<string, boolean>>({});

  // State for loading user details during edit
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState<boolean>(false);

  // Fetch detailed user data when editing (including alternate contacts)
  // Always call the hook but it will be disabled when editingUserId is null
  const {
    data: detailedUser,
    isLoading: userDetailsLoading,
    error: userDetailsError
  } = useUser(
    currentOrgId || '',
    projectId,
    editingUserId || '' // Hook is disabled when userId is empty
  );

  // Fetch detailed user data when viewing (including alternate contacts)
  // Always call the hook but it will be disabled when viewingUserId is null
  const {
    data: viewDetailedUser,
    isLoading: viewUserDetailsLoading,
    error: viewUserDetailsError
  } = useUser(
    currentOrgId || '',
    projectId,
    viewingUserId || '' // Hook is disabled when userId is empty
  );

  // Effect to handle loading detailed user data when editing
  useEffect(() => {
    if (detailedUser && editingUserId && !isDialogOpen && !isSaving && !isLoadingUserDetails) {
      try {
        setIsLoadingUserDetails(true);

        // Set basic user data
        setNewUser({
          name: detailedUser.name || "",
          email: detailedUser.email || "",
          mobile: detailedUser.mobile || "",
          aadhaar: detailedUser.aadhaar || "",
          dob: detailedUser.dob || "",
          nationality: detailedUser.nationality || "",
          address: detailedUser.address || "",
          country: detailedUser.country || "",
          state: detailedUser.state || "",
          religion: detailedUser.religion || "",
          caste: detailedUser.caste || "",
          annualIncome: detailedUser.annualIncome || "",
          languagePreference: detailedUser.languagePreference || "",
        });
        setSelectedRoleIds(detailedUser.roleIds || (detailedUser.roleId ? [detailedUser.roleId] : []));

        // Load existing alternate contacts if available
        if (detailedUser.alternateContacts && detailedUser.alternateContacts.length > 0) {
          const existingContacts: AlternateContact[] = detailedUser.alternateContacts.map((ac: any, index: number) => ({
            id: `existing-${ac.id}`,
            email: ac.contact.email,
            name: ac.contact.name,
            mobile: ac.contact.extras?.mobile || "",
            aadhaar: ac.contact.extras?.aadhaar || "",
            dob: ac.contact.extras?.dob || "",
            nationality: ac.contact.extras?.nationality || "",
            address: ac.contact.extras?.address || "",
            country: ac.contact.extras?.country || "",
            state: ac.contact.extras?.state || "",
            religion: ac.contact.extras?.religion || "",
            caste: ac.contact.extras?.caste || "",
            annualIncome: ac.contact.extras?.annualIncome || "",
            languagePreference: ac.contact.extras?.languagePreference || "",
            relationship: ac.relationship,
            roleId: ac.contact.orgUsers?.[0]?.roleId || "",
            isExistingUser: true,
            existingUserDetails: {
              id: ac.contact.id,
              email: ac.contact.email,
              name: ac.contact.name,
              extras: ac.contact.extras,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            hasCheckedEmail: true,
            isExistingAlternateContact: true,
            existingAlternateContactId: ac.id,
            markedForDeletion: false,
          }));

          setAlternateContacts(existingContacts);
          toast.success(`Loaded ${existingContacts.length} existing alternate contact(s)`);
        } else {
          resetAlternateContacts();
        }

        setIsDialogOpen(true);
        setIsLoadingUserDetails(false);
      } catch (error: any) {
        console.error("Error loading user details:", error);
        toast.error("Failed to load user details");
        setIsLoadingUserDetails(false);
        setEditingUserId(null);
      }
    }
  }, [detailedUser, editingUserId, isDialogOpen, isSaving, isLoadingUserDetails]);

  // Effect to handle user details loading errors
  useEffect(() => {
    if (userDetailsError && editingUserId) {
      console.error("Error fetching user details:", userDetailsError);
      toast.error("Failed to load user details for editing");
      setEditingUserId(null);
      setIsLoadingUserDetails(false);
    }
  }, [userDetailsError, editingUserId]);

  // Effect to handle loading view user details
  useEffect(() => {
    if (viewDetailedUser && viewingUserId && isViewDialogOpen) {
      setIsLoadingViewUserDetails(false);
    }
  }, [viewDetailedUser, viewingUserId, isViewDialogOpen]);

  // Effect to handle view user details loading errors
  useEffect(() => {
    if (viewUserDetailsError && viewingUserId) {
      console.error("Error fetching view user details:", viewUserDetailsError);
      toast.error("Failed to load user details for viewing");
      setViewingUserId(null);
      setIsLoadingViewUserDetails(false);
      setIsViewDialogOpen(false);
    }
  }, [viewUserDetailsError, viewingUserId]);

  // Loading state
  if (usersLoading || rolesLoading || allUsersLoading) {
    return (
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded"></div>
          <div className="h-96 bg-muted animate-pulse rounded"></div>
        </div>
      </main>
    );
  }

  // Error state
  if (usersError) {
    return (
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load users. Please try again.</p>
        </div>
      </main>
    );
  }

  // User details fetching using TanStack Query hook
  const fetchUserDetails = (userId: string): void => {
    if (!currentOrgId || !projectId) {
      toast.error("Missing organisation or project information");
      return;
    }

    // Find user in the list first for basic details
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      const userWithDefaults: User = {
        ...foundUser,
        createdAt: (foundUser as any).createdAt || new Date().toISOString(),
        isVerified: (foundUser as any).isVerified ?? false,
        systemRole: (foundUser as any).systemRole ?? "",
        refreshToken: (foundUser as any).refreshToken ?? null,
      };
      setCurrentUser(userWithDefaults);

      // Load detailed user data including alternate contacts using the useUser hook
      // This will be handled in handleEditUser function
    } else {
      setCurrentUser(null);
      toast.error("User not found");
    }
  };

  const addAlternateContact = (): void => {
    const newContact: AlternateContact = {
      id: Date.now().toString(),
      email: "",
      name: "",
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
      relationship: "",
      roleId: "",
      roleIds: [], // Initialize with empty array for multiple roles
      isExistingUser: false,
      existingUserDetails: null,
      hasCheckedEmail: false,
      isExistingAlternateContact: false,
      existingAlternateContactId: "",
      markedForDeletion: false,
    };
    setAlternateContacts([...alternateContacts, newContact]);
  };

  const removeAlternateContact = async (contactId: string): Promise<void> => {
    const contact = alternateContacts.find((c) => c.id === contactId);
    if (!contact) return;

    if (contact.isExistingAlternateContact && contact.existingAlternateContactId && currentUser?.id) {
      setRemovingContactStates((prev) => ({ ...prev, [contactId]: true }));
      try {
        // Use the API to remove alternate contact
        await removeAlternateContactMutation.mutateAsync({
          alternateContactId: contact.existingAlternateContactId,
          userId: currentUser.id
        });

        // Remove from local state after successful API call
        setAlternateContacts(alternateContacts.filter((c) => c.id !== contactId));
      } catch (error) {
        console.error("Failed to remove alternate contact:", error);
        // Error handling is done in the mutation
      } finally {
        setRemovingContactStates((prev) => ({ ...prev, [contactId]: false }));
      }
    } else {
      // For non-existing contacts (local only), just remove from state
      setAlternateContacts(alternateContacts.filter((contact) => contact.id !== contactId));
    }
  };

  const updateAlternateContact = (contactId: string, updates: Partial<AlternateContact>): void => {
    setAlternateContacts((contacts) =>
      contacts.map((contact) => (contact.id === contactId ? { ...contact, ...updates } : contact))
    );
  };

  const handleCheckEmail = async (contactId: string): Promise<void> => {
    const contact = alternateContacts.find((c) => c.id === contactId);
    if (!contact || !contact.email.trim() || !currentOrgId) {
      if (!contact) {
        toast.error("Contact not found");
      } else if (!contact.email.trim()) {
        toast.error("Please enter an email address");
      } else if (!currentOrgId) {
        toast.error("Organization ID is missing");
      }
      return;
    }

    // Check for duplicate emails
    const duplicateContact = alternateContacts.find(c =>
      c.id !== contact.id &&
      c.email.toLowerCase().trim() === contact.email.toLowerCase().trim()
    );

    if (duplicateContact) {
      toast.error("This email is already used in another alternate contact");
      return;
    }

    if (newUser.email.toLowerCase().trim() === contact.email.toLowerCase().trim() && newUser.email.trim() !== "") {
      toast.error("Alternate contact email cannot be the same as main user email");
      return;
    }

    try {
      const response = await checkEmailMutation.mutateAsync({
        orgId: currentOrgId,
        projectId,
        email: contact.email,
      });

      if (response.user) {
        // Existing user found
        updateAlternateContact(contactId, {
          isExistingUser: true,
          existingUserDetails: {
            ...response.userDetails,
            roleId: response.userDetails.roleId || ""
          },
          hasCheckedEmail: true,
          name: response.userDetails.name,
          mobile: response.userDetails.extras?.mobile || "",
          aadhaar: response.userDetails.extras?.aadhaar || "",
          dob: response.userDetails.extras?.dob || "",
          nationality: response.userDetails.extras?.nationality || "",
          address: response.userDetails.extras?.address || "",
          country: response.userDetails.extras?.country || "",
          state: response.userDetails.extras?.state || "",
          religion: response.userDetails.extras?.religion || "",
          caste: response.userDetails.extras?.caste || "",
          annualIncome: response.userDetails.extras?.annualIncome || "",
          languagePreference: response.userDetails.extras?.languagePreference || "",
          roleId: response.userDetails.roleId || "", // Set roleId from response
          roleIds: response.userDetails.roleId ? [response.userDetails.roleId] : [] // Initialize roleIds array
        });
        toast.success("User found! This user can be added as an alternate contact.");
      } else {
        // User not found - allow creating new user
        updateAlternateContact(contactId, {
          isExistingUser: false,
          existingUserDetails: null,
          hasCheckedEmail: true,
        });
        toast.info("No existing user found. A new user will be created when saving.");
      }
    } catch (error: any) {
      console.error("Error checking email:", error);
      const errorMessage = error?.response?.data?.message ||
        error?.response?.message ||
        error?.message ||
        "Failed to check email";
      toast.error(errorMessage);

      updateAlternateContact(contactId, {
        isExistingUser: false,
        existingUserDetails: null,
        hasCheckedEmail: true,
      });
    }
  };

  const resetAlternateContacts = (): void => {
    setAlternateContacts([{
      id: "1",
      email: "",
      name: "",
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
      relationship: "",
      roleId: "",
      roleIds: [], // Initialize with empty array for multiple roles
      isExistingUser: false,
      existingUserDetails: null,
      hasCheckedEmail: false,
      isExistingAlternateContact: false,
      existingAlternateContactId: "",
      markedForDeletion: false,
    }]);
    setRemovingContactStates({});
  };

  const resetAllState = (): void => {
    setCurrentUser(null);
    setEditingUserId(null);
    setIsSaving(false);
    setIsLoadingUserDetails(false);
    setNewUser({
      name: "",
      email: "",
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
    });
    setSelectedRoleIds([]);
    resetAlternateContacts();
  };

  const validateAlternateContacts = (): boolean => {
    // For now, return true - validation can be added later
    return true;
  };

  const handleSaveUser = async (): Promise<void> => {
    setIsSaving(true);

    // Basic validation for main user
    if (!newUser.name.trim()) {
      toast.error("Please enter a user name");
      setIsSaving(false);
      return;
    }

    if (!newUser.email.trim()) {
      toast.error("Please enter an email address");
      setIsSaving(false);
      return;
    }

    if (!selectedRoleIds.length) {
      toast.error("Please select at least one role");
      setIsSaving(false);
      return;
    }

    if (!currentOrgId) {
      toast.error("Organization ID is missing");
      setIsSaving(false);
      return;
    }

    // Enhanced validation for alternate contacts
    const invalidContacts = alternateContacts.filter(contact =>
      contact.email.trim() && // Has email
      (!contact.hasCheckedEmail || // But hasn't been checked
        (contact.hasCheckedEmail && !contact.name.trim()) || // Or checked but no name
        !contact.relationship.trim() || // Or no relationship
        (!contact.isExistingUser && !contact.isExistingAlternateContact && 
         (!contact.roleIds || contact.roleIds.length === 0) && !contact.roleId)) // Or no roles selected for new contacts
    );

    if (invalidContacts.length > 0) {
      toast.error("Please complete all alternate contact details (including at least one role) or remove incomplete entries");
      setIsSaving(false);
      return;
    }

    const validAlternateContacts = alternateContacts.filter(contact =>
      contact.email.trim() &&
      contact.hasCheckedEmail &&
      contact.name.trim() &&
      contact.relationship.trim() &&
      (contact.isExistingUser || contact.isExistingAlternateContact || 
       (contact.roleIds && contact.roleIds.length > 0) || contact.roleId)
    );

    try {
      let savedUser;
      let mainUserId: string | undefined;

      if (currentUser) {
        // Update existing user
        await updateUserMutation.mutateAsync({
          userData: {
            name: newUser.name,
            email: newUser.email,
            roleIds: selectedRoleIds, // Send multiple roles
            extras: {
              mobile: newUser.mobile || undefined,
              aadhaar: newUser.aadhaar || undefined,
              dob: newUser.dob || undefined,
              nationality: newUser.nationality || undefined,
              address: newUser.address || undefined,
              country: newUser.country || undefined,
              state: newUser.state || undefined,
              religion: newUser.religion || undefined,
              caste: newUser.caste || undefined,
              annualIncome: newUser.annualIncome || undefined,
              languagePreference: newUser.languagePreference || undefined,
            }
          }
        });
        savedUser = currentUser;
        mainUserId = currentUser.orgUser?.userId || currentUser.id;
        toast.success("User updated successfully");
      } else {
        // Create new user
        const result = await createUserMutation.mutateAsync({
          userData: {
            name: newUser.name,
            email: newUser.email,
            roleIds: selectedRoleIds, // Send multiple roles
            extras: {
              mobile: newUser.mobile || undefined,
              aadhaar: newUser.aadhaar || undefined,
              dob: newUser.dob || undefined,
              nationality: newUser.nationality || undefined,
              address: newUser.address || undefined,
              country: newUser.country || undefined,
              state: newUser.state || undefined,
              religion: newUser.religion || undefined,
              caste: newUser.caste || undefined,
              annualIncome: newUser.annualIncome || undefined,
              languagePreference: newUser.languagePreference || undefined,
            }
          }
        });
        savedUser = { id: result.user?.id || result.id };
        mainUserId = result.user?.id || result.id;
        toast.success("User created successfully");
      }

      // Handle alternate contacts
      if (validAlternateContacts.length > 0 && mainUserId) {
        for (const contact of validAlternateContacts) {
          try {
            if (contact.isExistingAlternateContact) {
              // Skip if it's an existing unmodified contact
              continue;
            }

            if (contact.isExistingUser && contact.existingUserDetails) {
              // Add existing user as alternate contact
              await addAlternateContactMutation.mutateAsync({
                userId: mainUserId,
                contactData: {
                  contactId: contact.existingUserDetails.id,
                  relationship: contact.relationship
                }
              });
            } else {
              // Create new user first, then add as alternate contact
              const newContactUser = await createUserMutation.mutateAsync({
                userData: {
                  name: contact.name,
                  email: contact.email,
                  roleIds: contact.roleIds && contact.roleIds.length > 0 
                    ? contact.roleIds 
                    : (contact.roleId ? [contact.roleId] : selectedRoleIds), // Use contact's roles or fallback to main user's roles
                  extras: {
                    mobile: contact.mobile,
                    aadhaar: contact.aadhaar,
                    dob: contact.dob,
                    nationality: contact.nationality,
                    address: contact.address,
                    country: contact.country,
                    state: contact.state,
                    religion: contact.religion,
                    caste: contact.caste,
                    annualIncome: contact.annualIncome,
                    languagePreference: contact.languagePreference,
                  }
                }
              });

              // Add as alternate contact
              await addAlternateContactMutation.mutateAsync({
                userId: mainUserId,
                contactData: {
                  contactId: newContactUser.user.id,
                  relationship: contact.relationship
                }
              });
            }
          } catch (error) {
            console.error(`Failed to handle alternate contact ${contact.email}:`, error);
            toast.error(`Failed to process alternate contact ${contact.email}`);
          }
        }
      }

      // Handle removal of marked contacts
      const contactsToRemove = alternateContacts.filter(contact =>
        contact.markedForDeletion &&
        contact.isExistingAlternateContact &&
        contact.existingAlternateContactId
      );

      if (contactsToRemove.length > 0 && mainUserId) {
        for (const contact of contactsToRemove) {
          try {
            await removeAlternateContactMutation.mutateAsync({
              alternateContactId: contact.existingAlternateContactId!,
              userId: mainUserId
            });
          } catch (error) {
            console.error(`Failed to remove alternate contact ${contact.email}:`, error);
            toast.error(`Failed to remove alternate contact ${contact.email}`);
          }
        }
      }

      // Reset form and clear all states
      setIsDialogOpen(false);
      resetAllState();
    } catch (error) {
      console.error("Error saving user:", error);
      setIsSaving(false);
      // Error handling is done in the mutations themselves
    }
  };

  const handleDeleteUser = async (id: string): Promise<void> => {
    if (!id) {
      toast.error("User ID is required");
      return;
    }
    setUserToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = (id: string): void => {
    if (!id) {
      toast.error("User ID is required");
      return;
    }
    setUserToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!userToDelete) {
      toast.error("No user selected for deletion");
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(userToDelete);
      // Success message is handled in the mutation
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      const errorMessage = error?.response?.data?.message ||
        error?.response?.message ||
        error?.message ||
        "Failed to delete user";
      toast.error(errorMessage);
      // Keep dialog open so user can try again or cancel
    }
  };

  const handleDialogOpen = (open: boolean) => {
    try {
      setIsDialogOpen(open);
      if (!open) {
        // Clear all editing state when closing dialog
        resetAllState();
      }
    } catch (error: any) {
      console.error("Error handling dialog state:", error);
      toast.error("Failed to update dialog state");
    }
  };
  const handleEditUser = (user: User) => {
    try {
      if (!user || !user.id) {
        toast.error("Invalid user data");
        return;
      }

      // Reset all state first to prevent interference
      resetAllState();

      // Set the current user and trigger detailed data fetch
      setCurrentUser(user);
      setEditingUserId(user.id);

      // The useEffect hook will handle loading detailed data and opening the dialog
    } catch (error: any) {
      console.error("Error initiating user edit:", error);
      toast.error("Failed to start editing user");
    }
  };

  const handleViewUser = (user: User) => {
    try {
      if (!user || !user.id) {
        toast.error("Invalid user data");
        return;
      }

      setViewingUserId(user.id);
      setIsLoadingViewUserDetails(true);
      setIsViewDialogOpen(true);
    } catch (error: any) {
      console.error("Error initiating user view:", error);
      toast.error("Failed to view user details");
    }
  };

  const columns: any[] = [
    {
      accessorKey: "name",
      header: ({ column }: any) => (
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
      accessorKey: "email",
      header: ({ column }: any) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      id: "additionalDetails",
      header: "Additional Details",
      cell: ({ row }: { row: { original: User } }) => {
        const user = row.original;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full" onClick={() => handleViewUser(user)}>
                <CiCircleInfo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-2">
                <p><strong>Mobile:</strong> {user.mobile || "N/A"}</p>
                <p><strong>Aadhaar:</strong> {user.aadhaar || "N/A"}</p>
                <p><strong>Date of Birth:</strong> {user.dob || "N/A"}</p>
                <p><strong>Nationality:</strong> {user.nationality || "N/A"}</p>
                <p><strong>Address:</strong> {user.address || "N/A"}</p>
                <p><strong>Country:</strong> {user.country || "N/A"}</p>
                <p><strong>State:</strong> {user.state || "N/A"}</p>
                <p><strong>Religion:</strong> {user.religion || "N/A"}</p>
                <p><strong>Caste:</strong> {user.caste || "N/A"}</p>
                <p><strong>Annual Income:</strong> {user.annualIncome || "N/A"}</p>
                <p><strong>Language Preference:</strong> {user.languagePreference || "N/A"}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    }, {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: User } }) => {
        const user = row.original;
        return (
          <ProtectedComponent
            requiredActions={["users.read", "users.update", "users.delete"]}
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
                <ProtectedComponent requiredAction="users.read" orgId={currentOrgId || undefined}>
                  <DropdownMenuItem onClick={() => handleViewUser(user)}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    View
                  </DropdownMenuItem>
                </ProtectedComponent>
                <ProtectedComponent requiredAction="users.update" orgId={currentOrgId || undefined}>
                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                </ProtectedComponent>
                <ProtectedComponent requiredAction="users.delete" orgId={currentOrgId || undefined}>
                  <DropdownMenuItem
                    onClick={() => confirmDeleteUser(user.id)}
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
    },
  ];

  return (
    <TooltipProvider>
      <div className="p-4 md:p-10 mx-auto max-w-7xl">
        <div className="h-10"></div>        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{projectName} - Users</h1>
          <ProtectedComponent requiredAction="users.create" orgId={currentOrgId || undefined}>
            <Button
              onClick={() => {
                resetAllState();
                setIsDialogOpen(true);
              }}
              className="rounded-full px-6 py-3"
            >
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </ProtectedComponent>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Filter by name or email..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-48">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataTable columns={columns as any} data={filteredUsers} hideFilter={true} />

        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentUser ? "Edit User" : "Add User"}</DialogTitle>
            </DialogHeader>

            {/* Main User Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">User Details</h3>              <UserDetailsForm
                user={newUser}
                onChange={setNewUser}
                disabledFields={{ email: !!currentUser }}
                prefix="main-"
              />              <div className="space-y-2">
                <h4 className="text-md font-semibold">Select User Roles *</h4>
                <ProtectedComponent
                  requiredAction="users.assignRoles"
                  orgId={currentOrgId || undefined}
                  fallback={<p className="text-sm text-yellow-600">You don't have permission to assign roles</p>}
                >
                  {roles.length > 0 ? (
                    <div className="space-y-2">
                      <MultiRoleSelect
                        selectedRoleIds={selectedRoleIds}
                        onSelectionChange={setSelectedRoleIds}
                        roles={roles}
                        placeholder="Select roles..."
                      />
                      {selectedRoleIds.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedRoleIds.map(roleId => {
                            const role = roles.find(r => r.id === roleId);
                            return role ? (
                              <Badge key={roleId} variant="secondary" className="flex items-center gap-1">
                                {role.name}
                                <X 
                                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                  onClick={() => setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId))}
                                />
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No roles available</p>
                  )}
                </ProtectedComponent>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Alternative Contacts Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Alternative Contact Details {currentUser ? "(Optional)" : "(Required - At least 1)"}
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addAlternateContact}
                  className="text-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Contact
                </Button>
              </div>

              {alternateContacts.map((contact, index) => (
                <Card key={contact.id} className="relative">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-md">Alternative Contact #{index + 1}</CardTitle>
                        {contact.isExistingAlternateContact && (
                          <Badge variant="secondary" className="text-xs">
                            Existing
                          </Badge>
                        )}
                      </div>
                      {(alternateContacts.length > 1 || contact.isExistingAlternateContact) && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeAlternateContact(contact.id)}
                          disabled={removingContactStates[contact.id]}
                          className="text-red-600 h-8 w-8 p-0"
                        >
                          {removingContactStates[contact.id] ? (
                            <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Email Check Section - Only show for new contacts */}
                    {!contact.isExistingAlternateContact && (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Alternative Contact Email *"
                            value={contact.email}
                            onChange={(e) => {
                              const newEmail = e.target.value;

                              updateAlternateContact(contact.id, {
                                email: newEmail,
                                hasCheckedEmail: false,
                                isExistingUser: false,
                                existingUserDetails: null,
                                name: "",
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
                              });

                              if (newEmail.trim()) {
                                const duplicateContact = alternateContacts.find(c =>
                                  c.id !== contact.id &&
                                  c.email.toLowerCase().trim() === newEmail.toLowerCase().trim()
                                );

                                if (duplicateContact) {
                                  toast.error("This email is already used in another alternate contact");
                                }

                                if (newUser.email.toLowerCase().trim() === newEmail.toLowerCase().trim() && newUser.email.trim() !== "") {
                                  toast.error("Alternate contact email cannot be the same as main user email");
                                }
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={() => handleCheckEmail(contact.id)}
                            disabled={removingContactStates[contact.id] || !contact.email.trim()}
                            className="px-6"
                          >
                            {removingContactStates[contact.id] ? (
                              "Removing..."
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Check
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Show email as read-only for existing contacts */}
                    {contact.isExistingAlternateContact && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          value={contact.email}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    )}

                    {/* Alternative Contact Form Fields */}
                    {(contact.hasCheckedEmail || contact.isExistingAlternateContact) && (
                      <div className="space-y-4">
                        <UserDetailsForm
                          user={contact}
                          onChange={(updated: NewUserState | AlternateContact) => updateAlternateContact(contact.id, updated)}
                          disabledFields={{
                            name: contact.isExistingUser || contact.isExistingAlternateContact,
                            email: true,
                            mobile: contact.isExistingUser || contact.isExistingAlternateContact,
                            aadhaar: contact.isExistingUser || contact.isExistingAlternateContact,
                            dob: contact.isExistingUser || contact.isExistingAlternateContact,
                            nationality: contact.isExistingUser || contact.isExistingAlternateContact,
                            address: contact.isExistingUser || contact.isExistingAlternateContact,
                            country: contact.isExistingUser || contact.isExistingAlternateContact,
                            state: contact.isExistingUser || contact.isExistingAlternateContact,
                            religion: contact.isExistingUser || contact.isExistingAlternateContact,
                            caste: contact.isExistingUser || contact.isExistingAlternateContact,
                            annualIncome: contact.isExistingUser || contact.isExistingAlternateContact,
                            languagePreference: contact.isExistingUser || contact.isExistingAlternateContact,
                          }}
                          prefix={`alt-${contact.id}-`}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Relationship *</label>
                            <Input
                              placeholder="e.g., Guardian, Parent, Spouse"
                              value={contact.relationship}
                              onChange={(e) => updateAlternateContact(contact.id, { relationship: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Roles *</label>
                            {roles.length > 0 ? (
                              <div className="space-y-2">
                                <MultiRoleSelect
                                  selectedRoleIds={contact.roleIds || (contact.roleId ? [contact.roleId] : [])}
                                  onSelectionChange={(roleIds) => updateAlternateContact(contact.id, { 
                                    roleIds, 
                                    roleId: roleIds.length > 0 ? roleIds[0] : "" // Keep roleId for backward compatibility
                                  })}
                                  roles={roles}
                                  placeholder="Select roles..."
                                />
                                {(contact.roleIds && contact.roleIds.length > 0) || contact.roleId ? (
                                  <div className="flex flex-wrap gap-2">
                                    {(contact.roleIds || (contact.roleId ? [contact.roleId] : [])).map(roleId => {
                                      const role = roles.find(r => r.id === roleId);
                                      return role ? (
                                        <Badge key={roleId} variant="secondary" className="flex items-center gap-1">
                                          {role.name}
                                          <X 
                                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                            onClick={() => {
                                              const currentRoleIds = contact.roleIds || (contact.roleId ? [contact.roleId] : []);
                                              const newRoleIds = currentRoleIds.filter(id => id !== roleId);
                                              updateAlternateContact(contact.id, { 
                                                roleIds: newRoleIds,
                                                roleId: newRoleIds.length > 0 ? newRoleIds[0] : ""
                                              });
                                            }}
                                          />
                                        </Badge>
                                      ) : null;
                                    })}
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No roles available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>            <DialogFooter>
              <Button variant="outline" onClick={() => handleDialogOpen(false)}>
                Cancel
              </Button>
              <ProtectedComponent
                requiredAction={currentUser ? "users.update" : "users.create"}
                orgId={currentOrgId || undefined}
              >
                <Button onClick={handleSaveUser} disabled={isSaving}>
                  {isSaving ? "Saving..." : (currentUser ? "Save Changes" : "Add User")}
                </Button>
              </ProtectedComponent>
            </DialogFooter>
          </DialogContent>        </Dialog>

        {/* View User Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) {
            setViewingUserId(null);
            setIsLoadingViewUserDetails(false);
          }
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>View User Details</DialogTitle>
            </DialogHeader>

            {isLoadingViewUserDetails || viewUserDetailsLoading ? (
              <div className="space-y-4">
                <div className="h-8 bg-muted animate-pulse rounded"></div>
                <div className="h-96 bg-muted animate-pulse rounded"></div>
              </div>
            ) : viewDetailedUser ? (
              <div className="space-y-6">
                {/* Main User Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5" />
                      User Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-sm font-semibold">{viewDetailedUser.name || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-sm">{viewDetailedUser.email || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Roles</label>
                        <div className="text-sm">
                          {(() => {
                            // Handle both single role and multiple roles
                            let userRoles: string[] = [];
                            
                            if (viewDetailedUser.roleIds && Array.isArray(viewDetailedUser.roleIds)) {
                              userRoles = viewDetailedUser.roleIds;
                            } else if (Array.isArray(viewDetailedUser.roleId)) {
                              userRoles = viewDetailedUser.roleId;
                            } else if (viewDetailedUser.roleId) {
                              userRoles = [viewDetailedUser.roleId];
                            }
                            
                            if (userRoles.length === 0) {
                              return "No Roles Assigned";
                            }
                            
                            const roleNames = userRoles
                              .map(roleId => roles.find(r => r.id === roleId)?.name)
                              .filter(Boolean);
                            
                            return roleNames.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {roleNames.map((roleName, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {roleName}
                                  </Badge>
                                ))}
                              </div>
                            ) : "No Valid Roles";
                          })()}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Mobile</label>
                        <p className="text-sm">{viewDetailedUser.mobile || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Aadhaar</label>
                        <p className="text-sm">{viewDetailedUser.aadhaar || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                        <p className="text-sm">{viewDetailedUser.dob || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Nationality</label>
                        <p className="text-sm">{viewDetailedUser.nationality || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Country</label>
                        <p className="text-sm">{viewDetailedUser.country || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">State</label>
                        <p className="text-sm">{viewDetailedUser.state || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Religion</label>
                        <p className="text-sm">{viewDetailedUser.religion || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Caste</label>
                        <p className="text-sm">{viewDetailedUser.caste || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Annual Income</label>
                        <p className="text-sm">{viewDetailedUser.annualIncome || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Language Preference</label>
                        <p className="text-sm">{viewDetailedUser.languagePreference || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Address</label>
                        <p className="text-sm">{viewDetailedUser.address || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Alternate Contacts */}
                {viewDetailedUser.alternateContacts && viewDetailedUser.alternateContacts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserCircle className="h-5 w-5" />
                        Alternate Contacts ({viewDetailedUser.alternateContacts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {viewDetailedUser.alternateContacts.map((ac: any, index: number) => (
                          <Card key={ac.id} className="border-l-4 border-l-blue-500">                            <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                              Contact #{index + 1}
                            </CardTitle>
                          </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-600">Name</label>
                                  <p className="text-sm">{ac.contact.name || "N/A"}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600">Email</label>
                                  <p className="text-sm">{ac.contact.email || "N/A"}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600">Relationship</label>
                                  <p className="text-sm">{ac.relationship || "N/A"}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600">Roles</label>
                                  <div className="flex flex-wrap gap-1">
                                    {(() => {
                                      const userRoles = ac.contact.orgUsers?.[0];
                                      if (userRoles?.roleId) {
                                        // Handle both single role and multiple roles
                                        const roleIds = Array.isArray(userRoles.roleId) ? userRoles.roleId : [userRoles.roleId];
                                        return roleIds.map((roleId: string) => {
                                          const role = roles.find(r => r.id === roleId);
                                          return role ? (
                                            <Badge key={roleId} variant="secondary" className="text-xs">
                                              {role.name}
                                            </Badge>
                                          ) : null;
                                        });
                                      }
                                      return <span className="text-sm text-gray-500">No Roles</span>;
                                    })()}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600">Mobile</label>
                                  <p className="text-sm">{ac.contact.extras?.mobile || "N/A"}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600">Aadhaar</label>
                                  <p className="text-sm">{ac.contact.extras?.aadhaar || "N/A"}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600">Date of Birth</label>
                                  <p className="text-sm">{ac.contact.extras?.dob || "N/A"}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600">Nationality</label>
                                  <p className="text-sm">{ac.contact.extras?.nationality || "N/A"}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600">Country</label>
                                  <p className="text-sm">{ac.contact.extras?.country || "N/A"}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600">State</label>
                                  <p className="text-sm">{ac.contact.extras?.state || "N/A"}</p>
                                </div>
                              </div>
                              {ac.contact.extras?.address && (
                                <div className="mt-3">
                                  <label className="text-xs font-medium text-gray-600">Address</label>
                                  <p className="text-sm">{ac.contact.extras.address}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Unable to load user details</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>              <ProtectedComponent requiredAction="users.update" orgId={currentOrgId || undefined}>
                <Button onClick={() => {
                  if (viewDetailedUser) {
                    setIsViewDialogOpen(false);
                    // Create a proper User object with required properties
                    const userForEdit: User = {
                      ...viewDetailedUser,
                      isVerified: (viewDetailedUser as any).isVerified ?? false,
                      systemRole: (viewDetailedUser as any).systemRole ?? "",
                      refreshToken: (viewDetailedUser as any).refreshToken ?? null,
                      createdAt: (viewDetailedUser as any).createdAt || new Date().toISOString(),
                    };
                    handleEditUser(userForEdit);
                  }
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </Button>
              </ProtectedComponent>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this user? This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}