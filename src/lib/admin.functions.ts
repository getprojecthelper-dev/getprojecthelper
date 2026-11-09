import { computeProgress, type ProjectSignals } from "@/lib/project-domain";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertAdmin,
  randomReferralCode,
  toReferralRow,
  type ReferralCodeRow,
} from "@/lib/admin-codes";

export type { ReferralCodeRow };

export interface AdminStats {
  users: { total: number; last7d: number; last30d: number };
  projects: { total: number; active: number };
  ai: { credits: number; calls: number; tokens: number; byFeature: { feature: string; credits: number; calls: number }[]; daily: { day: string; credits: number }[]; weekly: { day: string; credits: number }[]; monthly: { day: string; credits: number }[] };
  users_list: { id: string; name: string | null; email: string; createdAt: string; credits: number; plan: string | null; projects: number }[];
  topUsers: { id: string; name: string | null; email: string; credits: number; tokens: number; calls: number }[];
  subscriptions: { active: number; total: number; mrrCents: number; byPlan: { plan: string; count: number }[] };
  recentUsers: { id: string; email: string; name: string | null; created_at: string }[];
  userProjects: {
    id: string;
    name: string;
    domain: string;
    status: string;
    currentStage: string;
    updatedAt: string;
    ownerId: string;
    ownerName: string | null;
    ownerEmail: string;
    progress: number;
    isMine: boolean;
  }[];
}


export type AdminStatsResult = { forbidden: true } | ({ forbidden: false } & AdminStats);

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminStatsResult> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin !== true) return { forbidden: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = Date.now();
    const iso = (daysAgo: number) => new Date(now - daysAgo * 86_400_000).toISOString();

    const [profiles, projects, usage, subs] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }),
      supabaseAdmin
        .from("projects")
        .select("id, user_id, name, domain, status, current_stage, updated_at")
        .order("updated_at", { ascending: false }),
      supabaseAdmin.from("ai_usage_events").select("user_id, feature, credits, total_tokens, created_at"),
      supabaseAdmin.from("subscriptions").select("user_id, plan, status, amount_cents"),
    ]);
    const [buildRows, taskRows, reqRows, testRows, docRows, roleRows] = await Promise.all([
      supabaseAdmin.from("build_sections").select("project_id, status"),
      supabaseAdmin.from("tasks").select("project_id, status"),
      supabaseAdmin.from("requirements").select("project_id, status"),
      supabaseAdmin.from("test_cases").select("project_id, status"),
      supabaseAdmin.from("document_sections").select("project_id, status"),
      supabaseAdmin.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);
    const adminIds = new Set((roleRows.data ?? []).map((r) => r.user_id));
    const rowsFor = <T extends { project_id: string }>(rows: T[] | null, id: string) =>
      (rows ?? []).filter((r) => r.project_id === id);
    const progressOf = (id: string) => {
      const sections = rowsFor(buildRows.data, id);
      if (sections.length)
        return Math.round((sections.filter((x) => x.status === "confirmed").length / sections.length) * 100);
      return computeProgress({
        tasks: rowsFor(taskRows.data, id).map((t) => ({ title: "", status: t.status, due_date: null, priority: "" })),
        requirements: rowsFor(reqRows.data, id).map((r) => ({ status: r.status })),
        tests: rowsFor(testRows.data, id).map((t) => ({ status: t.status })),
        docSections: rowsFor(docRows.data, id).map((d) => ({ status: d.status })),
        risks: [],
        deadline: null,
      } as ProjectSignals);
    };
    // Administrator emails are never shown in the console.
    const emailFor = (id: string) => (adminIds.has(id) ? "Hidden" : (emails.get(id) ?? "—"));

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
    const userUsage = new Map<string, { credits: number; tokens: number; calls: number }>();
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
      const u = userUsage.get(row.user_id) ?? { credits: 0, tokens: 0, calls: 0 };
      userUsage.set(row.user_id, { credits: u.credits + c, tokens: u.tokens + (row.total_tokens ?? 0), calls: u.calls + 1 });
    }
    const r2 = (n: number) => Number(n.toFixed(2));
    const sumRange = (from: string, to: string) =>
      [...dayMap.entries()].filter(([d]) => d >= from && d < to).reduce((t, [, v]) => t + v, 0);
    const weekly: { day: string; credits: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const from = iso(i * 7 + 6).slice(0, 10);
      const to = iso(i * 7 - 1).slice(0, 10);
      weekly.push({ day: from, credits: r2(sumRange(from, to)) });
    }
    const monthly: { day: string; credits: number }[] = [];
    const nowD = new Date(now);
    for (let i = 11; i >= 0; i--) {
      const m = new Date(Date.UTC(nowD.getUTCFullYear(), nowD.getUTCMonth() - i, 1));
      const key = m.toISOString().slice(0, 7);
      const total = [...dayMap.entries()].filter(([d]) => d.startsWith(key)).reduce((t, [, v]) => t + v, 0);
      monthly.push({ day: key, credits: r2(total) });
    }

    const daily: { day: string; credits: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = iso(i).slice(0, 10);
      daily.push({ day, credits: Number((dayMap.get(day) ?? 0).toFixed(2)) });
    }

    const planMap = new Map<string, number>();
    let mrrCents = 0;
    let activeSubs = 0;
    const activePlan = new Map<string, string>();
    for (const s of subRows) {
      if (s.status === "active" || s.status === "trialing") {
        activeSubs += 1;
        mrrCents += s.amount_cents ?? 0;
        planMap.set(s.plan, (planMap.get(s.plan) ?? 0) + 1);
        activePlan.set(s.user_id, s.plan);
      }
    }

    const since7 = iso(7);
    const since30 = iso(30);

    return {
      forbidden: false,
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
        weekly,
        monthly,
      },
      users_list: profileRows.map((p) => ({
        id: p.id,
        name: p.full_name,
        email: emailFor(p.id),
        createdAt: p.created_at,
        credits: r2(userUsage.get(p.id)?.credits ?? 0),
        plan: activePlan.get(p.id) ?? null,
        projects: projectRows.filter((x) => x.user_id === p.id).length,
      })),
      topUsers: [...userUsage.entries()]
        .sort((a, b) => b[1].credits - a[1].credits)
        .slice(0, 10)
        .map(([id, v]) => ({
          id,
          name: profileRows.find((p) => p.id === id)?.full_name ?? null,
          email: emailFor(id),
          credits: r2(v.credits),
          tokens: v.tokens,
          calls: v.calls,
        })),
      subscriptions: {
        active: activeSubs,
        total: subRows.length,
        mrrCents,
        byPlan: [...planMap.entries()].map(([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count),
      },
      recentUsers: profileRows.slice(0, 10).map((p) => ({
        id: p.id,
        email: emailFor(p.id),
        name: p.full_name,
        created_at: p.created_at,
      })),
      userProjects: projectRows.slice(0, 50).map((p) => {
        const owner = profileRows.find((profile) => profile.id === p.user_id);
        return {
          id: p.id,
          name: p.name,
          domain: p.domain,
          status: p.status,
          currentStage: p.current_stage,
          updatedAt: p.updated_at,
          ownerId: p.user_id,
          ownerName: owner?.full_name ?? null,
          ownerEmail: emailFor(p.user_id),
          progress: progressOf(p.id),
          isMine: p.user_id === context.userId,
        };
      }),
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
    return (data ?? []).map(toReferralRow);
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

export interface ModelUsageGroup {
  key: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
}
export type ModelUsageResult =
  | { forbidden: true }
  | {
      forbidden: false;
      totals: ModelUsageGroup;
      byFeature: ModelUsageGroup[];
      byModel: ModelUsageGroup[];
      byDay: ModelUsageGroup[];
    };

/** Developer-only token tracker: raw input/output tokens per feature, model and day. */
export const getModelUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ window: z.enum(["1d", "7d", "30d", "all"]).default("7d") }).parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<ModelUsageResult> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin !== true) return { forbidden: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const days = { "1d": 1, "7d": 7, "30d": 30, all: 0 }[data.window];
    let q = supabaseAdmin
      .from("ai_usage_events")
      .select("feature, model, input_tokens, output_tokens, created_at")
      .order("created_at", { ascending: false })
      .limit(20000);
    if (days) q = q.gte("created_at", new Date(Date.now() - days * 86_400_000).toISOString());
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const { groupUsage } = await import("@/lib/model-cost");
    return { forbidden: false, ...groupUsage(rows ?? []) };
  });
