import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle } from "lucide-react";

import { formatCredits } from "@/lib/credit-costs";
import { getMyCredits } from "@/lib/credits.functions";
import { cheapestPack, formatMoney } from "@/lib/pricing";

/** Credits at or below this are considered "running low". */
export const LOW_CREDIT_THRESHOLD = 15;

/** Slim strip under the navbar warning when the AI credit balance runs low. */
export function LowCreditsBanner() {
  const fetchCredits = useServerFn(getMyCredits);
  const { data } = useQuery({
    queryKey: ["credits"],
    queryFn: () => fetchCredits(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  if (!data || data.balance > LOW_CREDIT_THRESHOLD) return null;

  const empty = data.balance <= 0;
  const cheapest = cheapestPack();

  return (
    <div
      role="status"
      className={
        empty
          ? "border-b border-destructive/30 bg-destructive/10"
          : "border-b border-primary/30 bg-primary/10"
      }
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-1 px-5 py-2 text-sm">
        <AlertTriangle
          className={empty ? "h-4 w-4 text-destructive" : "h-4 w-4 text-primary"}
        />
        <span className="font-medium">
          {empty ? "You're out of AI credits." : `Only ${formatCredits(data.balance)} AI credits left.`}
        </span>
        <span className="text-muted-foreground">
          {empty
            ? "Redeem a code or grab a pack to keep generating."
            : `Top up from ${formatMoney(cheapest.priceUsd, "USD")} for ${cheapest.credits} credits.`}
        </span>
        <Link
          to="/credits"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Add credits
        </Link>
      </div>
    </div>
  );
}
