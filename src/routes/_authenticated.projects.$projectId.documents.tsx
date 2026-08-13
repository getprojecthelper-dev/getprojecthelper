import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/projects/$projectId/documents")({
  head: () => ({
    meta: [
      { title: "Documentation — Project Helper" },
      { name: "description", content: "Documentation workspace for your project." },
      { property: "og:title", content: "Documentation — Project Helper" },
      { property: "og:description", content: "Documentation workspace for your project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-xl font-semibold">Documentation</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        This section is empty. We&apos;re rebuilding it from scratch.
      </p>
    </div>
  );
}
