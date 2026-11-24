import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin-codes";

const supportRequestSchema = z.object({
  kind: z.enum(["contact", "issue", "grievance"]),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(10).max(5000),
  pageUrl: z.string().url().max(2000).optional(),
  turnstileToken: z.string().min(1).max(2048),
});

export type SupportRequest = {
  id: string;
  kind: "contact" | "issue" | "grievance";
  name: string;
  email: string;
  subject: string;
  message: string;
  pageUrl: string | null;
  status: "new" | "reviewing" | "resolved";
  createdAt: string;
};

export const submitSupportRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => supportRequestSchema.parse(input))
  .handler(async ({ data }) => {
    const { verifyTurnstileToken, turnstileHostname } = await import("./turnstile.server");
    const { getRequestHeader, getRequestUrl } = await import("@tanstack/react-start/server");
    await verifyTurnstileToken(data.turnstileToken, {
      secret: process.env["TURNSTILE_SECRET_KEY"], action: data.kind,
      hostname: turnstileHostname(getRequestUrl().href), ip: getRequestHeader("cf-connecting-ip") ?? null,
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("support_requests").insert({
      kind: data.kind,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      page_url: data.pageUrl ?? null,
    });
    if (error) throw new Error("Your request could not be sent. Please try again.");
    return { ok: true };
  });

export const listSupportRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SupportRequest[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("support_requests")
      .select("id,kind,name,email,subject,message,page_url,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error("Support requests could not be loaded.");
    return (data ?? []).map((row) => ({
      id: row.id,
      kind: row.kind as SupportRequest["kind"],
      name: row.name,
      email: row.email,
      subject: row.subject,
      message: row.message,
      pageUrl: row.page_url,
      status: row.status as SupportRequest["status"],
      createdAt: row.created_at,
    }));
  });
