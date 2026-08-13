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

/**
 * Workspace navigation for the dashboard shell.
 * Project-scoped links resolve against the most recent project when one exists,
 * otherwise they send the student to the project creation flow.
 */
export function DashboardSidebar({ projectId }: { projectId?: string | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (path: string) => pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-2 font-display">
          <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
          <span className="truncate group-data-[collapsible=icon]:hidden">Project Helper</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/")} tooltip="Home">
                  <Link to="/">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")} tooltip="Dashboard">
                  <Link to="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Projects">
                  {projectId ? (
                    <Link to="/projects/$projectId" params={{ projectId }}>
                      <FolderKanban className="h-4 w-4" />
                      <span>Projects</span>
                    </Link>
                  ) : (
                    <Link to="/new-project">
                      <FolderKanban className="h-4 w-4" />
                      <span>Projects</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Documentation">
                  {projectId ? (
                    <Link to="/projects/$projectId/documents" params={{ projectId }}>
                      <FileText className="h-4 w-4" />
                      <span>Documentation</span>
                    </Link>
                  ) : (
                    <Link to="/new-project">
                      <FileText className="h-4 w-4" />
                      <span>Documentation</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Viva">
                  {projectId ? (
                    <Link to="/projects/$projectId/review" params={{ projectId }}>
                      <MessagesSquare className="h-4 w-4" />
                      <span>Viva</span>
                    </Link>
                  ) : (
                    <Link to="/new-project">
                      <MessagesSquare className="h-4 w-4" />
                      <span>Viva</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/settings")} tooltip="Settings">
                  <Link to="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
