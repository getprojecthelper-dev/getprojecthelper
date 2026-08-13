/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";

export const authorSchema = z.object({
  name: z.string().trim().min(1).max(120),
  affiliation: z.string().trim().max(200).default(""),
  email: z.string().trim().max(160).default(""),
  role: z.string().trim().max(80).default("Author"),
});

export const sectionSchema = z.object({
  heading: z.string().trim().min(1).max(200),
  body: z.string().max(40000).default(""),
});

/** Compact snapshot of one project used as source material for the writer. */
export async function projectSource(
  supabase: { from: (table: string) => any },
  projectId: string,
): Promise<string | null> {
  const [project, sections, requirements, tests, sources] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
    supabase
      .from("build_sections")
      .select("title,question,objective,business_connection,insights")
      .eq("project_id", projectId)
      .order("position"),
    supabase
      .from("requirements")
      .select("code,title,description,status")
      .eq("project_id", projectId),
    supabase.from("test_cases").select("title,status,expected").eq("project_id", projectId),
    supabase
      .from("research_sources")
      .select("title,authors,year,url,summary")
      .eq("project_id", projectId),
  ]);

  const p = project.data;
  if (!p) return null;

  const lines = [
    `PROJECT: ${p.name}`,
    `Domain: ${p.domain ?? "n/a"}`,
    `Description: ${p.description ?? "n/a"}`,
    `Idea: ${p.idea ?? "n/a"}`,
    `Tech stack: ${Array.isArray(p.tech_stack) ? p.tech_stack.join(", ") : "n/a"}`,
    p.dataset ? `Dataset: ${JSON.stringify(p.dataset).slice(0, 600)}` : "",
    "",
    "IMPLEMENTATION STEPS:",
    ...(sections.data ?? []).map(
      (s: any, i: number) =>
        `${i + 1}. ${s.title} — ${s.objective ?? s.question ?? ""} ${
          Array.isArray(s.insights) ? s.insights.slice(0, 3).join("; ") : ""
        }`,
    ),
    "",
    "REQUIREMENTS:",
    ...(requirements.data ?? []).map(
      (r: any) => `- [${r.status}] ${r.code ?? ""} ${r.title}: ${r.description ?? ""}`,
    ),
    "",
    "TESTS:",
    ...(tests.data ?? []).map((t: any) => `- [${t.status}] ${t.title}: ${t.expected ?? ""}`),
    "",
    "REFERENCES COLLECTED:",
    ...(sources.data ?? []).map(
      (s: any) => `- ${s.authors ?? ""} (${s.year ?? "n.d."}). ${s.title}. ${s.url ?? ""}`,
    ),
  ];

  return lines.filter(Boolean).join("\n").slice(0, 14000);
}
