"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useMutation } from '@tanstack/react-query';
import { mcApiService } from "@/lib/mcApiService";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => mcApiService.post("/auth/forgot-password", { email }),
    onSuccess: () => {
      toast.success("Password reset link sent! Please check your email.");
      router.push("/"); // Redirect to login page
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.message || "An error occurred. Please try again.";
      toast.error(errorMessage);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    forgotPasswordMutation.mutate(email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background_cream">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-lg rounded-2xl overflow-hidden border border-gray-200 bg-white">
          <CardHeader className="px-8 pt-10 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              Forgot Password
            </CardTitle>
            <p className="text-sm text-center text-gray-500 mt-2">
              Enter your email to receive a reset link.
            </p>
          </CardHeader>

          <CardContent className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-full px-4 py-3 transition-all duration-200"
                  required
                  disabled={forgotPasswordMutation.isPending}
                />
              </div>
              
              <Button
                type="submit"
                disabled={forgotPasswordMutation.isPending}
                className="w-full rounded-full py-3 bg-primary_orange hover:bg-primary_orange/90 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}