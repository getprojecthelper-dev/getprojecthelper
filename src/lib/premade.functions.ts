import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPremadeProject } from "@/lib/premade-projects";
import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";

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
