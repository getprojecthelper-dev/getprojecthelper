import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCredits } from "@/lib/credit-costs";
import { getMyCredits } from "@/lib/credits.functions";

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
  const used = data ? formatCredits(data.lifetimeSpent) : "—";

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="h-9 gap-2 px-2.5"
      title={`AI credits — ${left} left, ${used} used`}
    >
      <Link to="/credits">
        <Zap className="h-4 w-4 text-primary" />
        <span className="flex items-baseline gap-1 font-mono text-xs tabular-nums">
          <span className="font-semibold text-foreground">{left}</span>
          <span className="text-muted-foreground">left</span>
          <span className="text-border">·</span>
          <span className="font-semibold text-foreground">{used}</span>
          <span className="hidden text-muted-foreground sm:inline">used</span>
        </span>
      </Link>
    </Button>
  );
}
