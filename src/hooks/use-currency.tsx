import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { CURRENCIES, DEFAULT_CURRENCY, detectCurrency, type CurrencyCode } from "@/lib/pricing";
import { getVisitorRegion } from "@/lib/region.functions";

const STORAGE_KEY = "ph-currency";

const isCurrency = (value: unknown): value is CurrencyCode =>
  typeof value === "string" && value in CURRENCIES;

/**
 * Currency preference for the price list.
 *
 * Order of precedence: the student's own choice (remembered), then the country
 * detected from the CDN geo header, then a time-zone guess, then USD.
 * Detection runs after hydration so server and client render the same markup.
 */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [manual, setManual] = useState(false);

  const region = useQuery({
    queryKey: ["visitor-region"],
    queryFn: () => getVisitorRegion(),
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isCurrency(stored)) {
      setManual(true);
      setCurrencyState(stored);
      return;
    }
    setCurrencyState(detectCurrency());
  }, []);

  useEffect(() => {
    if (manual || !region.data) return;
    // Only trust the geo header when it actually resolved a country.
    if (region.data.country) setCurrencyState(region.data.currency);
  }, [manual, region.data]);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setManual(true);
    setCurrencyState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return { currency, setCurrency, country: region.data?.country ?? null, autoDetected: !manual };
}
