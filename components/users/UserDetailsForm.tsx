"use client";

import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";

export interface UserFormData {
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

type UserDetailsFormProps = {
  user: UserFormData;
  onChange: (user: UserFormData) => void;
  disabledFields?: Partial<Record<keyof UserFormData, boolean>>;
  prefix?: string;
};

export function UserDetailsForm({ 
  user, 
  onChange, 
  disabledFields = {}, 
  prefix = "" 
}: UserDetailsFormProps) {
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
      {/* <Input
        placeholder="Aadhaar"
        value={user.aadhaar}
        onChange={(e) => onChange({ ...user, aadhaar: e.target.value })}
        disabled={!!disabledFields.aadhaar}
        id={`${prefix}aadhaar`}
      /> */}
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
      {/* <Input
        placeholder="Religion"
        value={user.religion}
        onChange={(e) => onChange({ ...user, religion: e.target.value })}
        disabled={!!disabledFields.religion}
        id={`${prefix}religion`}
      /> */}
      {/* <Input
        placeholder="Caste"
        value={user.caste}
        onChange={(e) => onChange({ ...user, caste: e.target.value })}
        disabled={!!disabledFields.caste}
        id={`${prefix}caste`}
      /> */}
      {/* <Input
        placeholder="Annual Income"
        value={user.annualIncome}
        onChange={(e) => onChange({ ...user, annualIncome: e.target.value })}
        disabled={!!disabledFields.annualIncome}
        id={`${prefix}annualIncome`}
      /> */}
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
