"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { motion } from "@/components/ui/motion";

interface FeedbackData {
  satisfaction?: number;
  improvements?: string;
  recommendations?: string;
}

interface FeedbackSectionProps {
  onDataChange: (data: FeedbackData) => void;
  data: FeedbackData;
}

export default function FeedbackSection({ onDataChange, data }: FeedbackSectionProps) {
  const [formState, setFormState] = useState<FeedbackData>({
    satisfaction: 5,
    improvements: "",
    recommendations: "",
    ...data
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (value: number[]) => {
    setFormState(prev => ({ ...prev, satisfaction: value[0] }));
  };

  useEffect(() => {
    onDataChange(formState);
  }, [formState, onDataChange]);

  const getSatisfactionLabel = (value: number) => {
    if (value <= 2) return "Not satisfied";
    if (value <= 4) return "Somewhat satisfied";
    if (value <= 7) return "Satisfied";
    if (value <= 9) return "Very satisfied";
    return "Extremely satisfied";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Your Feedback</h1>
        <p className="text-muted-foreground">Help us improve with your valuable feedback</p>
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Overall Satisfaction</Label>
              <div className="pt-2">
                <Slider
                  value={[formState.satisfaction || 5]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={handleSliderChange}
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>1</span>
                <span className="font-medium text-primary">
                  {formState.satisfaction}: {getSatisfactionLabel(formState.satisfaction || 5)}
                </span>
                <span>10</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="improvements">What could we improve?</Label>
            <Textarea
              id="improvements"
              name="improvements"
              placeholder="Please share your thoughts on what we could improve..."
              value={formState.improvements}
              onChange={handleTextChange}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recommendations">Would you recommend us to others? Why or why not?</Label>
            <Textarea
              id="recommendations"
              name="recommendations"
              placeholder="Please explain why you would or wouldn't recommend us..."
              value={formState.recommendations}
              onChange={handleTextChange}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}