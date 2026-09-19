import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DOMAINS } from "@/lib/project-domain";
import { PREMADE_PROJECTS, type PremadeProject } from "@/lib/premade-projects";
import { listCatalogPricing, listProjectPurchases, type CatalogPricing } from "@/lib/premade.functions";
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

function useLocalizedPrices() {
  return useQuery({
    queryKey: ["premade-pricing", getPaddleEnvironment()],
    queryFn: async () => {
      const environment = getPaddleEnvironment();
      const pricing = await listCatalogPricing({ data: { environment } });
      const rows = await Promise.all(
        PREMADE_PROJECTS.map(async (entry) => {
          const config = pricing.find((row) => row.catalogProjectId === entry.id);
          const localized = await getLocalizedProjectPricing(entry.priceId, config?.discountPercent ?? 0);
          return [entry.id, { localized, config }] as const;
        }),
      );
      return Object.fromEntries(rows) as Record<string, { localized: { salePrice: string | null; regularPrice: string | null }; config: CatalogPricing | undefined }>;
    },
    staleTime: 30 * 60 * 1000,
  });
}

function PremadeCard({ entry, pricing, projectId }: { entry: PremadeProject; pricing: { localized: { salePrice: string | null; regularPrice: string | null }; config: CatalogPricing | undefined } | undefined; projectId: string | null | undefined }) {
  const domainLabel = DOMAINS.find((domain) => domain.value === entry.domain)?.label ?? entry.domain;
  return (
    <article className="panel flex min-w-0 flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">{domainLabel}</span>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">{entry.level}</span>
        {projectId ? <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-success"><CheckCircle2 className="h-3 w-3" /> Owned</span> : null}
      </div>
      <div>
        <h2 className="font-display text-xl">{entry.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.summary}</p>
      </div>
      <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Tools:</span> {entry.stack}</p>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
        <div>
          {pricing?.config && pricing.config.discountPercent > 0 ? <p className="text-xs text-muted-foreground line-through">Regular {pricing.localized.regularPrice ?? `₹${(pricing.config.regularPriceMinor / 100).toLocaleString("en-IN")}`}</p> : null}
          <p className="text-xl font-semibold">{pricing?.localized.salePrice ?? "Local price at checkout"}</p>
          {pricing?.config && pricing.config.discountPercent > 0 ? <p className="text-xs text-success">{pricing.config.discountPercent}% discount</p> : null}
        </div>
        <Button asChild>
          <Link to={projectId ? "/projects/$projectId" : "/premade/$projectId"} params={{ projectId: projectId ?? entry.id }}>
            {projectId ? "Open project" : "Explore"}<ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

function PremadePage() {
  const environment = getPaddleEnvironment();
  const { data: prices } = useLocalizedPrices();
  const { data: purchases = [] } = useQuery({
    queryKey: ["project-purchases", environment],
    queryFn: () => listProjectPurchases({ data: { environment } }),
  });
  const owned = new Map(purchases.map((purchase) => [purchase.catalog_project_id, purchase.project_id]));
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
      <PageHeader title="Buy projects" description="Review a complete project brief before buying. Pay once, then build, document, and prepare your viva in your workspace." />
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PREMADE_PROJECTS.map((entry) => <PremadeCard key={entry.id} entry={entry} pricing={prices?.[entry.id]} projectId={owned.get(entry.id)} />)}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">Prices are shown in your local currency where available. Building with AI after purchase uses your normal AI credits.</p>
    </main>
  );
}