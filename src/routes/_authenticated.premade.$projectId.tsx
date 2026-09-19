import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getPaddleEnvironment, getLocalizedProjectPrice, openProjectCheckout } from "@/lib/paddle";
import { getPremadeProject } from "@/lib/premade-projects";
import { getProjectPurchase } from "@/lib/premade.functions";
import { DOMAINS, getTemplate } from "@/lib/project-domain";

export const Route = createFileRoute("/_authenticated/premade/$projectId")({
  head: () => ({ meta: [
    { title: "Project details — Project Helper" },
    { name: "description", content: "Review this guided project before purchasing." },
    { property: "og:title", content: "Project details — Project Helper" },
    { property: "og:description", content: "Review this guided project before purchasing." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: ProjectDetails,
});

function ProjectDetails() {
  const { projectId } = Route.useParams();
  const entry = getPremadeProject(projectId);
  if (!entry) throw notFound();
  const { user } = useAuth();
  const navigate = useNavigate();
  const environment = getPaddleEnvironment();
  const [busy, setBusy] = useState(false);
  const { data: purchase } = useQuery({
    queryKey: ["project-purchase", projectId, environment],
    queryFn: () => getProjectPurchase({ data: { id: projectId, environment } }),
  });
  const { data: price } = useQuery({
    queryKey: ["premade-localized-price", entry.priceId, environment],
    queryFn: () => getLocalizedProjectPrice(entry.priceId),
  });
  const template = getTemplate(entry.domain);
  const domainLabel = DOMAINS.find((domain) => domain.value === entry.domain)?.label ?? entry.domain;

  const buy = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await openProjectCheckout({
        priceId: entry.priceId,
        catalogProjectId: entry.id,
        userId: user.id,
        ...(user.email ? { customerEmail: user.email } : {}),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout could not be opened.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      <Button asChild variant="ghost" size="sm"><Link to="/premade"><ArrowLeft />Back to projects</Link></Button>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase text-muted-foreground"><span>{domainLabel}</span><span>·</span><span>{entry.level}</span></div>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">{entry.title}</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{entry.brief}</p>
          <section className="mt-8 border-t border-border pt-6">
            <h2 className="font-display text-xl">What you will complete</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {template.workflow.map((item) => <div key={item} className="flex items-center gap-2 text-sm"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10"><Check className="h-3.5 w-3.5 text-primary" /></span>{item}</div>)}
            </div>
          </section>
          <section className="mt-8 border-t border-border pt-6"><h2 className="font-display text-xl">Tools you will use</h2><p className="mt-2 text-sm text-muted-foreground">{entry.stack}</p></section>
        </div>
        <aside className="panel h-fit p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 text-xs font-semibold text-success"><Sparkles className="h-4 w-4" />50% launch discount</div>
          <p className="mt-4 text-sm text-muted-foreground line-through">Regular price: 2× local sale price</p>
          <p className="mt-1 text-3xl font-semibold">{price ?? "Local price at checkout"}</p>
          <p className="mt-1 text-xs text-muted-foreground">One-time purchase</p>
          {purchase?.owned && purchase.projectId ? (
            <Button className="mt-5 w-full" onClick={() => void navigate({ to: "/projects/$projectId", params: { projectId: purchase.projectId ?? "" } })}>Open your project</Button>
          ) : (
            <Button className="mt-5 w-full" onClick={() => void buy()} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : null}{busy ? "Opening checkout…" : "Buy project"}</Button>
          )}
          <div className="mt-4 flex gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span>Your project is created only after payment is confirmed.</span></div>
        </aside>
      </div>
    </main>
  );
}