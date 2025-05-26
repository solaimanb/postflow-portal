"use client";

import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/services/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { GlobeLock } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  useEffect(() => {
    const savedState = localStorage.getItem("sidebar_state");
    if (savedState !== null) {
      setSidebarOpen(savedState === "true");
    }
  }, []);

  const handleSidebarOpenChange = (open: boolean) => {
    setSidebarOpen(open);
    localStorage.setItem("sidebar_state", String(open));
  };

  return (
    <ProtectedRoute>
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={handleSidebarOpenChange}
      >
        <div className="flex min-h-screen bg-background">
          <AppSidebar onLogout={handleLogout} />
          <main className="flex-1 overflow-auto">
            <div className="flex lg:hidden items-center justify-between p-4 border-b">
              <div className="flex items-center gap-1">
                <GlobeLock className="h-6 w-6 shrink-0" />
                <h1 className="text-xl font-black tracking-tight">
                  PORTAL
                </h1>
              </div>
              <SidebarTrigger />
            </div>
            <div className="p-6">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
