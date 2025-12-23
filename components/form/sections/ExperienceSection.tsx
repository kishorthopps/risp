"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion } from "@/components/ui/motion";

interface ExperienceData {
  yearsExperience?: string;
  currentRole?: string;
  experienceLevel?: string;
  relevantSkills?: string;
}

interface ExperienceSectionProps {
  onDataChange: (data: ExperienceData) => void;
  data: ExperienceData;
}

export default function ExperienceSection({ onDataChange, data }: ExperienceSectionProps) {
  const [formState, setFormState] = useState<ExperienceData>({
    yearsExperience: "",
    currentRole: "",
    experienceLevel: "intermediate",
    relevantSkills: "",
    ...data
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: string) => {
    setFormState(prev => ({ ...prev, experienceLevel: value }));
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
        <h1 className="text-3xl font-bold tracking-tight">Professional Experience</h1>
        <p className="text-muted-foreground">Tell us about your professional background</p>
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                name="yearsExperience"
                type="number"
                placeholder="Enter years of experience"
                value={formState.yearsExperience}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentRole">Current Role</Label>
              <Input
                id="currentRole"
                name="currentRole"
                placeholder="Enter your current role"
                value={formState.currentRole}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Experience Level</Label>
            <RadioGroup 
              value={formState.experienceLevel} 
              onValueChange={handleRadioChange} 
              className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="beginner" id="beginner" />
                <Label htmlFor="beginner" className="cursor-pointer">Beginner</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="intermediate" id="intermediate" />
                <Label htmlFor="intermediate" className="cursor-pointer">Intermediate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expert" id="expert" />
                <Label htmlFor="expert" className="cursor-pointer">Expert</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="relevantSkills">Relevant Skills</Label>
            <Textarea
              id="relevantSkills"
              name="relevantSkills"
              placeholder="List your relevant skills, separated by commas"
              value={formState.relevantSkills}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}