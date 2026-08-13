import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";

import { MentorThreadList } from "@/components/mentor-thread-list";

export const Route = createFileRoute("/_authenticated/projects/$projectId/mentor")({
  head: () => ({
    meta: [
      { title: "AI Mentor — Project Helper" },
      {
        name: "description",
        content:
          "Talk to a project-aware AI mentor that reads your plan, requirements and test results and challenges weak reasoning.",
      },
      { property: "og:title", content: "AI Mentor — Project Helper" },
      {
        property: "og:description",
        content: "A senior project mentor that answers from your real project data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MentorLayout,
});

function MentorLayout() {
  const { projectId } = useParams({ from: "/_authenticated/projects/$projectId/mentor" });

  return (
    <section className="flex h-[calc(100vh-14rem)] min-h-[32rem] flex-col">
      <header className="mb-4 shrink-0">
        <h1 className="font-display text-2xl">AI Mentor</h1>
        <p className="text-sm text-muted-foreground">
          Every conversation is saved, so you can come back to it later.
        </p>
      </header>
      <MentorThreadList projectId={projectId} className="mb-4 max-h-56 shrink-0 lg:hidden" />
      <div className="flex min-h-0 flex-1">
        <Outlet />
      </div>
    </section>
  );
}
