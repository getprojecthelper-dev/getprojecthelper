import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/projects/$projectId/review")({
  head: () => ({
    meta: [
      { title: "Viva — Project Helper" },
      { name: "description", content: "Viva preparation workspace for your project." },
      { property: "og:title", content: "Viva — Project Helper" },
      { property: "og:description", content: "Viva preparation workspace for your project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-xl font-semibold">Viva</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        This section is empty. We&apos;re rebuilding it from scratch.
      </p>
    </div>
  );
}
