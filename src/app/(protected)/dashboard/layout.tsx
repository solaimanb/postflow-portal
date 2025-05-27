"use client";

import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/services/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { GlobeLock } from "lucide-react";
import { Toaster } from "sonner";

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
        <div className="flex bg-background w-full">
          <AppSidebar onLogout={handleLogout} />
          <main className="flex-1 overflow-auto w-full">
            <div className="flex lg:hidden items-center justify-between p-4 border-b">
              <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                <div className="rounded-lg bg-blue-600 p-1">
                  <GlobeLock className="h-5 w-5 shrink-0 text-white" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                  PORTAL
                </h2>
              </div>
              <SidebarTrigger />
            </div>

            <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              {children}
            </div>
          </main>
        </div>
        <Toaster richColors />
      </SidebarProvider>
    </ProtectedRoute>
  );
}
