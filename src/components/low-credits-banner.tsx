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
    <div role="status" data-empty={empty} className="workspace-credit-notice">
      <div className="workspace-credit-notice__inner">
        <AlertTriangle className="workspace-credit-notice__icon" aria-hidden="true" />
        <span className="workspace-credit-notice__title">
          {empty
            ? "You're out of AI credits."
            : `Only ${formatCredits(data.balance)} AI credits left.`}
        </span>
        <span className="workspace-credit-notice__detail">
          {empty
            ? "Redeem a code or grab a pack to keep generating."
            : `Top up from ${formatMoney(cheapest.priceUsd, "USD")} for ${cheapest.credits} credits.`}
        </span>
        <Link to="/credits" className="workspace-credit-notice__action">
          Add credits
        </Link>
      </div>
    </div>
  );
}
