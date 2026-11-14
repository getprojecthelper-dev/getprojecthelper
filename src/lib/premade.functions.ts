import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { planForPriceId } from "@/lib/plans";

const PREMASE_CLOSED_MESSAGE = "Buy projects is launching soon. It will be open here shortly.";

/**
 * The Buy projects area is locked until it is opened from the admin panel.
 * The flag lives in the same public-readable settings row as website
 * availability, so every checkout path can be checked on the server.
 */
export function createPublishableReadClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error(PREMASE_CLOSED_MESSAGE);
  return createClient(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(
          typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
        );
        if (init?.headers) new Headers(init.headers).forEach((value, name) => headers.set(name, value));
        headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function isPremadeOpen(): Promise<boolean> {
  const { data, error } = await createPublishableReadClient()
    .from("site_availability")
    .select("premade_enabled")
    .eq("id", true)
    .maybeSingle();
  if (error || !data) return false; // fail closed: unreadable settings keep the store locked
  return data.premade_enabled === true;
}

async function assertPremadeOpen() {
  if (!(await isPremadeOpen())) throw new Error(PREMASE_CLOSED_MESSAGE);
}

export const resolveProjectPrice = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ priceId: z.string().min(1), environment: z.enum(["sandbox", "live"]) }).parse(input),
  )
  .handler(async ({ data }) => {
    // Monthly plans are independent of the Buy projects store lock.
    // Only our configured plan IDs may use the external-ID lookup.
    if (planForPriceId(data.priceId)) {
      const { gatewayFetch } = await import("@/lib/paddle.server");
      const response = await gatewayFetch(
        data.environment,
        `/prices?external_id=${encodeURIComponent(data.priceId)}`,
      );
      if (!response.ok) throw new Error("This subscription price is unavailable.");
      const result = await response.json() as {
        data?: Array<{ id: string; external_id: string; status: string }>;
      };
      const price = result.data?.find(
        (item) => item.external_id === data.priceId && item.status === "active" && item.id.startsWith("pri_"),
      );
      if (!price) throw new Error("This subscription price is unavailable.");
      return price.id;
    }
    // Only prices attached to a live, available admin listing can be resolved.
    if (!data.priceId.startsWith("pri_")) throw new Error("This project price is unavailable.");
    await assertPremadeOpen();
    const { data: listing } = await createPublishableReadClient()
      .from("premade_listings")
      .select("id")
      .eq("provider_price_id", data.priceId)
      .eq("is_live", true)
      .eq("is_available", true)
      .maybeSingle();
    if (!listing) throw new Error("This project is not available right now.");
    return data.priceId;
  });

export const getProjectPurchase = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().min(1), environment: z.enum(["sandbox", "live"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: purchase, error } = await context.supabase
      .from("project_purchases")
      .select("project_id")
      .eq("catalog_project_id", data.id)
      .eq("environment", data.environment)
      .eq("status", "completed")
      .maybeSingle();
    if (error) throw new Error("We couldn't check this purchase.");
    return { owned: Boolean(purchase), projectId: purchase?.project_id ?? null };
  });

export const listProjectPurchases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ environment: z.enum(["sandbox", "live"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: purchases, error } = await context.supabase
      .from("project_purchases")
      .select("catalog_project_id,project_id")
      .eq("environment", data.environment)
      .eq("status", "completed");
    if (error) throw new Error("We couldn't load your purchased projects.");
    return purchases ?? [];
  });
