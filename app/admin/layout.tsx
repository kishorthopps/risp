import { Sidebar } from "@/components/layout/sidebar";
import { RouteGuard } from "@/components/rbac/RouteGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard 
      requiredSystemRole={["SUPER_USER", "ORG_ADMIN"]}
      redirectTo="/app/projects"
    >
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-60 p-6">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
} 