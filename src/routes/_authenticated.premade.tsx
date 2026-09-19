import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { CREDIT_PACKS, formatCredits } from "@/lib/credit-costs";
import { DOMAINS } from "@/lib/project-domain";
import { PREMADE_PROJECTS, type PremadeProject } from "@/lib/premade-projects";
import { purchasePremadeProject } from "@/lib/premade.functions";

export const Route = createFileRoute("/_authenticated/premade")({
  head: () => ({
    meta: [
      { title: "Premade Projects — Project Helper" },
      { name: "description", content: "Unlock ready-made project briefs with AI credits." },
      { property: "og:title", content: "Premade Projects — Project Helper" },
      { property: "og:description", content: "Unlock ready-made project briefs with AI credits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PremadePage,
});

const CREDIT_USD = 0.9;

function PremadeCard({ entry }: { entry: PremadeProject }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const purchase = useServerFn(purchasePremadeProject);
  const [busy, setBusy] = useState(false);

  const domainLabel = DOMAINS.find((d) => d.value === entry.domain)?.label ?? entry.domain;
  const usd = (entry.priceCredits * CREDIT_USD).toFixed(2);

  const buy = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await purchase({ data: { id: entry.id } });
      if (!result.ok) {
        toast.error(result.message, {
          action: { label: "Top up", onClick: () => void navigate({ to: "/credits" }) },
        });
        return;
      }
      toast.success(`"${entry.title}" is now in your workspace.`);
      void queryClient.invalidateQueries();
      void navigate({ to: "/projects/$projectId", params: { projectId: result.projectId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The purchase didn't go through.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel flex flex-col gap-3 p-6">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">
          {domainLabel}
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">
          {entry.level}
        </span>
      </div>
      <h2 className="font-display text-xl">{entry.title}</h2>
      <p className="text-sm text-muted-foreground">{entry.summary}</p>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Stack:</span> {entry.stack}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
        <div>
          <p className="flex items-center gap-1 text-lg font-semibold">
            <Zap className="h-4 w-4 text-primary" />
            {formatCredits(entry.priceCredits)} credits
          </p>
          <p className="text-xs text-muted-foreground">≈ ${usd} one-time</p>
        </div>
        <Button onClick={() => void buy()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Unlocking…" : "Unlock project"}
        </Button>
      </div>
    </div>
  );
}

function PremadePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <PageHeader
        title="Premade projects"
        description="Ready-made, tutor-friendly project briefs. Pay once with AI credits and the project appears in your workspace, ready to build, document and present."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PREMADE_PROJECTS.map((entry) => (
          <PremadeCard key={entry.id} entry={entry} />
        ))}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Prices in AI credits (1 credit ≈ $0.90). Unlocking only creates the project — building it
        uses credits like any other project. Packs from {CREDIT_PACKS[0]?.credits ?? 0} credits are
        available on the Credits page.
      </p>
    </div>
  );
}
