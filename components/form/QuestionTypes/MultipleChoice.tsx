"use client";

import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "@/components/ui/motion";

interface MultipleChoiceProps {
  question: string;
  options: string[];
  onChange: (value: string) => void;
  value?: string;
}

export default function MultipleChoice({ question, options, onChange, value }: MultipleChoiceProps) {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(value);
  const [isBlinking, setIsBlinking] = useState(false);

  const handleChange = (newValue: string) => {
    setSelectedOption(newValue);
    setIsBlinking(true);
    onChange(newValue);
    
    setTimeout(() => {
      setIsBlinking(false);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-semibold tracking-tight">{question}</h2>
      
      <RadioGroup 
        value={value} 
        onValueChange={handleChange}
        className="space-y-3"
      >        {options.map((option) => (
          <motion.div
            key={option}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
              isBlinking && selectedOption === option
                ? "bg-blue-100 dark:bg-blue-900/30"
                : "hover:bg-secondary"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleChange(option)}
          >
            <RadioGroupItem value={option} id={option} />
            <Label htmlFor={option} className="text-lg cursor-pointer flex-1">{option}</Label>
          </motion.div>
        ))}
      </RadioGroup>
    </motion.div>
  );
}