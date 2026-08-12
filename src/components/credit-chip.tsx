import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCredits } from "@/lib/credit-costs";
import { getMyCredits } from "@/lib/credits.functions";
import { LOW_CREDIT_THRESHOLD } from "@/components/low-credits-banner";
import { cn } from "@/lib/utils";

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

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={cn("h-9 gap-2 px-2.5", low && "bg-destructive/10 text-destructive hover:bg-destructive/15")}
      title={`AI credits — ${left} left, ${used} used`}
    >
      <Link to="/credits">
        <Zap className={cn("h-4 w-4", low ? "text-destructive" : "text-primary")} />
        <span className="flex items-baseline gap-1 font-mono text-xs tabular-nums">
          <span className={cn("font-semibold", low ? "text-destructive" : "text-foreground")}>{left}</span>
          <span className="text-muted-foreground">left</span>
          <span className="text-border">·</span>
          <span className="font-semibold text-foreground">{used}</span>
          <span className="hidden text-muted-foreground sm:inline">used</span>
        </span>
      </Link>
    </Button>
  );
}
