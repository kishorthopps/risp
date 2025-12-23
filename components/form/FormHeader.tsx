"use client";

import { Heart } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";

interface FormHeaderProps {
  currentQuestion?: number;
  totalQuestions?: number;
  showProgress?: boolean;
}

export default function FormHeader({ currentQuestion, totalQuestions, showProgress = true }: FormHeaderProps) {
  const router = useRouter();
  
  const progress = showProgress && currentQuestion !== undefined && totalQuestions 
    ? (currentQuestion / (totalQuestions - 1)) * 100 
    : 0;
  
  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
      <div className="container max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => router.push("/")}
        >
          <img src="/NH_logo.png" alt="Nalla Health" className="w-48" draggable="false" />
          {/* <span className="text-lg font-semibold">Nalla Health</span> */}
        </div>
        
        {showProgress && currentQuestion !== undefined && totalQuestions && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentQuestion + 1} of {totalQuestions}
            </span>
          </div>
        )}
      </div>
      {showProgress && <Progress value={progress} className="h-1" />}
    </header>
  );
}