import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateJson, nullableStr, obj, str, strArray } from "@/lib/ai.server";

export interface SuggestedProject {
  title: string;
  description: string;
  tech_stack: string[];
  difficulty: string;
}

export interface DatasetOption {
  name: string;
  source: string;
  url: string;
  size: string;
  format: string;
  good_for: string;
  bad_for: string;
  common_mistakes: string;
}

export interface SectionPlan {
  title: string;
  question: string;
  objective: string;
  kind: string;
}

export interface CodeBlock {
  title: string;
  code: string;
  explanation: string[];
}

export interface StructureFile {
  path: string;
  content: string;
}

export interface SectionContent {
  language: string;
  blocks: CodeBlock[];
  insights: string[];
  business_connection: string;
  structure: string | null;
  files: StructureFile[];
}

const DATA_DOMAINS = ["data_science", "analytics", "ml_ai", "research"];
export const isDataDomain = (domain: string) => DATA_DOMAINS.includes(domain);

/* ------------------------------------------------------------------ */
/* 1. Suggest related projects (paginated)                             */
/* ------------------------------------------------------------------ */

export const suggestProjects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        idea: z.string().trim().min(3).max(600),
        domain: z.string().min(1).max(40),
        page: z.number().int().min(1).max(20),
        exclude: z.array(z.string()).max(60).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const result = await generateJson<{ projects: SuggestedProject[] }>({
      name: "project_suggestions",
      instructions:
        "You are a senior project mentor for students. Propose realistic, portfolio-worthy projects that match the student's idea and domain. Keep descriptions to 2-3 sentences. Tech stack: 5-8 concrete tools/libraries.",
      input: `Idea: ${data.idea}\nDomain: ${data.domain}\nSuggestion page: ${data.page}\nAlready shown (do not repeat): ${data.exclude.join(", ") || "none"}\n\nReturn exactly 4 distinct project ideas.`,
      schema: obj({
        projects: {
          type: "array",
          items: obj({
            title: str,
            description: str,
            tech_stack: strArray,
            difficulty: str,
          }),
        },
      }),
    });
    return result.projects.slice(0, 4);
  });

/* ------------------------------------------------------------------ */
/* 2. Find datasets for a data-oriented project                        */
/* ------------------------------------------------------------------ */

export const findDatasets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().trim().min(2).max(200),
        description: z.string().trim().max(2000),
        domain: z.string().max(40),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const result = await generateJson<{ datasets: DatasetOption[] }>({
      name: "dataset_options",
      instructions:
        "You find real, publicly available datasets from sources such as Kaggle, UCI ML Repository, data.gov, HuggingFace Datasets, Zenodo, government and research portals. Only list datasets you are confident actually exist, with their canonical landing-page URL. Never invent URLs.",
      input: `Project: ${data.title}\nDescription: ${data.description}\nDomain: ${data.domain}\n\nReturn 4-6 relevant dataset options across different sources, each with realistic size, format, what it is good for, what it is bad for, and a common mistake students make with it.`,
      schema: obj({
        datasets: {
          type: "array",
          items: obj({
            name: str,
            source: str,
            url: str,
            size: str,
            format: str,
            good_for: str,
            bad_for: str,
            common_mistakes: str,
          }),
        },
      }),
    });
    return result.datasets;
  });

/* ------------------------------------------------------------------ */
/* 3. Create the project and plan its implementation sections          */
/* ------------------------------------------------------------------ */

export const createGuidedProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        idea: z.string().trim().max(600),
        domain: z.string().max(40),
        title: z.string().trim().min(2).max(200),
        description: z.string().trim().max(3000),
        techStack: z.array(z.string()).max(20),
        dataset: z
          .object({
            name: z.string(),
            source: z.string(),
            url: z.string(),
            size: z.string(),
            format: z.string(),
            good_for: z.string(),
            bad_for: z.string(),
            common_mistakes: z.string(),
          })
          .nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const plan = await generateJson<{ sections: SectionPlan[] }>({
      name: "implementation_plan",
      instructions:
        "You break a student project into sequential implementation sections. Each section must build on the previous one. Exactly one section must have kind 'structure' (the project folder/file structure) and it should come early (position 2 or 3). All other sections use kind 'step'. Sections must be domain-appropriate: data projects cover acquisition, cleaning, feature work, EDA, modelling, evaluation; software projects cover architecture, data model, backend, frontend, integration, testing, deployment; cybersecurity projects cover scoping, recon, tooling, detection, hardening, reporting.",
      input: `Project: ${data.title}\nDescription: ${data.description}\nDomain: ${data.domain}\nTech stack: ${data.techStack.join(", ")}\nDataset: ${data.dataset ? `${data.dataset.name} (${data.dataset.source}, ${data.dataset.format})` : "none"}\n\nReturn 7 or 8 sections in execution order.`,
      schema: obj({
        sections: {
          type: "array",
          items: obj({ title: str, question: str, objective: str, kind: str }),
        },
      }),
    });

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name: data.title,
        description: data.description,
        domain: data.domain,
        idea: data.idea,
        tech_stack: data.techStack,
        dataset: data.dataset,
        builder_step: "build",
        template: data.domain,
        purpose: "academic",
        current_stage: "development",
      })
      .select("id")
      .single();

    if (error || !project) throw new Error("The project could not be created.");

    const rows = plan.sections.slice(0, 8).map((s, index) => ({
      user_id: userId,
      project_id: project.id,
      position: index,
      title: s.title,
      question: s.question,
      objective: s.objective,
      kind: s.kind === "structure" ? "structure" : "step",
      status: "pending",
    }));

    const { error: sectionError } = await supabase.from("build_sections").insert(rows);
    if (sectionError) throw new Error("The implementation sections could not be saved.");

    return { projectId: project.id };
  });

/* ------------------------------------------------------------------ */
/* 4. Generate / fix a single section                                  */
/* ------------------------------------------------------------------ */

const sectionSchema = obj({
  code: str,
  language: str,
  explanation: strArray,
  insights: strArray,
  business_connection: str,
  structure: nullableStr,
});

interface SectionRow {
  id: string;
  position: number;
  title: string;
  question: string | null;
  objective: string | null;
  kind: string;
  code: string | null;
  status: string;
}

async function loadContext(
  supabase: { from: (t: string) => any },
  sectionId: string,
) {
  const { data: section } = await supabase
    .from("build_sections")
    .select("*")
    .eq("id", sectionId)
    .maybeSingle();
  if (!section) throw new Error("Section not found.");

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", section.project_id)
    .maybeSingle();
  if (!project) throw new Error("Project not found.");

  const { data: previous } = await supabase
    .from("build_sections")
    .select("position,title,objective,code")
    .eq("project_id", section.project_id)
    .lt("position", section.position)
    .order("position");

  const dataset = project.dataset as Record<string, string> | null;
  const priorContext = ((previous ?? []) as SectionRow[])
    .map(
      (p) =>
        `--- Section ${p.position + 1}: ${p.title}\nObjective: ${p.objective ?? ""}\nCode:\n${p.code ?? "(not generated)"}`,
    )
    .join("\n\n");

  const brief = `Project: ${project.name}\nDescription: ${project.description ?? ""}\nDomain: ${project.domain}\nTech stack: ${(project.tech_stack as string[] | null)?.join(", ") ?? ""}\nDataset: ${dataset ? `${dataset["name"]} — ${dataset["source"]} (${dataset["format"]}, ${dataset["size"]}) ${dataset["url"]}` : "none"}\n\nPrevious sections:\n${priorContext || "(this is the first section)"}`;

  return { section: section as SectionRow & { project_id: string }, brief, supabase };
}

export const generateSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sectionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { section, brief } = await loadContext(supabase as never, data.sectionId);

    const isStructure = section.kind === "structure";
    const task = isStructure
      ? "Produce the complete project folder/file structure as an ASCII tree in `structure`, and in `code` put the shell commands that create it. Explanation must describe what each top-level folder is for."
      : "Produce runnable, production-quality code for THIS section only. It must continue directly from the previous sections' code (same variable names, same file conventions) so the project stays continuous.";

    const draft = await generateJson<SectionContent>({
      name: "section_content",
      instructions: `You are a senior engineer mentoring a student. ${task} Explanation: 5-8 bullets describing what the code does. Insights: 2-4 warnings or gotchas. business_connection: 1-2 sentences linking this section to the project goal.`,
      input: `${brief}\n\nCURRENT SECTION ${section.position + 1}: ${section.title}\nQuestion: ${section.question ?? ""}\nObjective: ${section.objective ?? ""}`,
      schema: sectionSchema,
    });

    // Second, independent review pass — the code is checked twice before the
    // student ever sees it.
    const reviewed = await generateJson<SectionContent>({
      name: "section_content",
      instructions:
        "You are a strict code reviewer. Review the draft for logic errors, undefined variables, wrong APIs, data leakage, and continuity breaks with the previous sections. Return the corrected, final version in the same shape. Keep everything that was already correct.",
      input: `${brief}\n\nCURRENT SECTION ${section.position + 1}: ${section.title}\nObjective: ${section.objective ?? ""}\n\nDRAFT TO REVIEW:\n${JSON.stringify(draft)}`,
      schema: sectionSchema,
    });

    const { error } = await supabase
      .from("build_sections")
      .update({
        code: reviewed.code,
        language: reviewed.language || "python",
        explanation: reviewed.explanation,
        insights: reviewed.insights,
        business_connection: reviewed.business_connection,
        structure: reviewed.structure,
        status: "generated",
      })
      .eq("id", section.id);
    if (error) throw new Error("The generated section could not be saved.");

    return reviewed;
  });

export const fixSectionError = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        sectionId: z.string().uuid(),
        errorText: z.string().trim().min(3).max(5000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { section, brief } = await loadContext(supabase as never, data.sectionId);

    const fixed = await generateJson<SectionContent>({
      name: "section_content",
      instructions:
        "The student hit an error running this section's code. Diagnose the cause, fix the code, and return the updated full section. In `explanation`, start with a bullet explaining what caused the error and what you changed.",
      input: `${brief}\n\nCURRENT SECTION ${section.position + 1}: ${section.title}\n\nCURRENT CODE:\n${section.code ?? ""}\n\nERROR REPORTED BY THE STUDENT:\n${data.errorText}`,
      schema: sectionSchema,
    });

    const { error } = await supabase
      .from("build_sections")
      .update({
        code: fixed.code,
        language: fixed.language || "python",
        explanation: fixed.explanation,
        insights: fixed.insights,
        business_connection: fixed.business_connection,
        structure: fixed.structure,
        status: "generated",
      })
      .eq("id", section.id);
    if (error) throw new Error("The fixed section could not be saved.");

    return fixed;
  });
