import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { useEffect } from "react";

import { MentorThreadList } from "@/components/mentor-thread-list";
import { useSidebar } from "@/components/ui/sidebar";

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
  const { setOpen } = useSidebar();

  // The mentor gets the full width: collapse the workspace sidebar while here.
  useEffect(() => {
    setOpen(false);
    return () => setOpen(true);
  }, [setOpen]);

  return (
    <section className="flex h-[calc(100vh-10rem)] min-h-[32rem] flex-col md:h-[calc(100vh-11rem)] md:flex-row">
      {/* Desktop conversation history — always visible so users can jump between past chats. */}
      <MentorThreadList
        projectId={projectId}
        className="hidden w-72 shrink-0 rounded-none border-0 border-r border-border/60 bg-transparent p-0 md:flex"
      />
      {/* Mobile conversation history — compact horizontal strip. */}
      <MentorThreadList projectId={projectId} className="mb-4 max-h-48 shrink-0 md:hidden" />
      <div className="flex min-h-0 flex-1">
        <Outlet />
      </div>
    </section>
  );
}
