/**
 * Server-only helpers for the AI Mentor chat: bearer-token auth for the raw
 * streaming route, and a compact snapshot of the student's real project state
 * that gets injected into the mentor's system prompt.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

type Db = SupabaseClient<Database>;

function isNewKey(value: string) {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

/** Authenticates a raw HTTP request with the caller's Supabase bearer token. */
export async function authenticateRequest(
  request: Request,
): Promise<{ supabase: Db; userId: string }> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Backend is not configured.");

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || token.split(".").length !== 3) throw new Error("Unauthorized");

  const supabase = createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (isNewKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) throw new Error("Unauthorized");
  return { supabase, userId: data.claims.sub as string };
}

const cut = (value: string | null | undefined, max = 240) =>
  !value ? "" : value.length > max ? `${value.slice(0, max)}…` : value;

function list(title: string, rows: string[], max = 20): string {
  if (!rows.length) return `${title}: none recorded yet.`;
  const shown = rows.slice(0, max);
  const extra = rows.length - shown.length;
  return `${title} (${rows.length}):\n${shown.map((r) => `- ${r}`).join("\n")}${
    extra > 0 ? `\n- …and ${extra} more` : ""
  }`;
}

/**
 * Builds a bounded plain-text snapshot of the project so the mentor answers
 * from the student's real plan, requirements and results.
 */
export async function buildProjectContext(supabase: Db, projectId: string): Promise<string | null> {
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return null;

  const [sections, tasks, requirements, tests, experiments, docs, risks] = await Promise.all([
    supabase
      .from("build_sections")
      .select("position,title,kind,status,objective")
      .eq("project_id", projectId)
      .order("position"),
    supabase.from("tasks").select("title,status,priority,due_date").eq("project_id", projectId),
    supabase.from("requirements").select("code,title,status,priority").eq("project_id", projectId),
    supabase.from("test_cases").select("title,status,expected_result,actual_result").eq("project_id", projectId),
    supabase
      .from("experiments")
      .select("name,model,metrics,results")
      .eq("project_id", projectId),
    supabase.from("document_sections").select("title,status").eq("project_id", projectId),
    supabase.from("risks").select("title,severity,status").eq("project_id", projectId),
  ]);

  const dataset = project.dataset as { name?: string; url?: string } | null;
  const stack = Array.isArray(project.tech_stack) ? (project.tech_stack as string[]) : [];

  const blocks = [
    `PROJECT: ${project.name}`,
    `Idea: ${cut(project.idea ?? project.description, 600) || "not written yet"}`,
    `Domain: ${project.domain} | Type: ${project.project_type ?? "—"} | Level: ${
      project.academic_level ?? "—"
    }`,
    `Stage: ${project.current_stage} | Status: ${project.status} | Deadline: ${
      project.deadline ?? "none set"
    }`,
    `Tech stack: ${stack.length ? stack.join(", ") : "not decided"}`,
    `Dataset: ${dataset?.name ? `${dataset.name}${dataset.url ? ` (${dataset.url})` : ""}` : "none selected"}`,
    list(
      "Implementation steps",
      (sections.data ?? []).map(
        (s) => `${s.position}. ${s.title} [${s.status}]${s.objective ? ` — ${cut(s.objective, 120)}` : ""}`,
      ),
      15,
    ),
    list(
      "Tasks",
      (tasks.data ?? []).map(
        (t) => `${t.title} [${t.status}${t.due_date ? `, due ${t.due_date}` : ""}]`,
      ),
    ),
    list(
      "Requirements",
      (requirements.data ?? []).map((r) => `${r.code} ${r.title} [${r.status}/${r.priority}]`),
    ),
    list(
      "Test cases",
      (tests.data ?? []).map(
        (t) =>
          `${t.title} [${t.status}]${t.expected_result ? ` expected: ${cut(t.expected_result, 80)}` : ""}${
            t.actual_result ? ` actual: ${cut(t.actual_result, 80)}` : ""
          }`,
      ),
    ),
    list(
      "Experiments",
      (experiments.data ?? []).map(
        (e) =>
          `${e.name}${e.model ? ` (${e.model})` : ""}${e.metrics ? ` metrics: ${cut(e.metrics, 120)}` : ""}${
            e.results ? ` results: ${cut(e.results, 120)}` : ""
          }`,
      ),
      10,
    ),
    list(
      "Documentation sections",
      (docs.data ?? []).map((d) => `${d.title} [${d.status}]`),
    ),
    list(
      "Risks",
      (risks.data ?? []).map((r) => `${r.title} [${r.severity}/${r.status}]`),
      10,
    ),
  ];

  return blocks.join("\n\n");
}

export const MENTOR_SYSTEM = `You are the AI Mentor inside Project Helper, a senior academic project guide for students.

How you behave:
- You already know the student's project from the PROJECT CONTEXT below. Use it. Refer to their real steps, requirements, tests and numbers instead of generic advice.
- Be honest and challenge weak reasoning. If a claim is not supported by their evidence (for example "my accuracy is 95% so the model is excellent"), say why and name the exact check that would settle it.
- Be concrete and beginner friendly: short paragraphs, plain language, markdown headings and bullet lists, code only when it genuinely helps and kept simple and readable.
- Prefer the next best action. End with one clear suggestion of what to do next when it fits.
- If something is missing from their project (no tests, no dataset, no requirements), point that out rather than inventing it.
- Never claim to have run code or changed their project. You advise; the student acts.`;
