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
    <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-card/40">
      <MentorChat key={threadId} projectId={projectId} threadId={threadId} className="p-3" />
    </div>
  );
}
