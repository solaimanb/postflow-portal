"use client";

import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/services/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

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

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar_state");
    if (savedState !== null) {
      setSidebarOpen(savedState === "true");
    }
  }, []);

  // Save sidebar state to localStorage when it changes
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
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

