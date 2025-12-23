"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useMutation } from '@tanstack/react-query';
import { mcApiService } from "@/lib/mcApiService";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      router.replace("/forgot-password");
    }
  }, [token, router]);

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { token: string; newPassword: string }) => mcApiService.post("/auth/reset-password", data),
    onSuccess: () => {
      toast.success("Password has been reset successfully! You can now log in.");
      router.replace("/"); // Redirect to login page
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.message || "Failed to reset password. The link may have expired.";
      toast.error(errorMessage);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (token) {
      resetPasswordMutation.mutate({ token, newPassword });
    }
  };

  if (!token) {
    return null; // Or a loading/error state
  }

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
              Reset Your Password
            </CardTitle>
            <p className="text-sm text-center text-gray-500 mt-2">
              Enter your new password below.
            </p>
          </CardHeader>

          <CardContent className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-full px-4 py-3 transition-all duration-200"
                  required
                  disabled={resetPasswordMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-full px-4 py-3 transition-all duration-200"
                  required
                  disabled={resetPasswordMutation.isPending}
                />
              </div>
              
              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full rounded-full py-3 bg-primary_orange hover:bg-primary_orange/90 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Wrap the component in Suspense because useSearchParams() requires it
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}