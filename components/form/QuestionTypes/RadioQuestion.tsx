"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "@/components/ui/motion";

interface RadioQuestionProps {
  question: string;
  options: string[];
  onChange: (value: string) => void;
  value?: string;
}

export default function RadioQuestion({ question, options, onChange, value }: RadioQuestionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-semibold tracking-tight">{question}</h2>
        <RadioGroup 
        value={value} 
        onValueChange={onChange}
        className="space-y-3"
      >
        {options.map((option) => (
          <div 
            key={option} 
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
            onClick={() => onChange(option)}
          >
            <RadioGroupItem value={option} id={option} />
            <Label htmlFor={option} className="text-lg cursor-pointer flex-1">{option}</Label>
          </div>
        ))}
      </RadioGroup>
    </motion.div>
  );
}