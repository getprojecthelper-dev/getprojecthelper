import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateJson, obj, str, strArray } from "@/lib/ai.server";

export interface DocAuthor {
  name: string;
  affiliation: string;
  email: string;
  role: string;
}

export interface DocSection {
  heading: string;
  body: string;
}

export interface GeneratedDocument {
  id: string;
  project_id: string | null;
  doc_type: string;
  format: string;
  title: string;
  authors: DocAuthor[];
  meta: Record<string, string>;
  sections: DocSection[];
  latex: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const authorSchema = z.object({
  name: z.string().trim().min(1).max(120),
  affiliation: z.string().trim().max(200).default(""),
  email: z.string().trim().max(160).default(""),
  role: z.string().trim().max(80).default("Author"),
});

/** Compact snapshot of one project used as source material for the writer. */
async function projectSource(
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
    supabase.from("requirements").select("code,title,description,status").eq("project_id", projectId),
    supabase.from("test_cases").select("title,status,expected").eq("project_id", projectId),
    supabase.from("research_sources").select("title,authors,year,url,summary").eq("project_id", projectId),
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
    ...(requirements.data ?? []).map((r: any) => `- [${r.status}] ${r.code ?? ""} ${r.title}: ${r.description ?? ""}`),
    "",
    "TESTS:",
    ...(tests.data ?? []).map((t: any) => `- [${t.status}] ${t.title}: ${t.expected ?? ""}`),
    "",
    "REFERENCES COLLECTED:",
    ...(sources.data ?? []).map((s: any) => `- ${s.authors ?? ""} (${s.year ?? "n.d."}). ${s.title}. ${s.url ?? ""}`),
  ];

  return lines.filter(Boolean).join("\n").slice(0, 14000);
}

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<GeneratedDocument[]> => {
    const { data: rows, error } = await context.supabase
      .from("documents")
      .select("*")
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("documents list failed", error);
      throw new Error("We couldn't load your documents.");
    }
    return (rows ?? []) as unknown as GeneratedDocument[];
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("documents").delete().eq("id", data.id);
    if (error) throw new Error("That document couldn't be deleted.");
    return { ok: true };
  });

/**
 * Writes a full academic document from the student's project data and renders
 * it into the LaTeX class of the chosen template (IEEE, ACM, Springer, …).
 */
export const generateDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        docType: z.string().min(2).max(40),
        docTypeLabel: z.string().min(2).max(80),
        format: z.string().min(2).max(40),
        formatLabel: z.string().min(2).max(120),
        formatBrief: z.string().max(600).default(""),
        title: z.string().trim().min(3).max(300),
        authors: z.array(authorSchema).min(1).max(8),
        venue: z.string().trim().max(200).default(""),
        keywords: z.string().trim().max(300).default(""),
        notes: z.string().trim().max(2000).default(""),
        importedProjectIds: z.array(z.string().uuid()).max(3).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<GeneratedDocument> => {
    const supabase = context.supabase as unknown as { from: (t: string) => any };

    const primary = await projectSource(supabase, data.projectId);
    if (!primary) throw new Error("Project not found.");
    const imported = (
      await Promise.all(
        data.importedProjectIds
          .filter((id) => id !== data.projectId)
          .map((id) => projectSource(supabase, id)),
      )
    ).filter((v): v is string => Boolean(v));

    const authorLine = data.authors
      .map((a) => `${a.name} (${a.role || "Author"}${a.affiliation ? `, ${a.affiliation}` : ""}${a.email ? `, ${a.email}` : ""})`)
      .join("; ");

    const result = await generateJson<{
      title: string;
      sections: DocSection[];
      keywords: string[];
      latex: string;
    }>({
      usage: { userId: context.userId, projectId: data.projectId, feature: "generate_document" },
      name: "academic_document",
      instructions: `You are an academic writing assistant for students. You write a complete ${data.docTypeLabel} in the ${data.formatLabel} template. ${data.formatBrief}
Rules:
- Use ONLY the student's real project data supplied below; never invent results that contradict it. If data is missing, write it in a clearly generic but plausible academic way.
- Write full, publishable prose (not bullet fragments) — each section several paragraphs where appropriate.
- Sections must follow the conventions of a ${data.docTypeLabel} in this template.
- The "latex" field must be a COMPLETE, compile-ready LaTeX document for Overleaf using the correct document class and preamble for ${data.formatLabel}, including title, authors with affiliations, abstract, all sections, and a bibliography (thebibliography environment with the references used). Escape LaTeX special characters properly.`,
      input: `Document type: ${data.docTypeLabel}
Template/format: ${data.formatLabel}
Working title: ${data.title}
Authors / members: ${authorLine}
Target venue: ${data.venue || "not specified"}
Author-supplied keywords: ${data.keywords || "none — propose your own"}
Extra instructions from the student: ${data.notes || "none"}

=== PRIMARY PROJECT ===
${primary}
${imported.length ? `\n=== ADDITIONAL IMPORTED PROJECTS ===\n${imported.join("\n\n---\n\n")}` : ""}

Return the polished document.`,
      schema: obj({
        title: str,
        keywords: strArray,
        sections: {
          type: "array",
          items: obj({ heading: str, body: str }),
        },
        latex: str,
      }),
    });

    const { data: row, error } = await context.supabase
      .from("documents")
      .insert({
        user_id: context.userId,
        project_id: data.projectId,
        doc_type: data.docType,
        format: data.format,
        title: result.title || data.title,
        authors: data.authors,
        meta: {
          format_label: data.formatLabel,
          doc_type_label: data.docTypeLabel,
          venue: data.venue,
          keywords: (result.keywords ?? []).join(", ") || data.keywords,
          notes: data.notes,
        },
        sections: result.sections,
        latex: result.latex,
        status: "ready",
      })
      .select("*")
      .single();

    if (error || !row) {
      console.error("document save failed", error);
      throw new Error("The document was written but couldn't be saved.");
    }
    return row as unknown as GeneratedDocument;
  });
