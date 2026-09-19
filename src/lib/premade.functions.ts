import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPremadeProject } from "@/lib/premade-projects";
import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";

export interface CatalogPricing {
  catalogProjectId: string;
  regularPriceMinor: number;
  discountPercent: number;
  salePriceMinor: number;
}

export const listCatalogPricing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ environment: z.enum(["sandbox", "live"]) }).parse(input))
  .handler(async ({ data, context }): Promise<CatalogPricing[]> => {
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
