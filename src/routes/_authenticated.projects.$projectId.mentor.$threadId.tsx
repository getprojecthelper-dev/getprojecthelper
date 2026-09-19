import { createFileRoute, useParams } from "@tanstack/react-router";

import { MentorChat } from "@/components/mentor-chat";

export const Route = createFileRoute("/_authenticated/projects/$projectId/mentor/$threadId")({
  head: () => ({
    meta: [
      { title: "Mentor conversation — Project Helper" },
      { name: "description", content: "A private conversation with your project-aware AI mentor." },
      { property: "og:title", content: "Mentor conversation — Project Helper" },
      { property: "og:description", content: "A private conversation with your project-aware AI mentor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MentorThreadPage,
});

function MentorThreadPage() {
  const { projectId, threadId } = useParams({
    from: "/_authenticated/projects/$projectId/mentor/$threadId",
  });

  return (
    <MentorChat key={threadId} projectId={projectId} threadId={threadId} className="h-full" />
  );
}
