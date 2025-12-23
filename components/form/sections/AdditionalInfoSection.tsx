"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { motion } from "@/components/ui/motion";

interface AdditionalInfoData {
  hearAboutUs?: string;
  additionalComments?: string;
  receiveUpdates?: boolean;
}

interface AdditionalInfoSectionProps {
  onDataChange: (data: AdditionalInfoData) => void;
  data: AdditionalInfoData;
}

export default function AdditionalInfoSection({ onDataChange, data }: AdditionalInfoSectionProps) {
  const [formState, setFormState] = useState<AdditionalInfoData>({
    hearAboutUs: "",
    additionalComments: "",
    receiveUpdates: true,
    ...data
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormState(prev => ({ ...prev, receiveUpdates: checked }));
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
        <h1 className="text-3xl font-bold tracking-tight">Final Steps</h1>
        <p className="text-muted-foreground">Almost done! Just a few more details...</p>
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="hearAboutUs">How did you hear about us?</Label>
            <Input
              id="hearAboutUs"
              name="hearAboutUs"
              placeholder="Search engine, social media, friend, etc."
              value={formState.hearAboutUs}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="additionalComments">Any additional comments or questions?</Label>
            <Textarea
              id="additionalComments"
              name="additionalComments"
              placeholder="Please share any additional thoughts or questions you may have..."
              value={formState.additionalComments}
              onChange={handleChange}
              rows={4}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="receiveUpdates"
              checked={formState.receiveUpdates}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="receiveUpdates" className="cursor-pointer">
              I would like to receive updates about new features and improvements
            </Label>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}