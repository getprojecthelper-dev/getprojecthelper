import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCredits } from "@/lib/credit-costs";
import { getMyCredits, type CreditTransaction } from "@/lib/credits.functions";
import { LOW_CREDIT_THRESHOLD } from "@/components/low-credits-banner";
import { cn } from "@/lib/utils";

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span className="opacity-70">{label}</span>
      <span className={cn("font-mono tabular-nums", strong && "font-semibold")}>{value}</span>
    </div>
  );
}

/** Compact AI credit read-out: credits left and credits used so far. */
export function CreditChip() {
  const fetchCredits = useServerFn(getMyCredits);
  const { data } = useQuery({
    queryKey: ["credits"],
    queryFn: () => fetchCredits(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const left = data ? formatCredits(data.balance) : "—";
  const low = !!data && data.balance <= LOW_CREDIT_THRESHOLD;
  const used = data ? formatCredits(data.lifetimeSpent) : "—";

  const txs: CreditTransaction[] = data?.transactions ?? [];
  // Anything not settled is still reserved against the balance.
  const pendingHolds = txs.filter((t) => t.status && t.status !== "settled");
  const pendingAmount = pendingHolds.reduce((sum, t) => sum + Math.abs(t.delta), 0);
  const lastTopUp = txs.find((t) => t.delta > 0);

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 gap-2 px-2.5",
              low && "bg-destructive/10 text-destructive hover:bg-destructive/15",
            )}
          >
            <Link to="/credits">
              <Zap className={cn("h-4 w-4", low ? "text-destructive" : "text-primary")} />
              <span className="flex items-baseline gap-1 font-mono text-xs tabular-nums">
                <span className={cn("font-semibold", low ? "text-destructive" : "text-foreground")}>
                  {left}
                </span>
                <span className="text-muted-foreground">left</span>
                <span className="text-border">·</span>
                <span className="font-semibold text-foreground">{used}</span>
                <span className="hidden text-muted-foreground sm:inline">used</span>
              </span>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="w-60 px-3 py-2.5 text-xs">
          <p className="mb-2 font-semibold tracking-wide uppercase opacity-70">AI credits</p>
          <div className="space-y-1">
            <Row label="Total earned" value={data ? formatCredits(data.lifetimeGranted) : "—"} />
            <Row label="Total used" value={used} />
            {pendingHolds.length > 0 ? (
              <Row
                label={`Reserved (${pendingHolds.length} running)`}
                value={formatCredits(pendingAmount)}
              />
            ) : null}
            <div className="my-1.5 h-px bg-current opacity-20" />
            <Row label="Available now" value={left} strong />
          </div>
          {lastTopUp ? (
            <p className="mt-2 opacity-70">
              Last top-up: +{formatCredits(lastTopUp.delta)} ·{" "}
              {new Date(lastTopUp.created_at).toLocaleDateString()}
            </p>
          ) : null}
          <p className="mt-2 opacity-70">Click to open credits & redeem a code.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
