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
        authors: data.authors as unknown as never,
        meta: {
          format_label: data.formatLabel,
          doc_type_label: data.docTypeLabel,
          venue: data.venue,
          keywords: (result.keywords ?? []).join(", ") || data.keywords,
          notes: data.notes,
        },
        sections: result.sections as unknown as never,
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

/* ------------------------------------------------------------------ */
/* Manual edit, AI revision and originality analysis                    */
/* ------------------------------------------------------------------ */

const sectionSchema = z.object({
  heading: z.string().trim().min(1).max(200),
  body: z.string().max(40000).default(""),
});

/** Saves manual edits made in the on-site editor. */
export const updateDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().trim().min(3).max(300),
        sections: z.array(sectionSchema).min(1).max(60),
        latex: z.string().max(200000).nullable().default(null),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<GeneratedDocument> => {
    const { data: row, error } = await context.supabase
      .from("documents")
      .update({
        title: data.title,
        sections: data.sections as unknown as never,
        latex: data.latex,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error || !row) {
      console.error("document update failed", error);
      throw new Error("Your changes couldn't be saved.");
    }
    return row as unknown as GeneratedDocument;
  });

/** Rewrites the paper according to the student's instructions. */
export const reviseDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        instructions: z.string().trim().min(3).max(4000),
        sectionHeading: z.string().trim().max(200).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<GeneratedDocument> => {
    const { data: doc, error: loadError } = await context.supabase
      .from("documents")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (loadError || !doc) throw new Error("Document not found.");

    const current = doc as unknown as GeneratedDocument;
    const source = current.project_id
      ? await projectSource(context.supabase as unknown as { from: (t: string) => any }, current.project_id)
      : null;

    const result = await generateJson<{ title: string; sections: DocSection[]; latex: string }>({
      usage: { userId: context.userId, projectId: current.project_id, feature: "revise_document" },
      name: "revised_document",
      instructions: `You revise an academic ${current.meta?.["doc_type_label"] ?? current.doc_type} written in the ${
        current.meta?.["format_label"] ?? current.format
      } template.
Rules:
- Apply the student's requested change faithfully; leave everything else intact.
- Keep the document strictly relevant to the student's real project data below — never drift to a different topic and never invent results that contradict it.
- Return the COMPLETE document (all sections, not just the edited one) and a COMPLETE compile-ready LaTeX source matching the same document class.`,
      input: `Requested change: ${data.instructions}
${data.sectionHeading ? `Focus section: ${data.sectionHeading}` : "Focus: whole document"}

=== CURRENT DOCUMENT ===
Title: ${current.title}
${current.sections.map((s) => `## ${s.heading}\n${s.body}`).join("\n\n")}

=== CURRENT LATEX ===
${(current.latex ?? "").slice(0, 20000)}

${source ? `=== PROJECT DATA (source of truth) ===\n${source}` : ""}`,
      schema: obj({
        title: str,
        sections: { type: "array", items: obj({ heading: str, body: str }) },
        latex: str,
      }),
    });

    const { data: row, error } = await context.supabase
      .from("documents")
      .update({
        title: result.title || current.title,
        sections: result.sections as unknown as never,
        latex: result.latex,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error || !row) throw new Error("The revision couldn't be saved.");
    return row as unknown as GeneratedDocument;
  });

export interface DocumentAnalysis {
  ai_score: number;
  plagiarism_score: number;
  relevance_score: number;
  verdict: string;
  ai_reasons: string[];
  plagiarism_reasons: string[];
  suggestions: string[];
  checked_at: string;
}

/** Explicit originality check: AI-likeness, plagiarism risk and project relevance. */
export const analyzeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<DocumentAnalysis> => {
    const { data: doc, error } = await context.supabase
      .from("documents")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !doc) throw new Error("Document not found.");
    const current = doc as unknown as GeneratedDocument;
    const source = current.project_id
      ? await projectSource(context.supabase as unknown as { from: (t: string) => any }, current.project_id)
      : null;

    const result = await generateJson<Omit<DocumentAnalysis, "checked_at">>({
      usage: { userId: context.userId, projectId: current.project_id, feature: "analyze_document" },
      name: "document_analysis",
      instructions: `You are an academic integrity reviewer. Score the submitted document on three 0-100 scales:
- ai_score: how likely the text reads as AI-generated (100 = certainly AI, 0 = certainly human).
- plagiarism_score: risk that passages resemble existing published text or boilerplate (100 = very high risk).
- relevance_score: how well the document matches the student's actual project data (100 = perfectly on-topic).
These are heuristic estimates from reading the text — say so plainly in the verdict. Give concrete, specific reasons and actionable suggestions.`,
      input: `=== DOCUMENT ===
Title: ${current.title}
${current.sections.map((s) => `## ${s.heading}\n${s.body}`).join("\n\n").slice(0, 24000)}

${source ? `=== STUDENT'S PROJECT DATA ===\n${source}` : "No project data available."}`,
      schema: obj({
        ai_score: { type: "number" },
        plagiarism_score: { type: "number" },
        relevance_score: { type: "number" },
        verdict: str,
        ai_reasons: strArray,
        plagiarism_reasons: strArray,
        suggestions: strArray,
      }),
    });

    const analysis: DocumentAnalysis = { ...result, checked_at: new Date().toISOString() };
    await context.supabase
      .from("documents")
      .update({ meta: { ...(current.meta ?? {}), analysis: JSON.stringify(analysis) } as unknown as never })
      .eq("id", data.id);
    return analysis;
  });
