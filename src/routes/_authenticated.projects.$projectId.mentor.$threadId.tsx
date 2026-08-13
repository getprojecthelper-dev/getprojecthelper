import { createFileRoute, useParams } from "@tanstack/react-router";

import { MentorChat } from "@/components/mentor-chat";

export const Route = createFileRoute("/_authenticated/projects/$projectId/mentor/$threadId")({
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
