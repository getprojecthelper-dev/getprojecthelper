import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCredits } from "@/lib/credit-costs";
import { getMyCredits } from "@/lib/credits.functions";

/** Compact AI credit balance that links to the credits page. */
export function CreditChip() {
  const fetchCredits = useServerFn(getMyCredits);
  const { data } = useQuery({
    queryKey: ["credits"],
    queryFn: () => fetchCredits(),
    staleTime: 30_000,
  });

  return (
    <Button asChild variant="ghost" size="sm" title="AI credits">
      <Link to="/credits">
        <Zap className="h-4 w-4 text-primary" />
        <span className="font-mono tabular-nums">
          {data ? formatCredits(data.balance) : "—"}
        </span>
      </Link>
    </Button>
  );
}
