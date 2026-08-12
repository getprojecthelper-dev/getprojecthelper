import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  CalendarClock,
  FolderKanban,
  GaugeCircle,
  GraduationCap,
  LogOut,
  Play,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { checkIsAdmin } from "@/lib/admin.functions";

import { MeterBar, healthTone, meterTone } from "@/components/metrics";
import { EmptyState, ErrorState, LoadingState } from "@/components/state-views";
import { StatusBadge } from "@/components/status-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useProjectMutations, useProjectsOverview, type ProjectOverview } from "@/lib/db";
import { signOutAndRedirect } from "@/lib/sign-out";
import { DOMAINS, STAGE_LABELS, daysUntil, labelOf, type Stage } from "@/lib/project-domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your projects — Project Helper" },
      { name: "description", content: "All of your Project Helper projects in one place." },
      { property: "og:title", content: "Your projects — Project Helper" },
      { property: "og:description", content: "All of your projects in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: overviews, isPending, isError, refetch } = useProjectsOverview();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { remove } = useProjectMutations();
  const [pendingDelete, setPendingDelete] = useState<ProjectOverview | null>(null);
  const fetchIsAdmin = useServerFn(checkIsAdmin);
  const { data: isAdmin } = useQuery({ queryKey: ["is-admin"], queryFn: () => fetchIsAdmin() });

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-semibold">
            <GraduationCap className="h-5 w-5 text-primary" />
            Project Helper
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {isAdmin?.isAdmin ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="ghost" size="sm">
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void signOutAndRedirect(() => navigate({ to: "/auth", replace: true }))}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Your projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed in as {user?.email}. Resume where you left off, or start something new.
            </p>
          </div>
          <Button asChild>
            <Link to="/new-project">
              <Plus className="h-4 w-4" />
              New project
            </Link>
          </Button>
        </div>

        <div className="mt-8">
          {isPending ? (
            <LoadingState label="Loading your projects…" />
          ) : isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : overviews.length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="h-8 w-8" />}
              title="No projects yet"
              description="Create your first project, pick a domain template, and Project Helper will set up a lifecycle, starter tasks and a report structure for you."
              action={
                <Button asChild>
                  <Link to="/new-project">Start your project</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {overviews.map((o) => (
                <ProjectCard key={o.project.id} overview={o} onDelete={setPendingDelete} />
              ))}
            </div>
          )}
        </div>
      </main>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.project.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the project along with its tasks, requirements, documents and
              generated implementation sections. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep project</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) remove.mutate(pendingDelete.project.id);
                setPendingDelete(null);
              }}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectCard({
  overview,
  onDelete,
}: {
  overview: ProjectOverview;
  onDelete: (o: ProjectOverview) => void;
}) {
  const { project: p, progress, health, buildTotal, buildConfirmed, resumeSection } = overview;
  const days = daysUntil(p.deadline);
  const tone = healthTone(health);

  return (
    <div className="panel flex flex-col p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/projects/$projectId"
            params={{ projectId: p.id }}
            className="font-display text-lg font-semibold hover:text-primary"
          >
            {p.name}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">{labelOf(DOMAINS, p.domain)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <StatusBadge
            value="in_progress"
            label={STAGE_LABELS[p.current_stage as Stage] ?? p.current_stage}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            aria-label={`Delete ${p.name}`}
            onClick={() => onDelete(overview)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {p.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Overall progress" value={`${progress}%`}>
          <MeterBar className="mt-2" value={progress} />
        </Kpi>
        <Kpi
          label="Project health"
          value={`${health}`}
          icon={<Activity className="h-3.5 w-3.5" />}
          tone={tone}
        >
          <MeterBar className="mt-2" value={health} tone={meterTone(health)} />
        </Kpi>
        <Kpi
          label="Current stage"
          value={STAGE_LABELS[p.current_stage as Stage] ?? p.current_stage}
          icon={<GaugeCircle className="h-3.5 w-3.5" />}
        />
        <Kpi
          label="Deadline"
          value={days === null ? "Not set" : days < 0 ? `${Math.abs(days)}d late` : `${days}d left`}
          icon={<CalendarClock className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {buildTotal === 0
            ? "No implementation sections yet"
            : resumeSection
              ? `Left off at step ${resumeSection.position + 1}: ${resumeSection.title}`
              : `All ${buildTotal} implementation sections confirmed`}
          {buildTotal > 0 ? ` · ${buildConfirmed}/${buildTotal} done` : ""}
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/projects/$projectId" params={{ projectId: p.id }}>
              Open
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link
              to={buildTotal > 0 ? "/projects/$projectId/build" : "/projects/$projectId/tasks"}
              params={{ projectId: p.id }}
            >
              <Play className="h-4 w-4" />
              Resume project
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone = "default",
  children,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
  children?: React.ReactNode;
}) {
  const toneClass =
    tone === "good"
      ? "text-success"
      : tone === "warn"
        ? "text-warning"
        : tone === "bad"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        <span className="leading-tight">{label}</span>
      </div>
      <p className={cn("mt-1 truncate font-display text-lg font-semibold", toneClass)}>{value}</p>
      {children}
    </div>
  );
}
