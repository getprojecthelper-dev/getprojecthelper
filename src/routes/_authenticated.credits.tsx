import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Gift, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/state-views";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CREDIT_PACKS, STARTER_CREDITS, formatCredits } from "@/lib/credit-costs";
import { getMyCredits, redeemCode } from "@/lib/credits.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/credits")({
  head: () => ({
    meta: [
      { title: "AI credits — Project Helper" },
      {
        name: "description",
        content: "Track your AI credit balance, usage history and redeem referral codes in Project Helper.",
      },
      { property: "og:title", content: "AI credits — Project Helper" },
      { property: "og:description", content: "Your balance, usage history and credit packs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreditsPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-md p-10">
      <ErrorState message={error.message} />
    </div>
  ),
  notFoundComponent: () => <EmptyState title="Nothing here" description="This page does not exist." />,
});

const KIND_LABEL: Record<string, string> = {
  grant: "Starter credits",
  redeem: "Code redeemed",
  purchase: "Credit pack",
  hold: "Reserved",
  spend: "AI run",
  refund: "Returned",
  adjust: "Adjustment",
};

function CreditsPage() {
  const fetchCredits = useServerFn(getMyCredits);
  const redeem = useServerFn(redeemCode);
  const qc = useQueryClient();
  const [code, setCode] = useState("");

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["credits"],
    queryFn: () => fetchCredits(),
  });

  const redeemMutation = useMutation({
    mutationFn: (value: string) => redeem({ data: { code: value } }),
    onSuccess: (result) => {
      setCode("");
      void qc.invalidateQueries({ queryKey: ["credits"] });
      toast.success(`${formatCredits(result.credits)} credits added to your balance.`);
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "That code could not be redeemed."),
  });

  if (isPending) return <LoadingState label="Loading your credits…" />;
  if (isError)
    return (
      <div className="mx-auto max-w-md p-10">
        <ErrorState
          message={error instanceof Error ? error.message : "Could not load your credits."}
          onRetry={() => void refetch()}
        />
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-5 sm:p-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
      </Button>

      <PageHeader
        title="AI credits"
        description="Credits pay for every AI run — planning, writing sections, and fixing errors. Unused reserved credits always come back to you."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Balance</p>
          <p className="mt-2 flex items-center gap-2 font-display text-3xl font-semibold">
            <Zap className="h-6 w-6 text-primary" />
            {formatCredits(data.balance)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total received</p>
          <p className="mt-2 font-display text-3xl font-semibold">
            {formatCredits(data.lifetimeGranted)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total used</p>
          <p className="mt-2 font-display text-3xl font-semibold">
            {formatCredits(data.lifetimeSpent)}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Gift className="h-4 w-4 text-primary" />
          Redeem a code
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Got a referral or campus code? Enter it to top up your balance.
        </p>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim()) redeemMutation.mutate(code.trim());
          }}
        >
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="STUDENT50"
            className="font-mono uppercase sm:max-w-xs"
            maxLength={40}
          />
          <Button type="submit" disabled={!code.trim() || redeemMutation.isPending}>
            {redeemMutation.isPending ? "Checking…" : "Redeem"}
          </Button>
        </form>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Credit packs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every new account starts with {STARTER_CREDITS} free credits. Packs are coming soon —
          checkout is not enabled yet.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={cn(
                "relative rounded-xl border border-border bg-card p-5",
                "popular" in pack && pack.popular && "border-primary shadow-sm",
              )}
            >
              {"popular" in pack && pack.popular ? (
                <span className="absolute -top-2.5 left-5 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                  Most popular
                </span>
              ) : null}
              <p className="font-display text-base font-semibold">{pack.name}</p>
              <p className="mt-2 font-display text-2xl font-semibold">${pack.priceUsd}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {pack.credits} credits
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{pack.blurb}</p>
              <Button className="mt-4 w-full" variant="outline" disabled>
                Coming soon
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Recent activity</h2>
        {data.transactions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No credit activity yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
            {data.transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {KIND_LABEL[tx.kind] ?? tx.kind}
                    {tx.feature ? (
                      <span className="text-muted-foreground"> · {tx.feature.replace(/_/g, " ")}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleString()}
                    {tx.status && tx.status !== "settled" ? ` · ${tx.status}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-mono tabular-nums",
                    tx.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                  )}
                >
                  {tx.delta >= 0 ? "+" : "−"}
                  {formatCredits(Math.abs(tx.delta))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5" />
        Reserved credits that an AI run does not use are returned automatically.
      </p>
    </div>
  );
}
