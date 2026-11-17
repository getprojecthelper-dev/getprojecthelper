import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/hooks/use-currency";
import { getLocalizedPlanPrices, getPaddleEnvironment, openPlanCheckout } from "@/lib/paddle";
import { cancelPlan, changePlan, getMyPlan } from "@/lib/plans.functions";
import { PLANS, getPlan } from "@/lib/plans";
import { CURRENCIES, formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const fallbackPrices = (currency: keyof typeof CURRENCIES) =>
  Object.fromEntries(
    PLANS.flatMap((plan) => {
      if (!plan.priceId) return [];
      const amount = currency === "INR"
        ? plan.inrPrice
        : (plan.inrPrice / CURRENCIES.INR.fx) * CURRENCIES[currency].fx;
      return [[plan.priceId, formatMoney(amount, currency)]];
    }),
  );

const RANK = { free: 0, starter: 1, student: 2, professional: 3 } as const;

export function PlanCards({ className }: { className?: string }) {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const queryClient = useQueryClient();
  const environment = getPaddleEnvironment();
  const fetchPlan = useServerFn(getMyPlan);
  const doChange = useServerFn(changePlan);
  const doCancel = useServerFn(cancelPlan);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getLocalizedPlanPrices(PLANS.flatMap((p) => (p.priceId ? [p.priceId] : [])))
      .then((found) => {
        if (active) setPrices(Object.keys(found).length ? found : fallbackPrices(currency));
      })
      .catch(() => {
        if (active) setPrices(fallbackPrices(currency));
      });
    return () => { active = false; };
  }, [currency]);

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
        const price = plan.priceId ? prices[plan.priceId] ?? "…" : "Free";
        return (
          <div
            key={plan.id}
            className={cn("pricing-plan-card relative flex flex-col rounded-2xl border p-6", plan.badge && "pricing-plan-card--featured")}
          >
            {plan.badge && (
              <span className="pricing-plan-badge absolute -top-3 left-6 rounded-full px-3 py-0.5 text-xs font-semibold">
                {plan.badge}
              </span>
            )}
            <h3 className="pricing-plan-name font-display text-xl">{plan.name}</h3>
            <p className="pricing-plan-tagline text-sm">{plan.tagline}</p>
            <p className="pricing-plan-price mt-4">
              <span className="font-display text-4xl">{price}</span>
              {plan.priceId && <span className="pricing-plan-period text-sm"> / month</span>}
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="pricing-plan-feature flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2">
              {!user ? (
                <Button asChild className="pricing-plan-action w-full" variant={plan.badge ? "default" : "outline"}>
                  <Link to="/auth" search={{ mode: "signup" }}>{plan.priceId ? `Get ${plan.name}` : "Start free"}</Link>
                </Button>
              ) : isCurrent ? (
                <>
                  <Button className="pricing-plan-action w-full" variant="secondary" disabled>Current plan</Button>
                  {plan.priceId && !mine?.cancelAtPeriodEnd && (
                    <Button className="pricing-plan-action pricing-plan-action--quiet w-full" variant="ghost" size="sm" disabled={busy !== null} onClick={cancel}>
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
                  className="pricing-plan-action w-full"
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
