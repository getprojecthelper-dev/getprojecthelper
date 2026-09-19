import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BookOpen, FileText, Hammer, ShoppingBag } from "lucide-react";

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
  target: "documents" | "research";
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
        <Link
          key={project.id}
          to={target === "documents" ? "/projects/$projectId/documents" : "/projects/$projectId/research"}
          params={{ projectId: project.id }}
          className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="truncate">{project.name}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}

function WelcomePage() {
  const { session } = useAuth();
  const fullName = String(session?.user.user_metadata?.["full_name"] ?? "").trim();
  const firstName = fullName.split(/\s+/)[0] || "there";

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Welcome back, {firstName}
      </p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">What would you like to do?</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Start something new, unlock a ready-made project, or pick up the writing for a project you
        already have.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <Link
          to="/new-project"
          className="group panel flex flex-col gap-3 p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Hammer className="h-5 w-5" />
          </span>
          <h2 className="font-display text-xl">Build a project</h2>
          <p className="text-sm text-muted-foreground">
            Turn your own idea into a guided, step-by-step project with code, docs and viva prep.
          </p>
          <span className="mt-auto flex items-center gap-1.5 pt-2 text-sm font-medium text-primary">
            Start building
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          to="/premade"
          className="group panel flex flex-col gap-3 p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Paid · credits
            </span>
          </div>
          <h2 className="font-display text-xl">Explore premade projects</h2>
          <p className="text-sm text-muted-foreground">
            Unlock a polished project brief for a small credit fee and make it your own.
          </p>
          <span className="mt-auto flex items-center gap-1.5 pt-2 text-sm font-medium text-primary">
            Browse the catalogue
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <div className="panel flex flex-col gap-3 p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground">
            <FileText className="h-5 w-5" />
          </span>
          <h2 className="font-display text-xl">Write documentation</h2>
          <p className="text-sm text-muted-foreground">
            Open a project and write its report section by section with AI help.
          </p>
          <div className="mt-auto pt-2">
            <ProjectPicker target="documents" />
          </div>
        </div>

        <div className="panel flex flex-col gap-3 p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground">
            <BookOpen className="h-5 w-5" />
          </span>
          <h2 className="font-display text-xl">Write a literature review</h2>
          <p className="text-sm text-muted-foreground">
            Find real research papers for a project and turn them into a cited review.
          </p>
          <div className="mt-auto pt-2">
            <ProjectPicker target="research" />
          </div>
        </div>
      </div>
    </div>
  );
}
