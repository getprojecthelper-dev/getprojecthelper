import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { CURRENCIES, DEFAULT_CURRENCY, detectCurrency, type CurrencyCode } from "@/lib/pricing";
import { getVisitorRegion } from "@/lib/region.functions";

const CURRENCY_KEY = "ph-currency";

const isCurrency = (value: unknown): value is CurrencyCode =>
  typeof value === "string" && value in CURRENCIES;

/**
 * Currency preference for the price list.
 *
 * The country is always detected (CDN geo header, then a time-zone guess) and
 * only *suggests* a currency. The student can lock a different currency for
 * every price; detection never overrides that. Detection runs after hydration
 * so server and client render the same markup.
 */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [locked, setLocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const region = useQuery({
    queryKey: ["visitor-region"],
    queryFn: () => getVisitorRegion(),
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(CURRENCY_KEY);
    if (isCurrency(stored)) {
      setLocked(true);
      setCurrencyState(stored);
    } else {
      setCurrencyState(detectCurrency());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || locked) return;
    if (region.data?.country) setCurrencyState(region.data.currency);
  }, [hydrated, locked, region.data]);

  /** Pin a currency for every price in the app. */
  const setCurrency = useCallback((next: CurrencyCode) => {
    setLocked(true);
    setCurrencyState(next);
    window.localStorage.setItem(CURRENCY_KEY, next);
  }, []);

  /** Drop the manual choice and follow the detected region again. */
  const resetRegion = useCallback(() => {
    setLocked(false);
    window.localStorage.removeItem(CURRENCY_KEY);
    setCurrencyState(region.data?.country ? region.data.currency : detectCurrency());
  }, [region.data]);

  const detectedCountry = region.data?.country ?? null;

  return {
    currency,
    setCurrency,
    resetRegion,
    locked,
    /** Country detected for this visitor — informational only. */
    country: detectedCountry,
    detectedCountry,
    /** Currency suggested by the detected region. */
    suggestedCurrency: region.data?.currency ?? detectCurrency(),
    autoDetected: !locked,
  };
}
