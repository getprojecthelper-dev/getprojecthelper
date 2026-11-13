import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DOMAINS } from "@/lib/project-domain";
import { listLiveListings, type PremadeListing } from "@/lib/premade-listings.functions";
import { listProjectPurchases } from "@/lib/premade.functions";
import { getPaddleEnvironment, getLocalizedProjectPricing } from "@/lib/paddle";

export const Route = createFileRoute("/_authenticated/premade/")({
  head: () => ({
    meta: [
      { title: "Buy Student Projects — Project Helper" },
      { name: "description", content: "Explore guided student projects available as one-time purchases." },
      { property: "og:title", content: "Buy Student Projects — Project Helper" },
      { property: "og:description", content: "Explore guided student projects available as one-time purchases." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PremadePage,
});

function PremadeCard({ entry, projectId }: { entry: PremadeListing; projectId: string | null | undefined }) {
  const domainLabel = DOMAINS.find((domain) => domain.value === entry.domain)?.label ?? entry.domain;
  const { data: price } = useQuery({
    queryKey: ["premade-localized-price", entry.providerPriceId],
    queryFn: () => getLocalizedProjectPricing(entry.providerPriceId ?? "", 0),
    enabled: Boolean(entry.providerPriceId) && entry.isAvailable,
    staleTime: 30 * 60 * 1000,
  });
  return (
    <article className="panel flex min-w-0 flex-col overflow-hidden">
      {entry.imageUrl ? <img src={entry.imageUrl} alt={entry.title} className="aspect-[16/10] w-full object-cover" /> : null}
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">{domainLabel}</span>
          {!entry.isAvailable ? <span className="rounded-full bg-destructive/15 px-2.5 py-1 text-destructive">Not available</span> : null}
          {projectId ? <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-success"><CheckCircle2 className="h-3 w-3" /> Owned</span> : null}
        </div>
        <div>
          <h2 className="font-display text-xl">{entry.title}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{entry.description}</p>
        </div>
        <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Tech stack:</span> {entry.techStack}</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
          <p className="text-xl font-semibold">{price?.salePrice ?? `₹${(entry.priceMinor / 100).toLocaleString("en-IN")}`}</p>
          <Button asChild>
            <Link to={projectId ? "/projects/$projectId" : "/premade/$projectId"} params={{ projectId: projectId ?? entry.id }}>
              {projectId ? "Open project" : "Explore"}<ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function PremadePage() {
  const environment = getPaddleEnvironment();
  const { data: listings = [], isPending } = useQuery({
    queryKey: ["premade-listings", environment],
    queryFn: () => listLiveListings({ data: { environment } }),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: purchases = [] } = useQuery({
    queryKey: ["project-purchases", environment],
    queryFn: () => listProjectPurchases({ data: { environment } }),
  });
  const owned = new Map(purchases.map((purchase) => [purchase.catalog_project_id, purchase.project_id]));
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
      <PageHeader title="Buy projects" description="Review a complete project brief before buying. Pay once, then build, document, and prepare your viva in your workspace." />
      <div className="mt-5 rounded-lg border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">Personal &amp; academic use only.</strong> These guided projects are meant for your own learning, coursework, or portfolio. They may not be resold, repackaged, or used to run a business or commercial service.
      </div>
      {isPending ? <p className="mt-6 text-sm text-muted-foreground">Loading projects…</p> : listings.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No projects are listed yet. Check back soon.</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((entry) => <PremadeCard key={entry.id} entry={entry} projectId={owned.get(entry.id)} />)}
        </div>
      )}
      <p className="mt-8 text-xs text-muted-foreground">Prices are shown in your local currency where available. Building with AI after purchase uses your normal AI credits.</p>
    </main>
  );
}
