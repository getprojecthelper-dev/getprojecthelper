import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, FileText, Home, LayoutDashboard, MessagesSquare, Settings, Zap } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { getMyCredits } from "@/lib/credits.functions";
import { formatCredits } from "@/lib/credit-costs";


const ICON_CLASS = "h-5 w-5 shrink-0";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};

function CreditCard() {
  const fetchCredits = useServerFn(getMyCredits);
  const { data } = useQuery({
    queryKey: ["credits"],
    queryFn: () => fetchCredits(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const balance = data ? formatCredits(data.balance) : "—";
  const total = data ? formatCredits(data.lifetimeGranted) : "—";

  return (
    <Link
      to="/credits"
      className="group block rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4 transition-colors hover:bg-sidebar-accent"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
        AI Credits
      </p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-sidebar-foreground">
          {balance}
        </span>
        <span className="text-sm text-sidebar-foreground/50">/ {total}</span>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary">
        <Zap className="h-4 w-4" />
        <span>Top up</span>
      </div>
    </Link>
  );
}

function useProjectDomain(projectId?: string) {
  return useQuery({
    queryKey: ["project-domain", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase.from("projects").select("domain").eq("id", projectId).maybeSingle();
      if (error) return null;
      return (data?.domain as string | undefined) ?? null;
    },
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

/**
 * Workspace navigation for the dashboard shell.
 */
export function DashboardSidebar({ projectId }: { projectId?: string | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const domain = useProjectDomain(projectId).data;

  const isActive = (path: string) => pathname === path;

  const fallbackUrl = "/dashboard";

  const items: NavItem[] = [
    { title: "Home", url: "/", icon: Home, active: isActive("/") },
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, active: isActive("/dashboard") },
    {
      title: "Documentation",
      url: projectId ? "/projects/$projectId/documents" : fallbackUrl,
      icon: FileText,
      active: pathname.startsWith("/projects/") && pathname.includes("/documents"),
    },
    {
      title: "Viva",
      url: projectId ? "/projects/$projectId/review" : fallbackUrl,
      icon: MessagesSquare,
      active: pathname.startsWith("/projects/") && pathname.includes("/review"),
    },
    {
      title: "AI Mentor",
      url: projectId ? "/projects/$projectId/mentor" : fallbackUrl,
      icon: Bot,
      active: pathname.startsWith("/projects/") && pathname.includes("/mentor"),
    },
  ];


  items.push({ title: "Settings", url: "/settings", icon: Settings, active: isActive("/settings") });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-5">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 font-display text-lg font-semibold text-sidebar-foreground"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </span>
          <span className="truncate group-data-[collapsible=icon]:hidden">
            Project Helper
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarMenu className="space-y-1">
          {items.map((item) => {
            const active = Boolean(item.active);
            const content = (
              <>
                <item.icon className={cn(ICON_CLASS, "text-current")} />
                <span className="truncate">{item.title}</span>
              </>
            );

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={cn(
                    "h-11 rounded-xl px-3 text-[15px] font-medium text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    active && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
                  )}
                >
                  {item.url.includes("$") ? (
                    <Link
                      to={item.url as "/projects/$projectId"}
                      params={{ projectId: projectId! }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <Link to={item.url}>{content}</Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="mt-auto px-3 pb-4 group-data-[collapsible=icon]:hidden">
        <CreditCard />
      </SidebarFooter>
    </Sidebar>
  );
}
