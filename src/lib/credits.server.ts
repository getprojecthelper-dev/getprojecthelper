/**
 * Server-only credit ledger access. The hold/settle/release SQL functions are
 * SECURITY DEFINER and only executable by the service role, so every call goes
 * through the admin client here — never from the browser.
 */

import { creditsForTokens, holdFor } from "@/lib/credit-costs";

export class InsufficientCreditsError extends Error {
  constructor() {
    super("You do not have enough AI credits left. Add credits or redeem a code to continue.");
    this.name = "InsufficientCreditsError";
  }
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Reserve credits for an upcoming AI run. Returns the hold id. */
export async function holdCredits(userId: string, feature: string): Promise<string> {
  const db = await admin();
  const { data, error } = await db.rpc("hold_credits", {
    _user_id: userId,
    _amount: holdFor(feature),
    _feature: feature,
  });
  if (error) {
    if (/insufficient/i.test(error.message)) throw new InsufficientCreditsError();
    throw new Error("Credits could not be reserved. Please try again.");
  }
  return data as unknown as string;
}

/** Charge the real cost of a finished run and refund the rest of the hold. */
export async function settleCredits(holdId: string, totalTokens: number): Promise<number> {
  const db = await admin();
  const actual = creditsForTokens(totalTokens);
  const { data, error } = await db.rpc("settle_credit_hold", { _hold_id: holdId, _actual: actual });
  if (error) {
    console.error("credit settlement failed", error);
    return actual;
  }
  return Number(data ?? actual);
}

/** Give the hold back when the run fails before producing anything. */
export async function releaseCredits(holdId: string): Promise<void> {
  try {
    const db = await admin();
    await db.rpc("release_credit_hold", { _hold_id: holdId });
  } catch (error) {
    console.error("credit release failed", error);
  }
}
