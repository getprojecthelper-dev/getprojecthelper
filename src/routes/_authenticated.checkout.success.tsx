import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { getPaddleEnvironment } from "@/lib/paddle";
import { getPremadeProject } from "@/lib/premade-projects";
import { getProjectPurchase } from "@/lib/premade.functions";

export const Route = createFileRoute("/_authenticated/checkout/success")({
  validateSearch: (search: Record<string, unknown>) => ({ project: typeof search.project === "string" ? search.project : "" }),
  head: () => ({ meta: [
    { title: "Purchase complete — Project Helper" },
    { name: "description", content: "Your purchased project is being prepared." },
    { property: "og:title", content: "Purchase complete — Project Helper" },
    { property: "og:description", content: "Your purchased project is being prepared." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: CheckoutSuccess,
});

function CheckoutSuccess() {
  const { project } = Route.useSearch();
  const entry = getPremadeProject(project);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["project-purchase", project, getPaddleEnvironment()],
    queryFn: () => getProjectPurchase({ data: { id: project, environment: getPaddleEnvironment() } }),
    enabled: Boolean(entry),
    refetchInterval: (query) => query.state.data?.owned ? false : 1500,
  });
  useEffect(() => {
    if (!data?.projectId) return;
    void queryClient.invalidateQueries();
    void navigate({ to: "/projects/$projectId", params: { projectId: data.projectId }, replace: true });
  }, [data?.projectId, navigate, queryClient]);
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-xl items-center px-4 py-12 text-center">
      <div className="panel w-full p-8">
        {data?.owned ? <CheckCircle2 className="mx-auto h-10 w-10 text-success" /> : <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />}
        <h1 className="mt-4 font-display text-2xl">{data?.owned ? "Project ready" : "Preparing your project"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{data?.owned ? "Opening your new workspace…" : "Payment is confirmed first, then your project is created automatically. This usually takes a few seconds."}</p>
        <Button asChild variant="outline" className="mt-6"><Link to="/welcome">Return to workspace</Link></Button>
      </div>
    </main>
  );
}