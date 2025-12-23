"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "@/components/ui/motion";

interface ShortAnswerProps {
  question: string;
  onChange: (value: string) => void;
  value?: string;
}

export default function ShortAnswer({ question, onChange, value }: ShortAnswerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-semibold tracking-tight">{question}</h2>
      
      <div className="space-y-2">
        <Label htmlFor="short-answer">Your answer</Label>
        <Input
          id="short-answer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-lg"
        />
      </div>
    </motion.div>
  );
}