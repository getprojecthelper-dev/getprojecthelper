import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";

import { MentorDock } from "@/components/mentor-dock";
import { ErrorState, LoadingState } from "@/components/state-views";
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

function WorkspaceLayout() {
  const { projectId, data, isPending, isError, error, refetch } = useWorkspace();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Viva (review), Documentation and AI Mentor have their own page headers, so
  // the shared project breadcrumb bar is removed there.
  const isMentor = /\/mentor(\/[^/]+)*$/.test(pathname);
  const isBuild = pathname.endsWith("/build");
  const isOverview = /^\/projects\/[^/]+\/?$/.test(pathname);
  const showHeader = !/(\/review|\/documents|\/mentor)(\/[^/]+)*$/.test(pathname);

  return (
    <div
      className={cn("h-full", isMentor && "flex flex-col", isOverview && "project-overview-layout")}
    >
      {showHeader ? (
        <header
          className={cn(
            "sticky top-16 z-20 border-b border-border bg-background/95 backdrop-blur",
            isBuild && "project-workspace-header",
            isOverview && "project-workspace-overview-header",
          )}
        >
          <div
            className={cn(
              "mx-auto flex h-16 max-w-7xl items-center gap-3 px-5",
              isBuild && "project-workspace-header__inner",
              isOverview && "project-workspace-overview-header__inner",
            )}
          >
            <div className="min-w-0">
              {isBuild ? (
                <p className="project-workspace-header__eyebrow">Implementation workspace</p>
              ) : null}
              <p
                className={cn(
                  "truncate font-display",
                  isBuild && "project-workspace-header__title",
                )}
              >
                {data?.project.name ?? "Loading project…"}
              </p>
            </div>
          </div>
        </header>
      ) : null}

      <div
        className={cn(
          "w-full",
          !isMentor && "mx-auto max-w-none px-5 py-6",
          isBuild && "project-workspace-build-content",
          isOverview && "project-workspace-overview-content",
        )}
      >
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
