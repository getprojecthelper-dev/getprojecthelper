export interface ReferralCodeRow {
  id: string;
  code: string;
  credits: number;
  label: string | null;
  max_redemptions: number | null;
  redemption_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (isAdmin !== true) throw new Error("Forbidden");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toReferralRow = (r: any): ReferralCodeRow => ({
  id: r.id,
  code: r.code,
  credits: Number(r.credits ?? 0),
  label: r.label ?? null,
  max_redemptions: r.max_redemptions ?? null,
  redemption_count: r.redemption_count ?? 0,
  expires_at: r.expires_at ?? null,
  is_active: !!r.is_active,
  created_at: r.created_at,
});

export function randomReferralCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `PH-${out}`;
}
