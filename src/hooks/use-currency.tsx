import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  currencyForCountry,
  detectCurrency,
  type CurrencyCode,
} from "@/lib/pricing";
import { getVisitorRegion } from "@/lib/region.functions";

const CURRENCY_KEY = "ph-currency";
const COUNTRY_KEY = "ph-country";

const isCurrency = (value: unknown): value is CurrencyCode =>
  typeof value === "string" && value in CURRENCIES;

/**
 * Currency preference for the price list.
 *
 * Order of precedence: a locked currency the student picked, then a country
 * override they picked, then the country detected from the CDN geo header,
 * then a time-zone guess, then USD. Detection runs after hydration so server
 * and client render the same markup.
 */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [locked, setLocked] = useState(false);
  const [countryOverride, setCountryOverride] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const region = useQuery({
    queryKey: ["visitor-region"],
    queryFn: () => getVisitorRegion(),
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    const storedCountry = window.localStorage.getItem(COUNTRY_KEY);
    const storedCurrency = window.localStorage.getItem(CURRENCY_KEY);
    if (storedCountry) setCountryOverride(storedCountry);
    if (isCurrency(storedCurrency)) {
      setLocked(true);
      setCurrencyState(storedCurrency);
    } else if (storedCountry) {
      setCurrencyState(currencyForCountry(storedCountry));
    } else {
      setCurrencyState(detectCurrency());
    }
    setHydrated(true);
  }, []);

  // Geo result only matters when nothing is pinned by the student.
  useEffect(() => {
    if (!hydrated || locked || countryOverride) return;
    if (region.data?.country) setCurrencyState(region.data.currency);
  }, [hydrated, locked, countryOverride, region.data]);

  /** Pin a currency for every price in the app. */
  const setCurrency = useCallback((next: CurrencyCode) => {
    setLocked(true);
    setCurrencyState(next);
    window.localStorage.setItem(CURRENCY_KEY, next);
  }, []);

  /** Override the detected country; currency follows unless one is locked. */
  const setCountry = useCallback(
    (next: string) => {
      const code = next.trim().toUpperCase();
      setCountryOverride(code);
      window.localStorage.setItem(COUNTRY_KEY, code);
      if (!locked) setCurrencyState(currencyForCountry(code));
    },
    [locked],
  );

  /** Drop both overrides and go back to detection. */
  const resetRegion = useCallback(() => {
    setLocked(false);
    setCountryOverride(null);
    window.localStorage.removeItem(CURRENCY_KEY);
    window.localStorage.removeItem(COUNTRY_KEY);
    setCurrencyState(region.data?.country ? region.data.currency : detectCurrency());
  }, [region.data]);

  const detectedCountry = region.data?.country ?? null;

  return {
    currency,
    setCurrency,
    country: countryOverride ?? detectedCountry,
    detectedCountry,
    countryOverride,
    setCountry,
    resetRegion,
    locked,
    /** True while nothing is pinned by the student. */
    autoDetected: !locked && !countryOverride,
  };
}
