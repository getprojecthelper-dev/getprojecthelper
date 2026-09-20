import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { MentorDock } from "@/components/mentor-dock";
import { ErrorState, LoadingState } from "@/components/state-views";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/use-workspace";


export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project workspace — Project Helper" },
      { name: "description", content: "Manage your private student project workspace." },
      { property: "og:title", content: "Project workspace — Project Helper" },
      { property: "og:description", content: "Manage your private student project workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WorkspaceLayout,
});

/** Pages a student can open for a project, per domain. */
const COMMON_PAGES = [
  { to: "/projects/$projectId", label: "Overview", exact: true },
  { to: "/projects/$projectId/build", label: "Build" },
  { to: "/projects/$projectId/tasks", label: "Tasks" },
  { to: "/projects/$projectId/research", label: "Research" },
  { to: "/projects/$projectId/risks", label: "Risks" },
  { to: "/projects/$projectId/documents", label: "Documentation" },
  { to: "/projects/$projectId/review", label: "Viva" },
  { to: "/projects/$projectId/showcase", label: "Showcase" },
] as const;

const PM_PAGES = [
  { to: "/projects/$projectId/schedule", label: "Schedule" },
  { to: "/projects/$projectId/budget", label: "Budget" },
  { to: "/projects/$projectId/stakeholders", label: "Stakeholders" },
] as const;

const TECH_PAGES = [
  { to: "/projects/$projectId/requirements", label: "Requirements" },
  { to: "/projects/$projectId/testing", label: "Testing" },
  { to: "/projects/$projectId/experiments", label: "Experiments" },
] as const;

function pagesForDomain(domain: string | undefined) {
  const extra = domain === "project_management" ? PM_PAGES : TECH_PAGES;
  // Keep Overview and Build first, then the domain pages, then the shared ones.
  return [...COMMON_PAGES.slice(0, 3), ...extra, ...COMMON_PAGES.slice(3)];
}

function WorkspaceLayout() {
  const { projectId, data, isPending, isError, error, refetch } = useWorkspace();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Viva (review), Documentation and AI Mentor have their own page headers, so
  // the shared project breadcrumb bar is removed there.
  const isMentor = /\/mentor(\/[^/]+)*$/.test(pathname);
  const showHeader = !/(\/review|\/documents|\/mentor)(\/[^/]+)*$/.test(pathname);
  const pages = pagesForDomain(data?.project.domain);

  return (
    <div className={cn("h-full", isMentor && "flex flex-col")}>
      {showHeader ? (
        <header className="sticky top-16 z-20 border-b border-border bg-background/95 backdrop-blur">
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
          </div>
          <nav
            aria-label="Project pages"
            className="mx-auto max-w-7xl overflow-x-auto px-5 pb-2"
          >
            <ul className="flex items-center gap-1 whitespace-nowrap">
              {pages.map((page) => (
                <li key={page.to}>
                  <Link
                    to={page.to}
                    params={{ projectId }}
                    activeOptions={{ exact: "exact" in page ? page.exact : false }}
                    className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    activeProps={{ className: "bg-secondary text-foreground" }}
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
      ) : null}


      <div className={cn("w-full", !isMentor && "mx-auto max-w-none px-5 py-6")}>
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

      {/* The dock is redundant on the mentor page itself. */}
      {isMentor ? null : <MentorDock projectId={projectId} />}
    </div>
  );
}
