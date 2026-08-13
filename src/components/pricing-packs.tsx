import { Check, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/use-currency";
import {
  CURRENCIES,
  PACKS,
  formatMoney,
  packPrice,
  perCreditPrice,
  type CurrencyCode,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

const CODES: CurrencyCode[] = ["USD", "INR"];

interface PricingPacksProps {
  /** Rendered inside each card instead of the default disabled button. */
  action?: (packId: string) => ReactNode;
  className?: string;
}

/** Shared three-pack price grid with a currency toggle. */
export function PricingPacks({ action, className }: PricingPacksProps) {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className={className}>
      <div className="flex justify-center">
        <div
          role="group"
          aria-label="Currency"
          className="flex gap-1 rounded-full border border-border/70 bg-card p-1"
        >
          {CODES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setCurrency(code)}
              aria-pressed={currency === code}
              className={cn(
                "rounded-full px-4 py-1 text-sm font-medium transition-colors",
                currency === code
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {CURRENCIES[code].symbol} {CURRENCIES[code].label}
            </button>
          ))}
        </div>
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
                ({formatMoney(perCreditPrice(pack, currency), currency, currency === "INR" ? 2 : 3)}{" "}
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
