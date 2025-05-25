"use client";

import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/services/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background">
          <AppSidebar onLogout={handleLogout} />
          <main className="flex-1 overflow-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-bold">
                  Facebook Topics & Posting Portal
                </h1>
              </div>
            </div>
            <div className="p-6">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
