import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Coins,
  FileText,
  Hammer,
  History,
  Home,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProjectsOverview } from "@/lib/db";

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

function ProjectPicker({
  target,
}: {
  target: "documents" | "review" | "mentor";
}) {
  const { data: overviews, isLoading } = useProjectsOverview();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading your projects…</p>;
  }
  if (!overviews?.length) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">You need a project first.</p>
        <Button asChild size="sm" variant="outline">
          <Link to="/new-project">Create a project</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {overviews.slice(0, 5).map(({ project }) => (
        target === "documents" ? (
          <Link key={project.id} to="/projects/$projectId/documents" params={{ projectId: project.id }} className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-secondary">
            <span className="truncate">{project.name}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </Link>
        ) : target === "review" ? (
          <Link key={project.id} to="/projects/$projectId/review" params={{ projectId: project.id }} className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-secondary">
            <span className="truncate">{project.name}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </Link>
        ) : (
          <Link key={project.id} to="/projects/$projectId/mentor" params={{ projectId: project.id }} className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-secondary">
            <span className="truncate">{project.name}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </Link>
        )
      ))}
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
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          No projects yet — your work-in-progress will show up here.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/new-project">Start your first project</Link>
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
            className="block min-w-0 rounded-md border border-border bg-background px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-primary/5"
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
            <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-secondary">
              <span
                className={`block h-full rounded-full ${done ? "bg-emerald-400" : "bg-primary"}`}
                style={{ width: `${Math.max(o.progress, 4)}%` }}
              />
            </span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">{done ? "Open and review" : o.resumeSection?.title ?? "Continue building"}</span>
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

type WorkspaceLink = {
  title: string;
  description: string;
  icon: LucideIcon;
  to: "/welcome" | "/dashboard" | "/settings" | "/credits";
};

const WORKSPACE_LINKS: WorkspaceLink[] = [
  { title: "Home", description: "Your starting point", icon: Home, to: "/welcome" },
  { title: "Dashboard", description: "View every project", icon: LayoutDashboard, to: "/dashboard" },
  { title: "Credits", description: "Balance and top-ups", icon: Coins, to: "/credits" },
  { title: "Settings", description: "Profile and preferences", icon: Settings, to: "/settings" },
];

function ProjectTool({
  title,
  description,
  icon: Icon,
  target,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  target: "documents" | "review" | "mentor";
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-3 border-t border-border pt-2"><ProjectPicker target={target} /></div>
    </div>
  );
}

function WelcomePage() {
  const { session } = useAuth();
  const fullName = String(session?.user.user_metadata?.["full_name"] ?? "").trim();
  const firstName = fullName.split(/\s+/)[0] || "there";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Welcome back, {firstName}</p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl">Your workspace</h1>
        </div>
        <Button asChild size="sm" variant="outline"><Link to="/dashboard">All projects <ArrowRight className="h-4 w-4" /></Link></Button>
      </div>

      <section aria-label="Start a project" className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          to="/new-project"
          className="group panel flex min-h-48 flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg sm:p-6"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Hammer className="h-5 w-5" />
          </span>
          <h2 className="font-display text-xl sm:text-2xl">Build a project</h2>
          <p className="text-sm text-muted-foreground">
            Start with your idea and build it step by step.
          </p>
          <span className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-primary">Start building <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>

        <Link
          to="/premade"
          className="group panel flex min-h-48 flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg sm:p-6"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase text-muted-foreground">Paid · credits</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl">Explore premade projects</h2>
          <p className="text-sm text-muted-foreground">Unlock a ready-made project and make it your own.</p>
          <span className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-primary">Browse projects <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>
      </section>

      <section aria-labelledby="resume-title" className="mt-6 panel p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2"><History className="h-4 w-4 text-primary" /><h2 id="resume-title" className="font-display text-lg">Resume a project</h2></div>
        <ResumeProjects />
      </section>

      <section aria-labelledby="tools-title" className="mt-6">
        <h2 id="tools-title" className="font-display text-lg">Project tools</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <ProjectTool title="Documentation" description="Write your project report" icon={FileText} target="documents" />
          <ProjectTool title="Viva" description="Prepare questions and answers" icon={MessagesSquare} target="review" />
          <ProjectTool title="AI Mentor" description="Ask questions about your project" icon={Bot} target="mentor" />
        </div>
      </section>

      <nav aria-label="Workspace navigation" className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {WORKSPACE_LINKS.map((item) => (
          <Link key={item.title} to={item.to} className="flex items-center gap-3 rounded-md border border-border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary"><item.icon className="h-4 w-4" /></span>
            <span className="min-w-0"><span className="block text-sm font-semibold">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.description}</span></span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
