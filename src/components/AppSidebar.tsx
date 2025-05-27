"use client";

import {
  Search,
  PlusCircle,
  MessageSquare,
  LogOut,
  LayoutGrid,
  GlobeLock,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";

interface AppSidebarProps {
  onLogout: () => void;
}

export function AppSidebar({ onLogout }: AppSidebarProps) {
  const pathname = usePathname();

  const getIconColor = (color: string) => {
    switch (color) {
      case "indigo":
        return "text-indigo-600";
      case "pink":
        return "text-pink-600";
      case "blue":
        return "text-blue-600";
      case "emerald":
        return "text-emerald-600";
      default:
        return "text-gray-600";
    }
  };

  const menuItems = [
    {
      title: "Topic Search",
      icon: Search,
      href: "/dashboard/topic-search",
      color: "indigo",
    },
    {
      title: "Create Post",
      icon: PlusCircle,
      href: "/dashboard/create-post",
      color: "pink",
    },
    {
      title: "Manage Comments",
      icon: MessageSquare,
      href: "/dashboard/manage-comments",
      color: "blue",
    },
    {
      title: "Page Setup",
      icon: LayoutGrid,
      href: "/dashboard/page-setup",
      color: "emerald",
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 gap-1">
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
            <div className="rounded-lg bg-blue-600 p-1">
              <GlobeLock className="h-5 w-5 shrink-0 text-white" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              PORTAL
            </h2>
          </div>
          <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:ml-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-sidebar-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className={cn(
                      "w-full justify-start gap-4 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center",
                      pathname === item.href &&
                        "bg-sidebar-accent border text-sidebar-accent-foreground"
                    )}
                    tooltip={item.title}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "py-2 font-medium",
                        pathname !== item.href && "border border-transparent"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "shrink-0",
                          pathname !== item.href && getIconColor(item.color)
                        )}
                      />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <Separator className="my-2" />

              {/* Sign Out Button */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onLogout}
                  className="w-full justify-start gap-4 px-2 text-red-400 hover:bg-red-50 hover:text-red-500 group-data-[collapsible=icon]:justify-center"
                  tooltip="Sign Out"
                >
                  <div className="py-2 font-medium flex items-center gap-4">
                    <LogOut className="h-4 w-4 shrink-0 text-blue-600" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Sign Out
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
