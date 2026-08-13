import {
  createFileRoute,
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
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { projectId, data, isPending, isError, error, refetch } = useWorkspace();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Viva (review), Documentation and AI Mentor have their own page headers, so
  // the shared project breadcrumb bar is removed there.
  const isMentor = /\/mentor(\/[^/]+)*$/.test(pathname);
  const showHeader = !/(\/review|\/documents|\/mentor)(\/[^/]+)*$/.test(pathname);

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
