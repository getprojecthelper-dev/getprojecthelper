import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { currencyForCountry, type CurrencyCode } from "@/lib/pricing";

export interface VisitorRegion {
  country: string | null;
  currency: CurrencyCode;
}

/** Edge/CDN headers that carry the visitor's country, in order of trust. */
const COUNTRY_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "x-nf-client-connection-country",
  "x-geo-country",
  "x-country-code",
];

/**
 * Country of the current visitor, read from the CDN geo header. Used to pick
 * the right currency before the page paints; the client can still override.
 */
export const getVisitorRegion = createServerFn({ method: "GET" }).handler(
  async (): Promise<VisitorRegion> => {
    let country: string | null = null;
    try {
      const headers = getRequest().headers;
      for (const name of COUNTRY_HEADERS) {
        const value = headers.get(name);
        if (value && value.length === 2 && value.toUpperCase() !== "XX") {
          country = value.toUpperCase();
          break;
        }
      }
    } catch {
      // No request context (prerender) — fall back to the default currency.
    }
    return { country, currency: currencyForCountry(country) };
  },
);
