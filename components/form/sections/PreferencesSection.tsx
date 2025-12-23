"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "@/components/ui/motion";

interface PreferencesData {
  workPreference?: string;
  interests?: string[];
  availability?: string;
}

interface PreferencesSectionProps {
  onDataChange: (data: PreferencesData) => void;
  data: PreferencesData;
}

export default function PreferencesSection({ onDataChange, data }: PreferencesSectionProps) {
  const [formState, setFormState] = useState<PreferencesData>({
    workPreference: "",
    interests: [],
    availability: "",
    ...data
  });

  const interests = [
    { id: "design", label: "Design" },
    { id: "development", label: "Development" },
    { id: "marketing", label: "Marketing" },
    { id: "research", label: "Research" },
    { id: "analytics", label: "Analytics" },
    { id: "management", label: "Management" },
  ];

  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean, id: string) => {
    setFormState(prev => {
      const currentInterests = prev.interests || [];
      
      if (checked) {
        return { ...prev, interests: [...currentInterests, id] };
      } else {
        return { ...prev, interests: currentInterests.filter(item => item !== id) };
      }
    });
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
        <h1 className="text-3xl font-bold tracking-tight">Your Preferences</h1>
        <p className="text-muted-foreground">Tell us about your preferences and interests</p>
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workPreference">Work Environment Preference</Label>
            <Select 
              value={formState.workPreference} 
              onValueChange={(value) => handleSelectChange("workPreference", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your preferred work environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="office">Office-based</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label>Areas of Interest (Select all that apply)</Label>
            <div className="grid grid-cols-2 gap-2">
              {interests.map((interest) => (
                <div key={interest.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={interest.id} 
                    checked={formState.interests?.includes(interest.id)} 
                    onCheckedChange={(checked) => handleCheckboxChange(checked as boolean, interest.id)}
                  />
                  <Label htmlFor={interest.id} className="cursor-pointer">{interest.label}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Select 
              value={formState.availability} 
              onValueChange={(value) => handleSelectChange("availability", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fullTime">Full-time</SelectItem>
                <SelectItem value="partTime">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}