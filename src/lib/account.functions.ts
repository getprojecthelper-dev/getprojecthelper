import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";

/** Permanently removes the signed-in user's account and app data. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ confirmation: z.literal("DELETE") }).parse(input))
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
      .from("subscriptions")
      .select("paddle_subscription_id, environment, status")
      .eq("user_id", userId);

    if (subscriptionsError)
      throw new Error("We couldn't verify your subscriptions. Your account was not deleted.");

    for (const subscription of subscriptions ?? []) {
      const id = subscription.paddle_subscription_id;
      const status = subscription.status.toLowerCase();
      const environment = subscription.environment;
      if (!id || !["active", "trialing", "past_due", "paused"].includes(status)) continue;
      if (environment !== "sandbox" && environment !== "live") {
        throw new Error(
          "We couldn't verify your billing environment. Your account was not deleted.",
        );
      }

      let response: Response;
      try {
        response = await gatewayFetch(environment as PaddleEnv, `/subscriptions/${id}/cancel`, {
          method: "POST",
          body: JSON.stringify({ effective_from: "immediately" }),
        });
      } catch {
        throw new Error(
          "We couldn't cancel your active subscription. Your account was not deleted.",
        );
      }
      if (!response.ok) {
        throw new Error(
          "We couldn't cancel your active subscription. Your account was not deleted.",
        );
      }
    }

    // These tables keep user IDs without auth.users foreign keys, so remove
    // their rows explicitly. Project-owned rows cascade when projects go.
    const ownedRows: Array<[string, "user_id" | "id"]> = [
      ["documents", "user_id"],
      ["ai_usage_events", "user_id"],
      ["credit_transactions", "user_id"],
      ["credit_balances", "user_id"],
      ["code_redemptions", "user_id"],
      ["project_purchases", "user_id"],
      ["subscriptions", "user_id"],
      ["user_roles", "user_id"],
      ["projects", "user_id"],
      ["profiles", "id"],
    ];

    for (const [table, column] of ownedRows) {
      const { error } = await supabaseAdmin
        .from(table as never)
        .delete()
        .eq(column as never, userId);
      if (error)
        throw new Error("We couldn't finish removing your account data. Please contact support.");
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Account auth deletion failed after data cleanup", deleteError);
      throw new Error(
        "Your account data was removed, but account closure did not finish. Please contact support.",
      );
    }

    return { ok: true };
  });
