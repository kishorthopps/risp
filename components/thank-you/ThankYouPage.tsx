"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home, Send, Heart } from "lucide-react";
import { motion } from "@/components/ui/motion";

export default function ThankYouPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const finalScore = searchParams?.get("finalScore");
  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
    // Trigger confetti effect when page loads
    setShowConfetti(true);
    
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary">
      <header className="container max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2">
          <img src="/NH_logo.png" alt="Nalla Health" className="w-48" draggable="false" />
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-lg border-border/50">
            <CardHeader className="text-center pb-2">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold">Thank You!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <p className="text-lg">
                Your form has been successfully submitted.
              </p>
              <p className="text-muted-foreground">
                We appreciate your time and input. We'll be in touch shortly.
              </p>
              {/* <p className="text-lg font-bold">
                Your Final Score: {finalScore}
              </p> */}
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              {/* <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push("/")}
              >
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Button> */}
              <a
                href="https://nallahealth.life"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-accent transition-colors"
              >
                <Send className="mr-2 h-4 w-4" />
                Visit RISP
              </a>
            </CardFooter>
          </Card>
        </motion.div>
      </main>
      
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 animate-fall-slow">
            <div className="h-3 w-3 bg-primary rotate-45" />
          </div>
          <div className="absolute top-0 left-1/2 animate-fall-medium">
            <div className="h-3 w-3 bg-blue-400 rounded-full" />
          </div>
          <div className="absolute top-0 right-1/4 animate-fall-fast">
            <div className="h-3 w-3 bg-blue-300 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}