import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { MaterialIcon } from "@/components/material-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCredits } from "@/lib/credit-costs";
import { getMyCredits, type CreditTransaction } from "@/lib/credits.functions";
import { LOW_CREDIT_THRESHOLD } from "@/components/low-credits-banner";
import { cn } from "@/lib/utils";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="workspace-credits-tooltip__row">
      <span>{label}</span>
      <span className={cn("tabular-nums", strong && "font-semibold")}>{value}</span>
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "workspace-topbar__credits-pill h-10 gap-2 px-3",
            low && "bg-destructive/10 text-destructive hover:bg-destructive/15",
          )}
        >
          <MaterialIcon
            name="bolt"
            className={cn("text-[20px]", low ? "text-destructive" : "text-primary")}
          />
          <span
            className="workspace-topbar__credits-readout flex items-baseline gap-2 font-sans text-xs"
            aria-label={`${left} credits left, ${used} used`}
          >
            <span className="workspace-topbar__credits-balance flex items-baseline gap-1">
              <span className={cn("font-semibold", low ? "text-destructive" : "text-foreground")}>
                {left}
              </span>
              <span className="text-muted-foreground">left</span>
            </span>
            <span className="workspace-topbar__credits-divider" aria-hidden="true" />
            <span className="workspace-topbar__credits-used flex items-baseline gap-1">
              <span className="font-medium text-foreground">{used}</span>
              <span className="text-muted-foreground">used</span>
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="end"
        className="workspace-credits-tooltip w-64 p-0 text-foreground"
      >
        <div className="workspace-credits-tooltip__header">
          <span className="workspace-credits-tooltip__icon" aria-hidden="true">
            <MaterialIcon name="bolt" className="text-[19px]" />
          </span>
          <div>
            <p className="font-semibold">AI credits</p>
            <p className="text-xs text-muted-foreground">Your available AI usage</p>
          </div>
        </div>
        <div className="workspace-credits-tooltip__balance">
          <span>Available now</span>
          <strong className={cn(low && "text-destructive")}>{left}</strong>
        </div>
        <div className="workspace-credits-tooltip__details">
          <Row label="Total earned" value={data ? formatCredits(data.lifetimeGranted) : "—"} />
          <Row label="Total used" value={used} />
          {pendingHolds.length > 0 ? (
            <Row
              label={`Reserved (${pendingHolds.length} running)`}
              value={formatCredits(pendingAmount)}
            />
          ) : null}
        </div>
        {lastTopUp ? (
          <p className="workspace-credits-tooltip__top-up">
            Last top-up: +{formatCredits(lastTopUp.delta)} ·{" "}
            {new Date(lastTopUp.created_at).toLocaleDateString()}
          </p>
        ) : null}
        <Link to="/credits" className="workspace-credits-tooltip__footer">
          Manage credits and redeem a code{" "}
          <MaterialIcon name="arrow_forward" className="text-[17px]" />
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
