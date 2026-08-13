import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";

import { MentorChat } from "@/components/mentor-chat";

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
  validateSearch: (search: Record<string, unknown>) => ({
    fresh: search['fresh'] === true || search['fresh'] === "1" || search['fresh'] === "true",
  }),
  component: MentorPage,
});

function MentorPage() {
  const { projectId } = useParams({ from: "/_authenticated/projects/$projectId/mentor" });
  const { fresh } = useSearch({ from: "/_authenticated/projects/$projectId/mentor" });

  return (
    <section className="flex h-[calc(100vh-14rem)] min-h-[32rem] flex-col">
      <header className="mb-4 shrink-0">
        <h1 className="font-display text-2xl">AI Mentor</h1>
        <p className="text-sm text-muted-foreground">
          {fresh
            ? "New session — nothing saved is shown. Import other projects to ask about them."
            : "Grounded in this project's plan, requirements, tests and results."}
        </p>
      </header>
      <MentorChat projectId={projectId} fresh={fresh} />
    </section>
  );
}
