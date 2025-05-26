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
  SidebarFooter,
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

interface AppSidebarProps {
  onLogout: () => void;
}

export function AppSidebar({ onLogout }: AppSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      title: "Topic Search",
      icon: Search,
      href: "/dashboard/topic-search",
    },
    {
      title: "Create Post",
      icon: PlusCircle,
      href: "/dashboard/create-post",
    },
    {
      title: "Manage Comments",
      icon: MessageSquare,
      href: "/dashboard/manage-comments",
    },
    {
      title: "Page Setup",
      icon: LayoutGrid,
      href: "/dashboard/page-setup",
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 gap-1">
          <GlobeLock className="shrink-0 group-data-[collapsible=icon]:hidden" />
          <h2 className="text-xl font-black tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            PORTAL
          </h2>
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
                      <item.icon className="shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-2 py-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onLogout}
                  className="w-full justify-start gap-4 px-2 text-destructive hover:bg-destructive/10 group-data-[collapsible=icon]:justify-center"
                  tooltip="Sign Out"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Sign Out
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
