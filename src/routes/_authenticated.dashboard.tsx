import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  CalendarClock,
  FolderKanban,
  GaugeCircle,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { MeterBar, healthTone, meterTone } from "@/components/metrics";
import { ErrorState, LoadingState } from "@/components/state-views";
import { StatusBadge } from "@/components/status-badge";
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
  const { remove } = useProjectMutations();
  const [pendingDelete, setPendingDelete] = useState<ProjectOverview | null>(null);
  const activeProjects = overviews?.filter((o) => o.progress < 100).length ?? 0;
  const completedProjects = overviews?.filter((o) => o.progress >= 100).length ?? 0;

  return (
    <>
      <main className="workspace-home-surface landing-editorial workspace-dashboard mx-auto min-h-[calc(100vh-4rem)] w-full max-w-[100rem] px-5 py-8 sm:px-8 lg:px-10">
        <header className="workspace-dashboard__header">
          <div className="min-w-0">
            <p className="workspace-dashboard__eyebrow">Your workspace</p>
            <h1 className="mt-2 font-display text-[clamp(2.25rem,4.2vw,4rem)] font-semibold leading-[1.02] tracking-[-.065em]">
              Projects, at a glance.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Resume where you left off, or choose what to move forward next.
            </p>
            {user?.email ? (
              <p className="mt-2 text-xs text-muted-foreground">Signed in as {user.email}</p>
            ) : null}
          </div>
          <Button asChild className="workspace-dashboard__new-project">
            <Link to="/new-project">
              New project <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </header>

        {!isPending && !isError && overviews.length > 0 ? (
          <div className="workspace-dashboard__summary" aria-label="Project summary">
            <span>
              <strong>{overviews.length}</strong> {overviews.length === 1 ? "project" : "projects"}
            </span>
            <span>
              <strong>{activeProjects}</strong> in progress
            </span>
            <span>
              <strong>{completedProjects}</strong> completed
            </span>
          </div>
        ) : null}

        <section aria-label="Your project list" className="mt-6">
          {isPending ? (
            <LoadingState label="Loading your projects…" />
          ) : isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : overviews.length === 0 ? null : (
            <div className="workspace-dashboard__projects">
              {overviews.map((o) => (
                <ProjectCard key={o.project.id} overview={o} onDelete={setPendingDelete} />
              ))}
            </div>
          )}
        </section>
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
    </>
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
    <article className="workspace-dashboard__project">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/projects/$projectId"
            params={{ projectId: p.id }}
            className="workspace-dashboard__project-title font-display text-xl"
          >
            {p.name}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">{labelOf(DOMAINS, p.domain)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge
            value={progress >= 100 ? "completed" : "in_progress"}
            label={STAGE_LABELS[p.current_stage as Stage] ?? p.current_stage}
            className="workspace-dashboard__status"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-muted-foreground hover:bg-red-50 hover:text-destructive"
            aria-label={`Delete ${p.name}`}
            onClick={() => onDelete(overview)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {p.description ? (
        <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {p.description}
        </p>
      ) : null}

      <div className="workspace-dashboard__metrics">
        <Kpi label="Build progress" value={`${progress}%`}>
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
          tone={days !== null && days < 0 ? "bad" : "default"}
        />
      </div>

      <div className="workspace-dashboard__project-footer">
        <div className="min-w-0">
          <p className="workspace-dashboard__next-label">Next up</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {buildTotal === 0
              ? "Your guided build plan will appear here"
              : resumeSection
                ? `Step ${resumeSection.position + 1} · ${resumeSection.title}`
                : `All ${buildTotal} implementation sections confirmed`}
            {buildTotal > 0 ? ` · ${buildConfirmed}/${buildTotal} done` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild size="sm">
            <Link
              to={buildTotal > 0 ? "/projects/$projectId/build" : "/projects/$projectId/tasks"}
              params={{ projectId: p.id }}
            >
              {buildTotal > 0 ? "Resume" : "View tasks"} <Play className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
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
    <div className="workspace-dashboard__metric">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        <span className="leading-tight">{label}</span>
      </div>
      <p className={cn("mt-1 truncate font-display text-base font-semibold", toneClass)}>{value}</p>
      {children}
    </div>
  );
}
