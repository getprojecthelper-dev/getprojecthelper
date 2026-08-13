/**
 * Public price list. One source of truth for every pack, in every currency,
 * so the pricing page, the credits page and the admin economics panel agree.
 *
 * Prices were set from measured unit costs: 1 credit ≈ 1,000 tokens, which
 * costs us ~$0.002 (worst case $0.005 on the premium model). Every pack below
 * clears its AI cost plus payment fees with room to carry the free tier.
 */

export type CurrencyCode = "USD" | "INR";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  label: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$", label: "USD", locale: "en-US" },
  INR: { code: "INR", symbol: "₹", label: "INR", locale: "en-IN" },
};

export interface PricingPack {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  priceInr: number;
  blurb: string;
  /** Plain-language guide to what the credits actually buy. */
  includes: string[];
  popular?: boolean;
}

export const PACKS: PricingPack[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 150,
    priceUsd: 5,
    priceInr: 149,
    blurb: "Try a project end to end.",
    includes: ["≈ 1 small project", "≈ 30 AI steps", "Idea, dataset and planning help"],
  },
  {
    id: "builder",
    name: "Builder",
    credits: 500,
    priceUsd: 14,
    priceInr: 399,
    blurb: "A full project, start to finish.",
    includes: ["≈ 1 full project with revisions", "≈ 100 AI steps", "Error fixes and report writing"],
    popular: true,
  },
  {
    id: "semester",
    name: "Semester",
    credits: 1200,
    priceUsd: 29,
    priceInr: 899,
    blurb: "A whole semester of work.",
    includes: ["≈ 3 full projects", "≈ 250 AI steps", "Viva prep and portfolio export"],
  },
];

/** Price of one pack in the chosen currency. */
export const packPrice = (pack: PricingPack, currency: CurrencyCode) =>
  currency === "INR" ? pack.priceInr : pack.priceUsd;

/** What a single credit costs the student, in the chosen currency. */
export const perCreditPrice = (pack: PricingPack, currency: CurrencyCode) =>
  packPrice(pack, currency) / pack.credits;

export const formatMoney = (amount: number, currency: CurrencyCode, fractionDigits?: number) => {
  const info = CURRENCIES[currency];
  const digits = fractionDigits ?? (Number.isInteger(amount) ? 0 : 2);
  return new Intl.NumberFormat(info.locale, {
    style: "currency",
    currency: info.code,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
};

/** Indian time zones get INR by default; everyone else sees USD. */
export const detectCurrency = (): CurrencyCode => {
  if (typeof Intl === "undefined") return "USD";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    if (/Kolkata|Calcutta|Colombo|Dhaka|Kathmandu|Karachi/i.test(tz)) return "INR";
  } catch {
    // Fall through to the default.
  }
  return "USD";
};

/** Cheapest pack — used for the low-credit nudge. */
export const cheapestPack = () =>
  PACKS.reduce((low, pack) => (pack.priceUsd < low.priceUsd ? pack : low), PACKS[0]!);
