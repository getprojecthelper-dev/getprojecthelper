import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { getPaddleEnvironment } from "@/lib/paddle";
import { getPlan } from "@/lib/plans";
import { getMyPlan } from "@/lib/plans.functions";

/** Shows the user's current plan in the workspace; polls briefly after checkout until the payment lands. */
export function WorkspacePlanStatus({ justPaid }: { justPaid: boolean }) {
  const { user } = useAuth();
  const environment = getPaddleEnvironment();
  const fetchPlan = useServerFn(getMyPlan);
  const { data, dataUpdatedAt, isLoading } = useQuery({
    queryKey: ["my-plan", user?.id, environment],
    queryFn: () => fetchPlan({ data: { environment } }),
    enabled: Boolean(user),
    refetchInterval: (q) => (justPaid && (!q.state.data || q.state.data.plan === "free") && q.state.dataUpdateCount < 20 ? 3000 : false),
  });
  void dataUpdatedAt;

  if (isLoading || !data) return null;
  const plan = getPlan(data.plan);
  const paid = plan.id !== "free";

  if (justPaid && !paid) {
    return (
      <div className="panel mt-4 flex items-center gap-3 p-4 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Payment received — activating your plan…
      </div>
    );
  }

  const ends = data.periodEnd ? new Date(data.periodEnd).toLocaleDateString() : null;
  return (
    <div className="panel mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-3">
        <CheckCircle2 className={paid ? "h-5 w-5 text-primary" : "h-5 w-5 text-muted-foreground"} />
        <div>
          <p className="text-sm font-semibold">
            {plan.name} plan {paid ? <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">{data.cancelAtPeriodEnd ? "Active until period end" : "Active"}</span> : null}
          </p>
          <p className="text-xs text-muted-foreground">
            {plan.tokens} token-equivalent credits · {plan.projectLimit} active project{plan.projectLimit > 1 ? "s" : ""}
            {paid && ends ? ` · ${data.cancelAtPeriodEnd ? "ends" : "renews"} ${ends}` : ""}
          </p>
        </div>
      </div>
      <Link to="/credits" className="text-sm font-semibold text-primary">{paid ? "Manage plan" : "Upgrade"}</Link>
    </div>
  );
}
