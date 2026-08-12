import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarClock, FolderKanban, GraduationCap, LogOut, Plus, Settings } from "lucide-react";

import { MeterBar } from "@/components/metrics";
import { EmptyState, ErrorState, LoadingState } from "@/components/state-views";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProjects } from "@/lib/db";
import { signOutAndRedirect } from "@/lib/sign-out";
import { DOMAINS, STAGE_LABELS, daysUntil, labelOf, type Stage } from "@/lib/project-domain";

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
  const { data: projects, isPending, isError, refetch } = useProjects();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-semibold">
            <GraduationCap className="h-5 w-5 text-primary" />
            Project Helper
          </Link>
          <div className="flex items-center gap-1">
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
              Signed in as {user?.email}. Open a project to see its stage, health and next action.
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
          ) : projects.length === 0 ? (
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
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((p) => {
                const days = daysUntil(p.deadline);
                return (
                  <Link
                    key={p.id}
                    to="/projects/$projectId"
                    params={{ projectId: p.id }}
                    className="panel block p-5 transition-shadow hover:shadow-[var(--shadow-lift)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-display text-lg font-semibold">{p.name}</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {labelOf(DOMAINS, p.domain)}
                        </p>
                      </div>
                      <StatusBadge
                        value="in_progress"
                        label={STAGE_LABELS[p.current_stage as Stage] ?? p.current_stage}
                      />
                    </div>
                    {p.description ? (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        {p.description}
                      </p>
                    ) : null}
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {days === null
                        ? "No deadline set"
                        : days < 0
                          ? `Deadline passed ${Math.abs(days)} day(s) ago`
                          : `${days} day(s) remaining`}
                    </div>
                    <MeterBar className="mt-3" value={0} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
