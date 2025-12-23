import { Sidebar } from "@/components/layout/sidebar";
import { Suspense } from "react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Suspense fallback={<div className="w-64 bg-background border-r" />}>
        <Sidebar />
      </Suspense>
      <main className="flex-1 ml-60 p-6">
        {children}
      </main>
    </div>
  );
} 