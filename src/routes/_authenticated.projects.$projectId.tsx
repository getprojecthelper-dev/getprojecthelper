import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookMarked,
  CheckSquare,
  Code2,
  ClipboardList,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Presentation,
  ScrollText,
} from "lucide-react";

import { ErrorState, LoadingState } from "@/components/state-views";
import { CreditChip } from "@/components/credit-chip";
import { LowCreditsBanner } from "@/components/low-credits-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/use-workspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  component: WorkspaceLayout,
});

const NAV = [
  { to: "/projects/$projectId", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/projects/$projectId/build", label: "Implementation", icon: Code2 },
  { to: "/projects/$projectId/tasks", label: "Plan & tasks", icon: ListChecks },
  { to: "/projects/$projectId/requirements", label: "Requirements", icon: ClipboardList },
  { to: "/projects/$projectId/testing", label: "Testing", icon: CheckSquare },
  { to: "/projects/$projectId/experiments", label: "Experiments", icon: FlaskConical },
  { to: "/projects/$projectId/research", label: "Research", icon: BookMarked },
  { to: "/projects/$projectId/documents", label: "Documentation", icon: ScrollText },
  { to: "/projects/$projectId/review", label: "Review", icon: GraduationCap },
  { to: "/projects/$projectId/showcase", label: "Showcase & viva", icon: Presentation },
] as const;

function WorkspaceLayout() {
  const { projectId, data, isPending, isError, error, refetch } = useWorkspace();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-5">
          <Button variant="ghost" size="sm" onClick={() => void navigate({ to: "/dashboard" })}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Projects</span>
          </Button>
          <div className="min-w-0">
            <p className="truncate font-display">
              {data?.project.name ?? "Loading project…"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <CreditChip />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <LowCreditsBanner />

      <div className="mx-auto flex max-w-7xl gap-6 px-5 py-6">
        <nav className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                params={{ projectId }}
                activeOptions={{ exact: "exact" in item ? item.exact : false }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted data-[status=active]:bg-primary/10 data-[status=active]:font-medium data-[status=active]:text-primary"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="min-w-0 flex-1">
          {isPending ? (
            <LoadingState label="Loading workspace…" />
          ) : isError ? (
            <ErrorState
              message={error instanceof Error ? error.message : "Something went wrong."}
              onRetry={() => void refetch()}
            />
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
}
