/**
 * Unit-economics model. One place for every money assumption so the admin
 * dashboard, the packs page and any future pricing change agree on the maths.
 *
 * Credits are the internal currency: 1 credit ≈ 1,000 AI tokens
 * (see credit-costs.ts). Cost is what the model provider charges us for those
 * tokens; revenue is what students pay us for credits.
 */

import { CREDIT_PACKS } from "@/lib/credit-costs";

/**
 * Blended provider cost in USD per 1,000 tokens (input + output averaged).
 * Tune this one number when the model or model mix changes.
 */
export const USD_PER_1K_TOKENS = 0.002;

/** Per-model overrides, matched on a substring of the recorded model name. */
export const MODEL_COST_OVERRIDES: { match: string; usdPer1kTokens: number }[] = [
  { match: "flash", usdPer1kTokens: 0.0006 },
  { match: "pro", usdPer1kTokens: 0.005 },
];

export const costPer1kTokens = (model?: string | null) => {
  if (model) {
    const hit = MODEL_COST_OVERRIDES.find((m) => model.toLowerCase().includes(m.match));
    if (hit) return hit.usdPer1kTokens;
  }
  return USD_PER_1K_TOKENS;
};

/** USD the provider bills us for a number of tokens. */
export const tokenCostUsd = (tokens: number, model?: string | null) =>
  (tokens / 1000) * costPer1kTokens(model);

/** Average USD a sold credit brings in, across the published packs. */
export const avgPricePerCreditUsd = (() => {
  const credits = CREDIT_PACKS.reduce((s, p) => s + p.credits, 0);
  const dollars = CREDIT_PACKS.reduce((s, p) => s + p.priceUsd, 0);
  return credits > 0 ? dollars / credits : 0;
})();

/** Break-even info for a pack: what its credits cost us if fully consumed. */
export const packEconomics = () =>
  CREDIT_PACKS.map((pack) => {
    // 1 credit ≈ 1,000 tokens, so credits map straight onto token cost.
    const cost = tokenCostUsd(pack.credits * 1000);
    const margin = pack.priceUsd - cost;
    return {
      id: pack.id,
      name: pack.name,
      credits: pack.credits,
      priceUsd: pack.priceUsd,
      costUsd: Number(cost.toFixed(2)),
      marginUsd: Number(margin.toFixed(2)),
      marginPct: pack.priceUsd > 0 ? Math.round((margin / pack.priceUsd) * 100) : 0,
    };
  });

export const usd = (value: number) => {
  const abs = Math.abs(value);
  // Sub-cent figures (per-token, per-credit costs) need more precision.
  const digits = abs === 0 ? 2 : abs < 0.01 ? 4 : abs < 10 ? 2 : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits === 4 ? 3 : undefined,
    maximumFractionDigits: digits,
  }).format(value);
};


export type EconomicsWindow = "7d" | "30d" | "all";

export const WINDOW_LABELS: Record<EconomicsWindow, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};
