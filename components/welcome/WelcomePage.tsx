"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Heart, KeyRound } from "lucide-react";
import { mcApiService } from "@/lib/mcApiService";

interface WelcomePageProps {
  isAuthenticated?: boolean;
  isSuperAdmin?: boolean;
}

export default function WelcomePage({ isAuthenticated, isSuperAdmin }: WelcomePageProps) {
  const [accessCode, setAccessCode] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Super user override and auto-populate
  useEffect(() => {
    // Super user override
    const superParam = searchParams.get('super');
    if (superParam === 'true') {
      handleSuperUserBypass();
      return; // Stop further processing
    }

    const codeParam = searchParams.get('code');
    const keyParam = searchParams.get('key');

    if (codeParam) {
      setAccessCode(codeParam);
    }

    if (keyParam) {
      setAccessKey(keyParam);
    }

    // Auto-submit if both parameters are present
    if (codeParam && keyParam) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        handleSubmit(null, codeParam, keyParam);
      }, 100);
    }
  }, [searchParams, router]);

  const handleSuperUserBypass = () => {
    const superUserData = {
      id: 'super-user-assignment-id',
      userId: 'super-user-id',
      slug: 'super-user-slug',
      organisationId: 'super-user-org-id',
    };
    router.push(`./q/form?id=${superUserData.id}&userId=${superUserData.userId}&slug=${superUserData.slug}&organisationId=${superUserData.organisationId}`);
  };

  const handleSubmit = async (e: React.FormEvent | null, code?: string, key?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    const submitCode = code || accessCode;
    const submitKey = key || accessKey;

    try {
      const data = await mcApiService.post("/organisations/assessment-assignments/verify", {
        accessCode: submitCode,
        accessSecret: submitKey,
      });
      const { id, userId, organisationId } = data.assignment;
      const { slug } = data;
      console.log("slug", slug);
      // Redirect to the form with id, userId, slug, and organisationId as query parameters
      router.push(`./q/form?id=${id}&userId=${userId}&slug=${slug}&organisationId=${organisationId}`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="absolute top-10 left-10">
        <div className="flex items-center gap-2">
          <Heart className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold">RISP</span>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-lg border-border/50 animate-fade-in duration-500">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">RISP</CardTitle>
          <CardDescription>
            Enter your access code and key to continue to the form
          </CardDescription>
        </CardHeader>
        <form onSubmit={(e) => handleSubmit(e)}>
          <CardContent className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="accessCode">Access Code</Label>
              <div className="relative">
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="Enter your access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="pl-10"
                  required
                />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessKey">Access Key</Label>
              <div className="relative">
                <Input
                  id="accessKey"
                  // type="password" // Explicitly set the type
                  placeholder="Enter your access key"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="pl-10"
                  required
                />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <Button
              type="submit"
              className="w-full transition-all duration-300 hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Continue to Form"}
            </Button>
            {isAuthenticated && isSuperAdmin && (
              <Button
                onClick={handleSuperUserBypass}
                className="w-full transition-all duration-300 hover:scale-[1.02] mt-2"
                variant="secondary"
              >
                Super User Bypass
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={() => router.push("/form-builder")}
            >
              Go to Form Builder
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}