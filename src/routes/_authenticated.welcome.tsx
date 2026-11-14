import { Link, createFileRoute } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { ArrowRight, Compass, LockKeyhole, Plus, WalletCards, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/material-icon";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { usePremadeAvailability } from "@/hooks/use-site-availability";
import { useProjectsOverview } from "@/lib/db";
import { canOpenPremade } from "@/lib/site-availability";
import { WorkspacePlanStatus } from "@/components/workspace-plan-status";

function BuyProjectsCard() {
  const availability = usePremadeAvailability();
  const { isAdmin } = useIsAdmin();
  const open = canOpenPremade(availability.data === true, isAdmin);

  if (open) {
    return (
      <Link
        to="/premade"
        className="group relative flex min-h-48 flex-col gap-3 overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.045] p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg sm:p-6"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
            <MaterialIcon name="shopping_bag" filled />
          </span>
          <span className="rounded-full border border-border bg-background/80 px-2.5 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
            One-time purchase
          </span>
        </div>
        <h2 className="font-display text-xl sm:text-2xl">Buy projects</h2>
        <p className="text-sm text-muted-foreground">
          Choose a guided project, review its details, and make it your own.
        </p>
        <span className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-primary">
          Browse projects{" "}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    );
  }

  return (
    <div className="panel flex min-h-48 flex-col gap-3 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <LockKeyhole className="h-5 w-5" />
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
          Launching soon
        </span>
      </div>
      <h2 className="font-display text-xl sm:text-2xl">Buy projects</h2>
      <p className="text-sm text-muted-foreground">
        Guided projects aren't open yet. Build your own project from an idea in the meantime.
      </p>
      <span className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        Launching soon
      </span>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome — Project Helper" },
      { name: "description", content: "Choose what to do next in Project Helper." },
      { property: "og:title", content: "Welcome — Project Helper" },
      { property: "og:description", content: "Choose what to do next in Project Helper." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WelcomePage,
});

function ProjectPicker({ target }: { target: "documents" | "review" | "mentor" }) {
  const { data: overviews, isLoading } = useProjectsOverview();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading your projects…</p>;
  }
  if (!overviews?.length) {
    return (
      <div className="workspace-home__tool-empty">
        <span>Available once you have a project</span>
        <Link to="/new-project" className="workspace-home__tool-link">
          Start one <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {overviews.slice(0, 5).map(({ project }) =>
        target === "documents" ? (
          <Link
            key={project.id}
            to="/projects/$projectId/documents"
            params={{ projectId: project.id }}
            className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <span className="truncate">{project.name}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </Link>
        ) : target === "review" ? (
          <Link
            key={project.id}
            to="/projects/$projectId/review"
            params={{ projectId: project.id }}
            className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <span className="truncate">{project.name}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </Link>
        ) : (
          <Link
            key={project.id}
            to="/projects/$projectId/mentor"
            params={{ projectId: project.id }}
            className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <span className="truncate">{project.name}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </Link>
        ),
      )}
    </div>
  );
}

function ResumeProjects() {
  const { data: overviews, isLoading } = useProjectsOverview();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading your projects…</p>;
  }
  if (!overviews?.length) {
    return (
      <div className="workspace-home__empty-projects">
        <div className="workspace-home__empty-copy">
          <span className="workspace-home__empty-mark" aria-hidden="true">
            <Plus />
          </span>
          <div>
            <p className="font-medium text-foreground">Your next project starts with an idea.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your active projects will appear here as you build.
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="workspace-home__empty-action">
          <Link to="/new-project">
            Start a project <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const inProgress = overviews.filter((o) => o.progress < 100);
  const completed = overviews.filter((o) => o.progress >= 100);
  const list = [...inProgress, ...completed].slice(0, 4);

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {list.map((o) => {
        const done = o.progress >= 100;
        return (
          <Link
            key={o.project.id}
            to="/projects/$projectId/build"
            params={{ projectId: o.project.id }}
            className="group block min-w-0 rounded-lg border border-border/80 bg-background px-3 py-2.5 transition-all hover:border-primary/40 hover:bg-primary/[0.035]"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{o.project.name}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  done ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-muted-foreground"
                }`}
              >
                {done ? "Completed" : `${o.progress}%`}
              </span>
            </span>
            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-secondary">
              <span
                className={`block h-full rounded-full ${done ? "bg-emerald-400" : "bg-primary"}`}
                style={{ width: `${Math.max(o.progress, 4)}%` }}
              />
            </span>
            <span className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">
                {done ? "Open and review" : (o.resumeSection?.title ?? "Continue building")}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
      {overviews.length > 4 ? (
        <Button asChild size="sm" variant="ghost" className="sm:col-span-2 lg:col-span-4">
          <Link to="/dashboard">See all {overviews.length} projects</Link>
        </Button>
      ) : null}
    </div>
  );
}

function ProjectTool({
  title,
  description,
  icon,
  target,
}: {
  title: string;
  description: string;
  icon: string;
  target: "documents" | "review" | "mentor";
}) {
  return (
    <div className="workspace-home__tool">
      <div className="workspace-home__tool-heading">
        <span className="workspace-home__tool-icon" aria-hidden="true">
          <MaterialIcon name={icon} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="workspace-home__tool-projects">
        <ProjectPicker target={target} />
      </div>
    </div>
  );
}

function WelcomePage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { session } = useAuth();
  const justPaid =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("plan") === "success";
  const fullName = String(session?.user.user_metadata?.["full_name"] ?? "").trim();
  const firstName = fullName.split(/\s+/)[0] || "there";

  return (
    <div className="workspace-home-surface landing-editorial min-h-[calc(100vh-4rem)] w-full">
      <div className="workspace-home-layout mx-auto grid w-full max-w-none grid-cols-1 gap-5 px-4 py-6 sm:px-6 sm:py-9 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10 xl:px-10">
        <aside className="workspace-home-sidebar" aria-label="Workspace sidebar">
          <p className="workspace-home-sidebar__label">Workspace</p>
          <nav className="workspace-home-sidebar__nav" aria-label="Workspace navigation">
            <Link
              to="/dashboard"
              className={`workspace-home-sidebar__link ${pathname === "/dashboard" ? "is-active" : ""}`}
              aria-current={pathname === "/dashboard" ? "page" : undefined}
            >
              <Compass aria-hidden="true" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/credits"
              className={`workspace-home-sidebar__link ${pathname === "/credits" ? "is-active" : ""}`}
              aria-current={pathname === "/credits" ? "page" : undefined}
            >
              <WalletCards aria-hidden="true" />
              <span>Credits</span>
            </Link>
            <Link
              to="/settings"
              className={`workspace-home-sidebar__link ${pathname === "/settings" ? "is-active" : ""}`}
              aria-current={pathname === "/settings" ? "page" : undefined}
            >
              <Settings2 aria-hidden="true" />
              <span>Settings</span>
            </Link>
          </nav>
        </aside>
        <main className="workspace-home min-w-0">
          <header className="workspace-home__header flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6 sm:pb-8">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <span className="size-2 rounded-full bg-[#18aa4a]" aria-hidden="true" /> Your
                project space
              </p>
              <h1 className="mt-3 max-w-4xl font-display text-[clamp(2.7rem,5.6vw,5.2rem)] font-semibold leading-[.98] tracking-[-.075em]">
                Good to see you, {firstName}.
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                Pick up where you left off, or start something new.
              </p>
            </div>
            <Button
              asChild
              className="h-11 gap-2 rounded-xl bg-[#0866e8] px-5 text-white shadow-none hover:bg-[#0757c7]"
            >
              <Link to="/dashboard">
                View all projects <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </header>
          <WorkspacePlanStatus justPaid={justPaid} />

          <section
            aria-label="Start a project"
            className="workspace-home__start mt-6 grid gap-3 sm:grid-cols-2"
          >
            <Link
              to="/new-project"
              className="workspace-home__primary group relative flex min-h-48 flex-col gap-3 overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.035] p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg sm:p-6"
            >
              <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0866e8] text-white shadow-sm">
                <Plus className="h-5 w-5" />
              </span>
              <h2 className="relative z-10 font-display text-xl sm:text-2xl">
                Turn your idea into a project
              </h2>
              <p className="relative z-10 max-w-md text-sm text-muted-foreground">
                Start with your idea and build it step by step.
              </p>
              <span className="relative z-10 mt-auto flex items-center gap-1.5 text-sm font-semibold text-primary">
                Start building{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
              <span
                aria-hidden="true"
                className="workspace-home__orb absolute -right-12 -top-16 h-52 w-52 rounded-full border border-primary/10"
              />
              <span
                aria-hidden="true"
                className="absolute -right-3 -top-7 h-36 w-36 rounded-full border border-primary/10"
              />
            </Link>

            <BuyProjectsCard />
          </section>

          <section aria-labelledby="resume-title" className="workspace-home__resume mt-8">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Your work
                </p>
                <h2 id="resume-title" className="mt-1 font-display text-xl">
                  Continue a project
                </h2>
              </div>
              <Link
                to="/dashboard"
                className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Project dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="workspace-home__project-panel">
              <ResumeProjects />
            </div>
          </section>

          <section
            aria-labelledby="tools-title"
            className="workspace-home__tools mt-8 border-t border-border pt-6"
          >
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  More ways to move forward
                </p>
                <h2 id="tools-title" className="mt-1 font-display text-xl">
                  Project tools
                </h2>
              </div>
              <span className="hidden text-xs text-muted-foreground sm:block">
                Choose a project to get started
              </span>
            </div>
            <div className="workspace-home__tool-grid">
              <ProjectTool
                title="Documentation"
                description="Reports, research and project writing"
                icon="description"
                target="documents"
              />
              <ProjectTool
                title="Viva practice"
                description="Prepare questions and confident answers"
                icon="record_voice_over"
                target="review"
              />
              <ProjectTool
                title="Project support"
                description="Get guidance when you need a hand"
                icon="support_agent"
                target="mentor"
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
