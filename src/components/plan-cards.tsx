import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getLocalizedPlanPrices, getPaddleEnvironment, openPlanCheckout } from "@/lib/paddle";
import { cancelPlan, changePlan, getMyPlan } from "@/lib/plans.functions";
import { PLANS, getPlan } from "@/lib/plans";
import { cn } from "@/lib/utils";

const RANK = { free: 0, starter: 1, student: 2, professional: 3 } as const;

export function PlanCards({ className }: { className?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const environment = getPaddleEnvironment();
  const fetchPlan = useServerFn(getMyPlan);
  const doChange = useServerFn(changePlan);
  const doCancel = useServerFn(cancelPlan);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    getLocalizedPlanPrices(PLANS.flatMap((p) => (p.priceId ? [p.priceId] : [])))
      .then(setPrices)
      .catch(() => {});
  }, []);

  const { data: mine } = useQuery({
    queryKey: ["my-plan", user?.id, environment],
    queryFn: () => fetchPlan({ data: { environment } }),
    enabled: Boolean(user),
  });
  const current = getPlan(mine?.plan);

  const choose = async (planId: (typeof PLANS)[number]["id"]) => {
    const plan = getPlan(planId);
    if (!user || !plan.priceId) return;
    setBusy(planId);
    try {
      if (current.id === "free") {
        await openPlanCheckout({ priceId: plan.priceId, userId: user.id, customerEmail: user.email ?? undefined });
      } else {
        await doChange({ data: { environment, plan: planId as "starter" | "student" | "professional" } });
        toast.success(`Switched to ${plan.name}. Any price difference is charged now.`);
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ["my-plan"] }), 2500);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  const cancel = async () => {
    setBusy("cancel");
    try {
      await doCancel({ data: { environment } });
      toast.success("Your plan stays active until the end of this paid month.");
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["my-plan"] }), 2500);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={cn("grid gap-5 md:grid-cols-2 xl:grid-cols-4", className)}>
      {PLANS.map((plan) => {
        const isCurrent = Boolean(user) && current.id === plan.id;
        const price = plan.priceId ? prices[plan.priceId] ?? `₹${plan.inrPrice}` : "₹0";
        return (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-card p-6",
              plan.badge ? "border-primary shadow-lg" : "border-border",
            )}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                {plan.badge}
              </span>
            )}
            <h3 className="font-display text-xl">{plan.name}</h3>
            <p className="text-sm text-muted-foreground">{plan.tagline}</p>
            <p className="mt-4">
              <span className="font-display text-4xl">{price}</span>
              {plan.priceId && <span className="text-sm text-muted-foreground"> / month</span>}
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2">
              {!user ? (
                <Button asChild className="w-full" variant={plan.badge ? "default" : "outline"}>
                  <Link to="/auth" search={{ mode: "signup" }}>{plan.priceId ? `Get ${plan.name}` : "Start free"}</Link>
                </Button>
              ) : isCurrent ? (
                <>
                  <Button className="w-full" variant="secondary" disabled>Current plan</Button>
                  {plan.priceId && !mine?.cancelAtPeriodEnd && (
                    <Button className="w-full" variant="ghost" size="sm" disabled={busy !== null} onClick={cancel}>
                      Cancel plan
                    </Button>
                  )}
                  {mine?.cancelAtPeriodEnd && mine.periodEnd && (
                    <p className="text-center text-xs text-muted-foreground">
                      Ends {new Date(mine.periodEnd).toLocaleDateString()}
                    </p>
                  )}
                </>
              ) : plan.priceId ? (
                <Button
                  className="w-full"
                  variant={plan.badge ? "default" : "outline"}
                  disabled={busy !== null}
                  onClick={() => choose(plan.id)}
                >
                  {busy === plan.id
                    ? "Opening…"
                    : current.id === "free"
                      ? `Get ${plan.name}`
                      : RANK[plan.id] > RANK[current.id]
                        ? `Upgrade to ${plan.name}`
                        : `Switch to ${plan.name}`}
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
