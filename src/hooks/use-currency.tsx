import { useCallback, useEffect, useState } from "react";

import { detectCurrency, type CurrencyCode } from "@/lib/pricing";

const STORAGE_KEY = "ph-currency";

/**
 * Currency preference for the price list. Defaults to INR for Indian time
 * zones and USD elsewhere; a manual choice is remembered.
 *
 * Detection runs after hydration so server and client render the same markup.
 */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "USD" || stored === "INR") {
      setCurrencyState(stored);
      return;
    }
    setCurrencyState(detectCurrency());
  }, []);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return { currency, setCurrency };
}
