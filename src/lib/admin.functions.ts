import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertAdmin,
  randomReferralCode,
  toReferralRow,
  type ReferralCodeRow,
} from "@/lib/admin-codes.server";

export type { ReferralCodeRow };

export interface AdminStats {
  users: { total: number; last7d: number; last30d: number };
  projects: { total: number; active: number };
  ai: { credits: number; calls: number; tokens: number; byFeature: { feature: string; credits: number; calls: number }[]; daily: { day: string; credits: number }[] };
  subscriptions: { active: number; total: number; mrrCents: number; byPlan: { plan: string; count: number }[] };
  recentUsers: { id: string; email: string; name: string | null; created_at: string }[];
}


export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminStats> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin !== true) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = Date.now();
    const iso = (daysAgo: number) => new Date(now - daysAgo * 86_400_000).toISOString();

    const [profiles, projects, usage, subs] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("projects").select("id, status"),
      supabaseAdmin.from("ai_usage_events").select("feature, credits, total_tokens, created_at"),
      supabaseAdmin.from("subscriptions").select("plan, status, amount_cents"),
    ]);

    const profileRows = profiles.data ?? [];
    const usageRows = usage.data ?? [];
    const subRows = subs.data ?? [];
    const projectRows = projects.data ?? [];

    // Emails live in auth, not in profiles.
    const emails = new Map<string, string>();
    try {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      for (const u of authUsers?.users ?? []) if (u.email) emails.set(u.id, u.email);
    } catch {
      // listing users is best-effort
    }

    const featureMap = new Map<string, { credits: number; calls: number }>();
    const dayMap = new Map<string, number>();
    let credits = 0;
    let tokens = 0;
    for (const row of usageRows) {
      const c = Number(row.credits ?? 0);
      credits += c;
      tokens += row.total_tokens ?? 0;
      const f = featureMap.get(row.feature) ?? { credits: 0, calls: 0 };
      featureMap.set(row.feature, { credits: f.credits + c, calls: f.calls + 1 });
      const day = String(row.created_at).slice(0, 10);
      dayMap.set(day, (dayMap.get(day) ?? 0) + c);
    }

    const daily: { day: string; credits: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = iso(i).slice(0, 10);
      daily.push({ day, credits: Number((dayMap.get(day) ?? 0).toFixed(2)) });
    }

    const planMap = new Map<string, number>();
    let mrrCents = 0;
    let activeSubs = 0;
    for (const s of subRows) {
      if (s.status === "active" || s.status === "trialing") {
        activeSubs += 1;
        mrrCents += s.amount_cents ?? 0;
        planMap.set(s.plan, (planMap.get(s.plan) ?? 0) + 1);
      }
    }

    const since7 = iso(7);
    const since30 = iso(30);

    return {
      users: {
        total: profileRows.length,
        last7d: profileRows.filter((p) => p.created_at >= since7).length,
        last30d: profileRows.filter((p) => p.created_at >= since30).length,
      },
      projects: {
        total: projectRows.length,
        active: projectRows.filter((p) => p.status === "active").length,
      },
      ai: {
        credits: Number(credits.toFixed(2)),
        calls: usageRows.length,
        tokens,
        byFeature: [...featureMap.entries()]
          .map(([feature, v]) => ({ feature, credits: Number(v.credits.toFixed(2)), calls: v.calls }))
          .sort((a, b) => b.credits - a.credits),
        daily,
      },
      subscriptions: {
        active: activeSubs,
        total: subRows.length,
        mrrCents,
        byPlan: [...planMap.entries()].map(([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count),
      },
      recentUsers: profileRows.slice(0, 10).map((p) => ({
        id: p.id,
        email: emails.get(p.id) ?? "—",
        name: p.full_name,
        created_at: p.created_at,
      })),
    };
  });

export const listReferralCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReferralCodeRow[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("referral_codes")
      .select("id,code,credits,label,max_redemptions,redemption_count,expires_at,is_active,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []).map(toRow);
  });

export const createReferralCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string().trim().min(3).max(40).optional(),
        credits: z.number().min(1).max(100000),
        label: z.string().trim().max(120).optional(),
        maxRedemptions: z.number().int().min(1).max(100000).nullable().optional(),
        expiresAt: z.string().trim().min(1).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<ReferralCodeRow> => {
    await assertAdmin(context);

    const code = (data.code?.toUpperCase().replace(/\s+/g, "") || randomReferralCode()).slice(0, 40);

    const { data: row, error } = await context.supabase
      .from("referral_codes")
      .insert({
        code,
        credits: data.credits,
        label: data.label || null,
        max_redemptions: data.maxRedemptions ?? null,
        expires_at: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
        created_by: context.userId,
      })
      .select("id,code,credits,label,max_redemptions,redemption_count,expires_at,is_active,created_at")
      .single();

    if (error) {
      if (/duplicate|unique/i.test(error.message)) throw new Error("That code already exists.");
      throw new Error(error.message);
    }
    return toReferralRow(row);
  });

export const setReferralCodeActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("referral_codes")
      .update({ is_active: data.isActive })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
