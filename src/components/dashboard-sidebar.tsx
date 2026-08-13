import { Link, useRouterState } from "@tanstack/react-router";
import {
  FileText,
  FolderKanban,
  GraduationCap,
  Home,
  LayoutDashboard,
  MessagesSquare,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const ICON_CLASS = "h-5 w-5 shrink-0";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};

/**
 * Workspace navigation for the dashboard shell.
 * Project-scoped links resolve against the most recent project when one exists,
 * otherwise they send the student to the project creation flow.
 */
export function DashboardSidebar({ projectId }: { projectId?: string | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (path: string) => pathname === path;

  const items: NavItem[] = [
    { title: "Home", url: "/", icon: Home, active: isActive("/") },
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, active: isActive("/dashboard") },
    {
      title: "Projects",
      url: projectId ? "/projects/$projectId" : "/new-project",
      icon: FolderKanban,
      active: pathname.startsWith("/projects/"),
    },
    {
      title: "Documentation",
      url: projectId ? "/projects/$projectId/documents" : "/new-project",
      icon: FileText,
      active: pathname.startsWith("/projects/") && pathname.includes("/documents"),
    },
    {
      title: "Viva",
      url: projectId ? "/projects/$projectId/review" : "/new-project",
      icon: MessagesSquare,
      active: pathname.startsWith("/projects/") && pathname.includes("/review"),
    },
    { title: "Settings", url: "/settings", icon: Settings, active: isActive("/settings") },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-2 font-display">
          <GraduationCap className="h-6 w-6 shrink-0 text-primary" />
          <span className="truncate group-data-[collapsible=icon]:hidden">Project Helper</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={Boolean(item.active)}
                    tooltip={item.title}
                    className="py-2.5"
                  >
                    {item.url.includes("$") ? (
                      <Link to={item.url as "/projects/$projectId"} params={{ projectId: projectId! }}>
                        <item.icon className={ICON_CLASS} />
                        <span>{item.title}</span>
                      </Link>
                    ) : (
                      <Link to={item.url}>
                        <item.icon className={ICON_CLASS} />
                        <span>{item.title}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
