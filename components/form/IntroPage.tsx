"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface IntroPageProps {
  onStart: () => void;
}

export default function IntroPage({ onStart }: IntroPageProps) {
  return (
    <div className="max-w-3xl mx-auto text-center space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-primary">
          Wellbeing Assessment
        </h1>
        
        <div className="text-left space-y-4 bg-card p-6 rounded-lg border">
          <p className="text-lg leading-relaxed">
            Dear parents,
          </p>
          
          <p className="leading-relaxed">
            We really appreciate your taking the time to complete this questionnaire about your child's well-being and health-related quality of life. Since it is a matter of your own assessment of your child's well-being, please complete the questionnaire yourself according to the instructions, i.e. without asking your child.
          </p>
          
          <ul className="space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <span className="text-primary font-semibold">•</span>
              <span>Read each question carefully.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-semibold">•</span>
              <span>Think about how your child has been feeling during the past week.</span>
            </li>
          </ul>
        </div>
      </div>
      
      <Button 
        onClick={onStart}
        size="lg"
        className="flex items-center gap-2"
      >
        Start Assessment
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
