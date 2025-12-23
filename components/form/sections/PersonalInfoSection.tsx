"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "@/components/ui/motion";

interface PersonalInfoData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface PersonalInfoSectionProps {
  onDataChange: (data: PersonalInfoData) => void;
  data: PersonalInfoData;
}

export default function PersonalInfoSection({ onDataChange, data }: PersonalInfoSectionProps) {
  const [formState, setFormState] = useState<PersonalInfoData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    ...data
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    onDataChange(formState);
  }, [formState, onDataChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Personal Information</h1>
        <p className="text-muted-foreground">Let&apos;s start with some basic information about you</p>
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Enter your first name"
                value={formState.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Enter your last name"
                value={formState.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={formState.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formState.phone}
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}