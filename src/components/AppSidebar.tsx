import { Search, PlusCircle, MessageSquare, LogOut, LayoutGrid } from "lucide-react"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  onLogout: () => void;
}

export function AppSidebar({ onLogout }: AppSidebarProps) {
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
  ]

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold tracking-tight">FB Topics Portal</h2>
      </SidebarHeader>
      <SidebarContent className="px-4 py-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild
                className="w-full justify-start gap-4 px-2 hover:bg-accent hover:text-accent-foreground"
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t px-4 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={onLogout}
              className="w-full justify-start gap-4 px-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
} 