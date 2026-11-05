import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin-codes";

export const updateSiteAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ maintenanceEnabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: saved, error } = await context.supabase.from("site_availability")
      .update({ maintenance_enabled: data.maintenanceEnabled })
      .eq("id", true).select("maintenance_enabled").single();
    if (error) throw new Error("Website availability could not be saved. Please try again.");
    return saved.maintenance_enabled;
  });

export const updatePremadeAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ premadeEnabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: saved, error } = await context.supabase.from("site_availability")
      .update({ premade_enabled: data.premadeEnabled })
      .eq("id", true).select("premade_enabled").single();
    if (error) throw new Error("Project store availability could not be saved. Please try again.");
    return saved.premade_enabled;
  });