import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { GraduationCap, LogOut, Settings } from "lucide-react";
import type { ReactNode } from "react";

import { CreditChip } from "@/components/credit-chip";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { LowCreditsBanner } from "@/components/low-credits-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useProjectsOverview } from "@/lib/db";
import { signOutAndRedirect } from "@/lib/sign-out";

/**
 * Persistent workspace chrome: sidebar + header shared by every signed-in page.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { projectId?: string };
  const { data: overviews } = useProjectsOverview();
  const projectId = params.projectId ?? overviews?.[0]?.project.id;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-secondary/30">
        <DashboardSidebar projectId={projectId} />
        <SidebarInset className="min-w-0 flex-1 bg-secondary/30">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-16 items-center justify-between gap-2 px-4">
              <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="shrink-0" />
                <Link to="/dashboard" className="flex min-w-0 items-center gap-2 font-display">
                  <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
                  <span className="hidden truncate sm:inline">Project Helper</span>
                </Link>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <CreditChip />
                <ThemeToggle />
                <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                  <Link to="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={() =>
                    void signOutAndRedirect(() => navigate({ to: "/auth", replace: true }))
                  }
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </Button>
              </div>
            </div>
          </header>

          <LowCreditsBanner />

          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
