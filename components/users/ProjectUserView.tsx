"use client";

import { UserCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface Role {
  id: string;
  name: string;
}

interface AlternateContact {
  id: string;
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
    orgUsers?: Array<{
      roleId: string;
    }>;
  };
}

interface DetailedUser {
  id: string;
  name: string;
  email: string;
  roleId?: string;
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
  alternateContacts?: AlternateContact[];
}

interface ProjectUserViewProps {
  user: DetailedUser;
  roles: Role[];
  onEdit?: () => void;
  showEditButton?: boolean;
}

export function ProjectUserView({ 
  user, 
  roles, 
  onEdit, 
  showEditButton = true 
}: ProjectUserViewProps) {
  return (
    <div className="space-y-6">
      {/* Main User Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              User Information
            </CardTitle>
            {showEditButton && onEdit && (
              <Button onClick={onEdit} variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Name</label>
              <p className="text-sm font-semibold">{user.name || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-sm">{user.email || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Role</label>
              <p className="text-sm">
                {roles.find(r => r.id === user.roleId)?.name || "No Role Assigned"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Mobile</label>
              <p className="text-sm">{user.mobile || "N/A"}</p>
            </div>
            {/* <div>
              <label className="text-sm font-medium text-gray-600">Aadhaar</label>
              <p className="text-sm">{user.aadhaar || "N/A"}</p>
            </div> */}
            <div>
              <label className="text-sm font-medium text-gray-600">Date of Birth</label>
              <p className="text-sm">{user.dob || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Nationality</label>
              <p className="text-sm">{user.nationality || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Country</label>
              <p className="text-sm">{user.country || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">State</label>
              <p className="text-sm">{user.state || "N/A"}</p>
            </div>
            {/* <div>
              <label className="text-sm font-medium text-gray-600">Religion</label>
              <p className="text-sm">{user.religion || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Caste</label>
              <p className="text-sm">{user.caste || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Annual Income</label>
              <p className="text-sm">{user.annualIncome || "N/A"}</p>
            </div> */}
            <div>
              <label className="text-sm font-medium text-gray-600">Language Preference</label>
              <p className="text-sm">{user.languagePreference || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Address</label>
              <p className="text-sm">{user.address || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternate Contacts */}
      {user.alternateContacts && user.alternateContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Alternate Contacts ({user.alternateContacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.alternateContacts.map((ac, index) => (
                <Card key={ac.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Contact #{index + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-sm font-semibold">{ac.contact.name || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-sm">{ac.contact.email || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Relationship</label>
                        <p className="text-sm">{ac.relationship || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Role</label>
                        <p className="text-sm">
                          {roles.find(r => r.id === ac.contact.orgUsers?.[0]?.roleId)?.name || "No Role Assigned"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Mobile</label>
                        <p className="text-sm">{ac.contact.extras?.mobile || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Aadhaar</label>
                        <p className="text-sm">{ac.contact.extras?.aadhaar || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                        <p className="text-sm">{ac.contact.extras?.dob || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Nationality</label>
                        <p className="text-sm">{ac.contact.extras?.nationality || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Country</label>
                        <p className="text-sm">{ac.contact.extras?.country || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">State</label>
                        <p className="text-sm">{ac.contact.extras?.state || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Religion</label>
                        <p className="text-sm">{ac.contact.extras?.religion || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Caste</label>
                        <p className="text-sm">{ac.contact.extras?.caste || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Annual Income</label>
                        <p className="text-sm">{ac.contact.extras?.annualIncome || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Language Preference</label>
                        <p className="text-sm">{ac.contact.extras?.languagePreference || "N/A"}</p>
                      </div>
                    </div>
                    {ac.contact.extras?.address && (
                      <div className="mt-3">
                        <label className="text-sm font-medium text-gray-600">Address</label>
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
  );
}
