import { Check, Lock, RotateCcw, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/use-currency";
import {
  COUNTRY_CURRENCY,
  CURRENCIES,
  PACKS,
  formatMoney,
  packPrice,
  perCreditPrice,
  type CurrencyCode,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

/** Currency codes, USD first and the rest alphabetical. */
const CODES = (Object.keys(CURRENCIES) as CurrencyCode[]).sort((a, b) =>
  a === "USD" ? -1 : b === "USD" ? 1 : a.localeCompare(b),
);

const countryName = (code: string) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};

/** Supported countries, alphabetical by display name. */
const COUNTRIES = Object.keys(COUNTRY_CURRENCY)
  .map((code) => ({ code, name: countryName(code) }))
  .sort((a, b) => a.name.localeCompare(b.name));

interface PricingPacksProps {
  /** Rendered inside each card instead of the default disabled button. */
  action?: (packId: string) => ReactNode;
  className?: string;
}

/** Shared three-pack price grid with a region + currency switch. */
export function PricingPacks({ action, className }: PricingPacksProps) {
  const {
    currency,
    setCurrency,
    country,
    detectedCountry,
    countryOverride,
    setCountry,
    resetRegion,
    locked,
    autoDetected,
  } = useCurrency();

  const selectClass =
    "h-10 rounded-full border border-border/70 bg-card px-4 text-sm font-medium";

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Prices for your region
        </span>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <label htmlFor="country-select" className="sr-only">
            Country
          </label>
          <select
            id="country-select"
            value={country ?? ""}
            onChange={(e) => setCountry(e.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              Select country
            </option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>

          <label htmlFor="currency-select" className="sr-only">
            Currency
          </label>
          <select
            id="currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className={selectClass}
          >
            {CODES.map((code) => (
              <option key={code} value={code}>
                {CURRENCIES[code].symbol} {CURRENCIES[code].label}
              </option>
            ))}
          </select>

          {autoDetected ? null : (
            <Button variant="ghost" size="sm" className="rounded-full" onClick={resetRegion}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Use my location
            </Button>
          )}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {locked ? (
            <>
              <Lock className="h-3.5 w-3.5" />
              {CURRENCIES[currency].label} locked for all prices.
            </>
          ) : countryOverride ? (
            <>Showing {CURRENCIES[currency].label} prices for {countryName(countryOverride)}.</>
          ) : detectedCountry ? (
            <>
              Showing {CURRENCIES[currency].label} prices for your location (
              {countryName(detectedCountry)}).
            </>
          ) : (
            <>Pick your country to see local pricing.</>
          )}
        </p>
      </div>


      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {PACKS.map((pack) => (
          <div
            key={pack.id}
            className={cn(
              "relative flex flex-col rounded-2xl border border-border bg-card p-6",
              pack.popular && "border-primary shadow-md md:-translate-y-2",
            )}
          >
            {pack.popular ? (
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                Most popular
              </span>
            ) : null}

            <p className="font-display text-base font-semibold">{pack.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{pack.blurb}</p>

            <p className="mt-5 font-display text-4xl font-semibold tabular-nums">
              {formatMoney(packPrice(pack, currency), currency)}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {pack.credits.toLocaleString()} credits
              <span className="text-xs">
                ({formatMoney(perCreditPrice(pack, currency), currency, CURRENCIES[currency].fx >= 20 ? 2 : 3)}{" "}
                each)
              </span>
            </p>

            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {pack.includes.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {action ? (
                action(pack.id)
              ) : (
                <Button className="w-full" variant={pack.popular ? "default" : "outline"} disabled>
                  Coming soon
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
