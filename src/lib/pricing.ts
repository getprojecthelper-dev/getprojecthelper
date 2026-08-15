/**
 * Public price list. One source of truth for every pack, in every currency,
 * so the pricing page, the credits page and the admin economics panel agree.
 *
 * Prices were set from measured unit costs: 1 credit ~ 1,000 tokens, which
 * costs us ~$0.002 (worst case $0.005 on the premium model). Every pack below
 * clears its AI cost plus payment fees with room to carry the free tier.
 *
 * Regional pricing: a student in Lagos or Jakarta cannot pay New York prices,
 * so each currency carries a purchasing-power multiplier applied to the USD
 * anchor price. The floor guard below keeps every regional price above the
 * cost of serving the pack, so no region can ever be sold at a loss.
 */

export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "CAD"
  | "AUD"
  | "AED"
  | "INR"
  | "PKR"
  | "BDT"
  | "NGN"
  | "ZAR"
  | "PHP"
  | "IDR"
  | "VND"
  | "BRL"
  | "MXN"
  | "TRY"
  | "EGP";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  label: string;
  locale: string;
  /** Units of this currency per 1 USD. */
  fx: number;
  /**
   * Purchasing-power multiplier on the USD anchor. 1 = full price.
   * Lower values are student-affordability adjustments, not discounts we
   * can be talked out of — they are what makes the product sellable there.
   */
  ppp: number;
  /** Prices are rounded to a multiple of this, then charm-ended. */
  step: number;
  /** Subtracted after rounding for charm pricing (e.g. 150 -> 149). */
  charm: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$", label: "USD", locale: "en-US", fx: 1, ppp: 1, step: 1, charm: 0 },
  EUR: { code: "EUR", symbol: "€", label: "EUR", locale: "de-DE", fx: 0.92, ppp: 1, step: 1, charm: 0 },
  GBP: { code: "GBP", symbol: "£", label: "GBP", locale: "en-GB", fx: 0.79, ppp: 1, step: 1, charm: 0 },
  CAD: { code: "CAD", symbol: "CA$", label: "CAD", locale: "en-CA", fx: 1.37, ppp: 1, step: 1, charm: 0 },
  AUD: { code: "AUD", symbol: "A$", label: "AUD", locale: "en-AU", fx: 1.5, ppp: 1, step: 1, charm: 0 },
  AED: { code: "AED", symbol: "AED", label: "AED", locale: "en-AE", fx: 3.67, ppp: 1, step: 5, charm: 1 },
  INR: { code: "INR", symbol: "₹", label: "INR", locale: "en-IN", fx: 84, ppp: 0.36, step: 50, charm: 1 },
  PKR: { code: "PKR", symbol: "Rs", label: "PKR", locale: "en-PK", fx: 278, ppp: 0.32, step: 100, charm: 1 },
  BDT: { code: "BDT", symbol: "৳", label: "BDT", locale: "en-BD", fx: 119, ppp: 0.32, step: 50, charm: 1 },
  NGN: { code: "NGN", symbol: "₦", label: "NGN", locale: "en-NG", fx: 1550, ppp: 0.35, step: 500, charm: 1 },
  ZAR: { code: "ZAR", symbol: "R", label: "ZAR", locale: "en-ZA", fx: 18, ppp: 0.55, step: 10, charm: 1 },
  PHP: { code: "PHP", symbol: "₱", label: "PHP", locale: "en-PH", fx: 58, ppp: 0.4, step: 50, charm: 1 },
  IDR: { code: "IDR", symbol: "Rp", label: "IDR", locale: "id-ID", fx: 15800, ppp: 0.38, step: 5000, charm: 0 },
  VND: { code: "VND", symbol: "₫", label: "VND", locale: "vi-VN", fx: 25000, ppp: 0.38, step: 5000, charm: 0 },
  BRL: { code: "BRL", symbol: "R$", label: "BRL", locale: "pt-BR", fx: 5.5, ppp: 0.55, step: 5, charm: 1 },
  MXN: { code: "MXN", symbol: "MX$", label: "MXN", locale: "es-MX", fx: 18.5, ppp: 0.6, step: 10, charm: 1 },
  TRY: { code: "TRY", symbol: "₺", label: "TRY", locale: "tr-TR", fx: 34, ppp: 0.45, step: 50, charm: 1 },
  EGP: { code: "EGP", symbol: "E£", label: "EGP", locale: "en-EG", fx: 48, ppp: 0.3, step: 50, charm: 1 },
};

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

/**
 * Country -> currency. Countries not listed fall back to USD, which is the
 * safe choice: full price, no margin risk.
 */
export const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  US: "USD", PR: "USD", EC: "USD",
  GB: "GBP",
  IE: "EUR", DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", NL: "EUR", BE: "EUR", AT: "EUR",
  PT: "EUR", FI: "EUR", GR: "EUR", SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR", LT: "EUR",
  LU: "EUR", CY: "EUR", MT: "EUR", HR: "EUR",
  CA: "CAD",
  AU: "AUD", NZ: "AUD",
  AE: "AED", SA: "AED", QA: "AED", KW: "AED", OM: "AED", BH: "AED",
  IN: "INR", NP: "INR", LK: "INR",
  PK: "PKR",
  BD: "BDT",
  NG: "NGN", GH: "NGN",
  ZA: "ZAR", KE: "ZAR", UG: "ZAR", TZ: "ZAR", ZW: "ZAR",
  PH: "PHP",
  ID: "IDR",
  VN: "VND",
  BR: "BRL",
  MX: "MXN", CO: "MXN", AR: "MXN", CL: "MXN", PE: "MXN",
  TR: "TRY",
  EG: "EGP", MA: "EGP", DZ: "EGP", TN: "EGP",
};

export interface PricingPack {
  id: string;
  name: string;
  credits: number;
  /** USD anchor price. Every other currency is derived from this. */
  priceUsd: number;
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
    priceUsd: 135,
    blurb: "Try a project end to end.",
    includes: ["~ 1 small project", "~ 30 AI steps", "Idea, dataset and planning help"],
  },
  {
    id: "builder",
    name: "Builder",
    credits: 500,
    priceUsd: 450,
    blurb: "A full project, start to finish.",
    includes: ["~ 1 full project with revisions", "~ 100 AI steps", "Error fixes and report writing"],
    popular: true,
  },
  {
    id: "semester",
    name: "Semester",
    credits: 1200,
    priceUsd: 1080,
    blurb: "A whole semester of work.",
    includes: ["~ 3 full projects", "~ 250 AI steps", "Viva prep and portfolio export"],
  },
];

/**
 * Hard floor: what a fully-consumed pack costs us in AI plus payment fees,
 * in USD. Regional prices are never allowed below this.
 * 1 credit ~ 1,000 tokens ~ $0.002, plus ~3% + $0.30 processing.
 */
const packFloorUsd = (pack: PricingPack) => (pack.credits * 0.002 + 0.3) / 0.95;

const roundCharm = (value: number, info: CurrencyInfo) => {
  const stepped = Math.max(info.step, Math.round(value / info.step) * info.step);
  const charmed = stepped - info.charm;
  return charmed > 0 ? charmed : stepped;
};

/** Price of one pack in the chosen currency, PPP-adjusted and floor-guarded. */
export const packPrice = (pack: PricingPack, currency: CurrencyCode) => {
  const info = CURRENCIES[currency];
  if (currency === "USD") return pack.priceUsd;
  const targetUsd = Math.max(pack.priceUsd * info.ppp, packFloorUsd(pack));
  return roundCharm(targetUsd * info.fx, info);
};

/** The same price expressed back in USD — used for margin checks. */
export const packPriceInUsd = (pack: PricingPack, currency: CurrencyCode) =>
  packPrice(pack, currency) / CURRENCIES[currency].fx;

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

/** Currency for an ISO country code, e.g. "IN" -> INR. */
export const currencyForCountry = (country?: string | null): CurrencyCode => {
  if (!country) return DEFAULT_CURRENCY;
  return COUNTRY_CURRENCY[country.trim().toUpperCase()] ?? DEFAULT_CURRENCY;
};

/** Last-resort guess from the browser time zone when no country is known. */
export const detectCurrency = (): CurrencyCode => {
  if (typeof Intl === "undefined") return DEFAULT_CURRENCY;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const byZone: [RegExp, CurrencyCode][] = [
      [/Kolkata|Calcutta|Kathmandu|Colombo/i, "INR"],
      [/Karachi/i, "PKR"],
      [/Dhaka/i, "BDT"],
      [/Lagos|Accra/i, "NGN"],
      [/Johannesburg|Nairobi|Kampala/i, "ZAR"],
      [/Manila/i, "PHP"],
      [/Jakarta|Makassar/i, "IDR"],
      [/Ho_Chi_Minh|Saigon|Hanoi/i, "VND"],
      [/Sao_Paulo|Recife|Fortaleza/i, "BRL"],
      [/Mexico_City|Bogota|Lima|Santiago|Buenos_Aires/i, "MXN"],
      [/Istanbul/i, "TRY"],
      [/Cairo|Casablanca|Algiers|Tunis/i, "EGP"],
      [/Dubai|Riyadh|Qatar|Kuwait/i, "AED"],
      [/London/i, "GBP"],
      [/Toronto|Vancouver|Edmonton|Winnipeg|Halifax/i, "CAD"],
      [/Sydney|Melbourne|Brisbane|Perth|Auckland/i, "AUD"],
      [/Europe\//i, "EUR"],
    ];
    for (const [re, code] of byZone) if (re.test(tz)) return code;
  } catch {
    // Fall through to the default.
  }
  return DEFAULT_CURRENCY;
};

/** Cheapest pack — used for the low-credit nudge. */
export const cheapestPack = () =>
  PACKS.reduce((low, pack) => (pack.priceUsd < low.priceUsd ? pack : low), PACKS[0]!);
