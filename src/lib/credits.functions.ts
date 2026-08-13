import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface CreditTransaction {
  id: string;
  delta: number;
  kind: string;
  feature: string | null;
  reason: string | null;
  status: string;
  created_at: string;
}

export interface CreditSummary {
  balance: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
  transactions: CreditTransaction[];
}

export const getMyCredits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CreditSummary> => {
    const { supabase, userId } = context;

    const { data: balance } = await supabase
      .from("credit_balances")
      .select("balance,lifetime_granted,lifetime_spent")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: rows } = await supabase
      .from("credit_transactions")
      .select("id,delta,kind,feature,reason,status,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    return {
      balance: Number(balance?.balance ?? 0),
      lifetimeGranted: Number(balance?.lifetime_granted ?? 0),
      lifetimeSpent: Number(balance?.lifetime_spent ?? 0),
      transactions: ((rows ?? []) as CreditTransaction[]).map((r) => ({
        ...r,
        delta: Number(r.delta),
      })),
    };
  });

export const redeemCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().trim().min(3).max(40) }).parse(input),
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{ ok: true; credits: number } | { ok: false; message: string }> => {
      const { data: granted, error } = await context.supabase.rpc("redeem_referral_code", {
        _code: data.code.toUpperCase(),
      });

      if (error) {
        // Expected, user-facing rejections (inactive/expired/already used) are
        // returned as data — throwing here surfaces a runtime error overlay.
        const message = (error.message ?? "").trim();
        return { ok: false, message: message || "That code is not valid." };
      }

      return { ok: true, credits: Number(granted ?? 0) };
    },
  );

/**
 * The real amount the ledger charged for the most recent run started after
 * `since`. The meter uses it so the UI never reports the reserved estimate.
 */
export const getLastCharge = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ since: z.string() }).parse(input))
  .handler(async ({ data, context }): Promise<{ charged: number | null }> => {
    const { data: row } = await context.supabase
      .from("credit_transactions")
      .select("delta,status,created_at")
      .eq("user_id", context.userId)
      .in("status", ["settled", "released"])
      .gte("created_at", data.since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) return { charged: null };
    return { charged: Math.abs(Number(row.delta)) };
  });
