import { createFileRoute, redirect } from "@tanstack/react-router";

import { createMentorThread, listMentorThreads } from "@/lib/mentor.functions";

export const Route = createFileRoute("/_authenticated/projects/$projectId/mentor/")({
  // Opening the mentor always lands on a real conversation URL: the newest
  // saved one, or a brand new chat when there is none yet.
  loader: async ({ params }) => {
    const threads = await listMentorThreads({ data: { projectId: params.projectId } });
    const threadId =
      threads[0]?.id ??
      (await createMentorThread({ data: { projectId: params.projectId } })).id;
    throw redirect({
      to: "/projects/$projectId/mentor/$threadId",
      params: { projectId: params.projectId, threadId },
    });
  },
  component: () => null,
});
