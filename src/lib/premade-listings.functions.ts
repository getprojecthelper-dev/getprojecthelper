import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin-codes";

export interface PremadeListing {
  id: string;
  title: string;
  description: string;
  techStack: string;
  imageUrl: string | null;
  domain: "software" | "data_science" | "project_management";
  priceMinor: number;
  providerPriceId: string | null;
  isLive: boolean;
  isAvailable: boolean;
}

const env = z.enum(["sandbox", "live"]);
const COLUMNS = "id,title,description,tech_stack,image_url,domain,price_minor,provider_price_id,is_live,is_available";

type Row = {
  id: string; title: string; description: string; tech_stack: string; image_url: string | null;
  domain: string; price_minor: number; provider_price_id: string | null; is_live: boolean; is_available: boolean;
};

const toListing = (r: Row): PremadeListing => ({
  id: r.id,
  title: r.title,
  description: r.description,
  techStack: r.tech_stack,
  imageUrl: r.image_url,
  domain: r.domain as PremadeListing["domain"],
  priceMinor: r.price_minor,
  providerPriceId: r.provider_price_id,
  isLive: r.is_live,
  isAvailable: r.is_available,
});

const listingInput = z.object({
  id: z.string().uuid().optional(),
  environment: env,
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(4000),
  techStack: z.string().trim().min(1).max(300),
  // Small, client-resized image stored as a data URL.
  imageUrl: z.string().max(900_000).nullable(),
  domain: z.enum(["software", "data_science", "project_management"]),
  priceMinor: z.number().int().min(70).max(10_000_000),
});

/** Students: live listings only (RLS also enforces this). */
export const listLiveListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ environment: env }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("premade_listings").select(COLUMNS)
      .eq("environment", data.environment).eq("is_live", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Projects could not be loaded.");
    return (rows ?? []).map(toListing);
  });

export const getLiveListing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("premade_listings").select(COLUMNS).eq("id", data.id).eq("is_live", true).maybeSingle();
    return row ? toListing(row) : null;
  });

export const listAdminListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ environment: env }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("premade_listings").select(COLUMNS)
      .eq("environment", data.environment).order("created_at", { ascending: false });
    if (error) throw new Error("Listings could not be loaded.");
    return (rows ?? []).map(toListing);
  });

/** Create or edit a listing; keeps a matching one-time checkout price in INR. */
export const saveListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => listingInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { gatewayFetch } = await import("@/lib/paddle.server");
    const fields = {
      title: data.title,
      description: data.description,
      tech_stack: data.techStack,
      image_url: data.imageUrl,
      domain: data.domain,
      price_minor: data.priceMinor,
    };

    let existing: Row | null = null;
    if (data.id) {
      const { data: row } = await context.supabase.from("premade_listings").select(COLUMNS).eq("id", data.id).maybeSingle();
      existing = row;
      if (!existing) throw new Error("Listing not found.");
    }

    let priceId = existing?.provider_price_id ?? null;
    if (!priceId) {
      const product = await gatewayFetch(data.environment, "/products", {
        method: "POST",
        body: JSON.stringify({ name: data.title, tax_category: "standard", description: data.description.slice(0, 500) }),
      });
      if (!product.ok) throw new Error("The checkout product could not be created.");
      const productId = ((await product.json()) as { data: { id: string } }).data.id;
      const price = await gatewayFetch(data.environment, "/prices", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          description: "One-time purchase",
          unit_price: { amount: String(data.priceMinor), currency_code: "INR" },
          quantity: { minimum: 1, maximum: 1 },
        }),
      });
      if (!price.ok) throw new Error("The checkout price could not be created.");
      priceId = ((await price.json()) as { data: { id: string } }).data.id;
    } else if (existing && existing.price_minor !== data.priceMinor) {
      const res = await gatewayFetch(data.environment, `/prices/${priceId}`, {
        method: "PATCH",
        body: JSON.stringify({ unit_price: { amount: String(data.priceMinor), currency_code: "INR" } }),
      });
      if (!res.ok) throw new Error("The checkout price could not be updated.");
    }

    const query = existing
      ? context.supabase.from("premade_listings").update({ ...fields, provider_price_id: priceId }).eq("id", existing.id)
      : context.supabase.from("premade_listings").insert({ ...fields, provider_price_id: priceId, environment: data.environment });
    const { data: saved, error } = await query.select(COLUMNS).single();
    if (error || !saved) throw new Error("The listing could not be saved.");
    return toListing(saved);
  });

export const setListingFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), isLive: z.boolean().optional(), isAvailable: z.boolean().optional() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: { is_live?: boolean; is_available?: boolean } = {};
    if (data.isLive !== undefined) patch.is_live = data.isLive;
    if (data.isAvailable !== undefined) patch.is_available = data.isAvailable;
    const { data: row, error } = await context.supabase
      .from("premade_listings").update(patch).eq("id", data.id).select(COLUMNS).single();
    if (error || !row) throw new Error("The listing could not be updated.");
    return toListing(row);
  });

export const deleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("premade_listings").delete().eq("id", data.id);
    if (error) throw new Error("The listing could not be deleted.");
    return { ok: true };
  });
