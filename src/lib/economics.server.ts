/**
 * Server-side aggregation for the unit-economics panel. Kept out of the
 * *.functions.ts module so the server function file stays a thin wrapper.
 */

import {
  avgPricePerCreditUsd,
  paymentFeeUsd,
  tokenCostUsd,
  type EconomicsWindow,
} from "@/lib/economics";

export interface UnitEconomics {
  window: EconomicsWindow;
  revenueUsd: number;
  subscriptionMrrUsd: number;
  creditSalesUsd: number;
  aiCostUsd: number;
  grossMarginUsd: number;
  grossMarginPct: number;
  freeCreditBurnUsd: number;
  paymentFeesUsd: number;
  netMarginUsd: number;
  netMarginPct: number;
  tokens: number;
  creditsConsumed: number;
  creditsGrantedFree: number;
  creditsSold: number;
  avgPricePerCreditUsd: number;
  avgCostPerCreditUsd: number;
  signups: number;
  costPerSignupUsd: number;
  activeUsers: number;
  avgCreditsPerActiveUser: number;
  topUsers: { userId: string; email: string; credits: number; costUsd: number }[];
  weekly: { week: string; revenueUsd: number; costUsd: number }[];
}

const PAID_KINDS = new Set(["purchase", "topup"]);
const FREE_KINDS = new Set(["starter", "redeem", "admin_adjust", "grant"]);

const windowStart = (win: EconomicsWindow) => {
  if (win === "all") return null;
  const days = win === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 86_400_000).toISOString();
};

const weekKey = (iso: string) => {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7; // Monday-based
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function computeUnitEconomics(
  supabaseAdmin: any,
  win: EconomicsWindow,
): Promise<UnitEconomics> {
  const since = windowStart(win);

  const usageQ = supabaseAdmin
    .from("ai_usage_events")
    .select("user_id, model, total_tokens, credits, created_at");
  const txQ = supabaseAdmin.from("credit_transactions").select("user_id, delta, kind, created_at");
  const profileQ = supabaseAdmin.from("profiles").select("id, created_at");

  if (since) {
    usageQ.gte("created_at", since);
    txQ.gte("created_at", since);
    profileQ.gte("created_at", since);
  }

  const [usage, txs, profiles, subs] = await Promise.all([
    usageQ,
    txQ,
    profileQ,
    supabaseAdmin.from("subscriptions").select("status, amount_cents"),
  ]);

  const usageRows: any[] = usage.data ?? [];
  const txRows: any[] = txs.data ?? [];

  let tokens = 0;
  let aiCostUsd = 0;
  let creditsConsumed = 0;
  const perUser = new Map<string, { credits: number; costUsd: number }>();
  const weekCost = new Map<string, number>();

  for (const row of usageRows) {
    const t = Number(row.total_tokens ?? 0);
    const cost = tokenCostUsd(t, row.model);
    tokens += t;
    aiCostUsd += cost;
    creditsConsumed += Number(row.credits ?? 0);

    const u = perUser.get(row.user_id) ?? { credits: 0, costUsd: 0 };
    perUser.set(row.user_id, {
      credits: u.credits + Number(row.credits ?? 0),
      costUsd: u.costUsd + cost,
    });

    const wk = weekKey(row.created_at);
    weekCost.set(wk, (weekCost.get(wk) ?? 0) + cost);
  }

  let creditsSold = 0;
  let creditsGrantedFree = 0;
  let paidChargeCount = 0;
  const weekRevenue = new Map<string, number>();
  for (const tx of txRows) {
    const delta = Number(tx.delta ?? 0);
    if (delta <= 0) continue;
    if (PAID_KINDS.has(tx.kind)) {
      creditsSold += delta;
      paidChargeCount += 1;
      const wk = weekKey(tx.created_at);
      weekRevenue.set(wk, (weekRevenue.get(wk) ?? 0) + delta * avgPricePerCreditUsd);
    } else if (FREE_KINDS.has(tx.kind)) {
      creditsGrantedFree += delta;
    }
  }

  let subscriptionMrrUsd = 0;
  for (const s of (subs.data ?? []) as any[]) {
    if (s.status === "active" || s.status === "trialing") {
      subscriptionMrrUsd += Number(s.amount_cents ?? 0) / 100;
    }
  }

  const creditSalesUsd = creditsSold * avgPricePerCreditUsd;
  const revenueUsd = creditSalesUsd + subscriptionMrrUsd;
  const grossMarginUsd = revenueUsd - aiCostUsd;

  // What the payment processor keeps out of that revenue.
  const paymentFeesUsd = paymentFeeUsd(revenueUsd, paidChargeCount);
  const netMarginUsd = grossMarginUsd - paymentFeesUsd;

  // Share of consumption funded by credits we gave away.
  const totalIssued = creditsSold + creditsGrantedFree;
  const freeShare = totalIssued > 0 ? creditsGrantedFree / totalIssued : 1;
  const freeCreditBurnUsd = aiCostUsd * freeShare;


  const signups = (profiles.data ?? []).length;
  const activeUsers = perUser.size;

  // Emails for the top consumers only.
  const top = [...perUser.entries()].sort((a, b) => b[1].costUsd - a[1].costUsd).slice(0, 8);
  const emails = new Map<string, string>();
  try {
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    for (const u of authUsers?.users ?? []) if (u.email) emails.set(u.id, u.email);
  } catch {
    // best-effort
  }

  const weeks = [...new Set([...weekCost.keys(), ...weekRevenue.keys()])].sort().slice(-8);

  const round = (n: number, p = 2) => Number(n.toFixed(p));

  return {
    window: win,
    revenueUsd: round(revenueUsd),
    subscriptionMrrUsd: round(subscriptionMrrUsd),
    creditSalesUsd: round(creditSalesUsd),
    aiCostUsd: round(aiCostUsd, 4),
    grossMarginUsd: round(grossMarginUsd, 4),
    grossMarginPct: revenueUsd > 0 ? Math.round((grossMarginUsd / revenueUsd) * 100) : 0,
    freeCreditBurnUsd: round(freeCreditBurnUsd, 4),
    paymentFeesUsd: round(paymentFeesUsd, 4),
    netMarginUsd: round(netMarginUsd, 4),
    netMarginPct: revenueUsd > 0 ? Math.round((netMarginUsd / revenueUsd) * 100) : 0,
    tokens,
    creditsConsumed: round(creditsConsumed),
    creditsGrantedFree: round(creditsGrantedFree),
    creditsSold: round(creditsSold),
    avgPricePerCreditUsd: round(avgPricePerCreditUsd, 4),
    avgCostPerCreditUsd: creditsConsumed > 0 ? round(aiCostUsd / creditsConsumed, 4) : 0,
    signups,
    costPerSignupUsd: signups > 0 ? round(aiCostUsd / signups, 4) : 0,
    activeUsers,
    avgCreditsPerActiveUser: activeUsers > 0 ? round(creditsConsumed / activeUsers) : 0,
    topUsers: top.map(([userId, v]) => ({
      userId,
      email: emails.get(userId) ?? "—",
      credits: round(v.credits),
      costUsd: round(v.costUsd, 4),
    })),
    weekly: weeks.map((week) => ({
      week,
      revenueUsd: round(weekRevenue.get(week) ?? 0),
      costUsd: round(weekCost.get(week) ?? 0, 4),
    })),
  };
}
