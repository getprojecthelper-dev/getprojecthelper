import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";
import { getPlan, PLANS } from "@/lib/plans";

const envSchema = z.enum(["sandbox", "live"]);

async function activeSub(supabase: any, userId: string, environment: string) {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("environment", environment)
    .not("paddle_subscription_id", "is", null)
    .in("status", ["active", "trialing", "past_due", "canceled"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  if (data.status === "canceled" && !(data.current_period_end && new Date(data.current_period_end) > new Date())) return null;
  return data;
}

export const getMyPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ environment: envSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const sub = await activeSub(context.supabase, context.userId, data.environment);
    return {
      plan: getPlan(sub?.plan ?? "free").id,
      status: (sub?.status as string | undefined) ?? null,
      periodEnd: (sub?.current_period_end as string | null | undefined) ?? null,
      cancelAtPeriodEnd: Boolean(sub?.cancel_at_period_end),
    };
  });

/** Upgrade/downgrade now; the difference is charged (or credited) immediately. */
export const changePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ environment: envSchema, plan: z.enum(["starter", "student", "professional"]) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const sub = await activeSub(context.supabase, context.userId, data.environment);
    if (!sub) throw new Error("You don't have an active plan to change.");
    const target = PLANS.find((p) => p.id === data.plan)!;
    const env = data.environment as PaddleEnv;
    const lookup = await gatewayFetch(env, `/prices?external_id=${target.priceId}`);
    const priceId = ((await lookup.json()) as { data?: { id: string }[] }).data?.[0]?.id;
    if (!priceId) throw new Error("That plan is unavailable right now.");
    const res = await gatewayFetch(env, `/subscriptions/${sub.paddle_subscription_id}`, {
      method: "PATCH",
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        proration_billing_mode: "prorated_immediately",
        ...(sub.cancel_at_period_end ? { scheduled_change: null } : {}),
      }),
    });
    if (!res.ok) throw new Error("Your plan could not be changed. Please try again.");
    return { ok: true };
  });

/** Cancel at the end of the paid month. */
export const cancelPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ environment: envSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const sub = await activeSub(context.supabase, context.userId, data.environment);
    if (!sub) throw new Error("You don't have an active plan.");
    const res = await gatewayFetch(data.environment as PaddleEnv, `/subscriptions/${sub.paddle_subscription_id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ effective_from: "next_billing_period" }),
    });
    if (!res.ok) throw new Error("Your plan could not be cancelled. Please try again.");
    return { ok: true };
  });
