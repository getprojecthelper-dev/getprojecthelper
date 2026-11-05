import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPremadeProject, isPremadePriceId } from "@/lib/premade-projects";
import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";

export interface CatalogPricing {
  catalogProjectId: string;
  regularPriceMinor: number;
  discountPercent: number;
  salePriceMinor: number;
}

const PREMASE_CLOSED_MESSAGE = "Buy projects is launching soon. It will be open here shortly.";

/**
 * The Buy projects area is locked until it is opened from the admin panel.
 * The flag lives in the same public-readable settings row as website
 * availability, so every checkout path can be checked on the server.
 */
function createPublishableReadClient() {
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

export const listCatalogPricing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ environment: z.enum(["sandbox", "live"]) }).parse(input))
  .handler(async ({ data, context }): Promise<CatalogPricing[]> => {
    await assertPremadeOpen();
    const { data: rows, error } = await context.supabase
      .from("project_catalog_pricing")
      .select("catalog_project_id,regular_price_minor,discount_percent")
      .eq("environment", data.environment)
      .eq("is_active", true);
    if (error) throw new Error("Project prices could not be loaded.");
    return (rows ?? []).map((row) => ({
      catalogProjectId: row.catalog_project_id,
      regularPriceMinor: row.regular_price_minor,
      discountPercent: row.discount_percent,
      salePriceMinor: Math.round(row.regular_price_minor * (100 - row.discount_percent) / 100),
    }));
  });

export const getCatalogPricing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1), environment: z.enum(["sandbox", "live"]) }).parse(input))
  .handler(async ({ data, context }): Promise<CatalogPricing | null> => {
    await assertPremadeOpen();
    const { data: row, error } = await context.supabase
      .from("project_catalog_pricing")
      .select("catalog_project_id,regular_price_minor,discount_percent")
      .eq("catalog_project_id", data.id)
      .eq("environment", data.environment)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error("Project pricing could not be loaded.");
    return row ? {
      catalogProjectId: row.catalog_project_id,
      regularPriceMinor: row.regular_price_minor,
      discountPercent: row.discount_percent,
      salePriceMinor: Math.round(row.regular_price_minor * (100 - row.discount_percent) / 100),
    } : null;
  });

export const resolveProjectPrice = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ priceId: z.string().min(1), environment: z.enum(["sandbox", "live"]) }).parse(input),
  )
  .handler(async ({ data }) => {
    if (isPremadePriceId(data.priceId)) await assertPremadeOpen();
    const response = await gatewayFetch(
      data.environment as PaddleEnv,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    if (!response.ok) throw new Error("This project price is unavailable.");
    const result = (await response.json()) as { data?: Array<{ id: string }> };
    const price = result.data?.[0];
    if (!price) throw new Error("This project price is unavailable.");
    return price.id;
  });

export const getProjectPurchase = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().min(1), environment: z.enum(["sandbox", "live"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!getPremadeProject(data.id)) return { owned: false, projectId: null };
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
