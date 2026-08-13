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

export interface ResearchPaper {
  title: string;
  authors: string;
  year: string;
  venue: string;
  url: string;
  pdf_url: string | null;
  downloadable: boolean;
  summary: string;
  relevance: string;
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
  .handler(async ({ data, context }) => {
    const result = await generateJson<{ projects: SuggestedProject[] }>({
      usage: { userId: context.userId, feature: "suggest_projects" },
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
/* 1b. Find research papers for the chosen project                     */
/* ------------------------------------------------------------------ */

export const findResearchPapers = createServerFn({ method: "POST" })
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
  .handler(async ({ data, context }) => {
    const result = await generateJson<{ papers: ResearchPaper[] }>({
      usage: { userId: context.userId, feature: "find_papers" },
      name: "research_papers",
      instructions:
        "You find real, well-known academic papers from arXiv, IEEE, ACM, Springer, ScienceDirect, PubMed and similar venues. Only list papers you are confident exist, with their canonical landing page URL. If the paper is open access (arXiv, PMC, open-access journals), set downloadable true and give the direct PDF URL; otherwise set downloadable false and pdf_url null. Never invent URLs.",
      input: `Project: ${data.title}\nDescription: ${data.description}\nDomain: ${data.domain}\n\nReturn 8-12 relevant papers, newest and most-cited first, each with a 2-sentence takeaway written for a student and how it helps this project.`,

      schema: obj({
        papers: {
          type: "array",
          items: obj({
            title: str,
            authors: str,
            year: str,
            venue: str,
            url: str,
            pdf_url: nullableStr,
            downloadable: { type: "boolean" },
            summary: str,
            relevance: str,
          }),
        },
      }),
    });
    const { verifyPapers } = await import("@/lib/paper-verify.server");
    return await verifyPapers(result.papers, {
      title: data.title,
      description: data.description,
      domain: data.domain,
    });

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
  .handler(async ({ data, context }) => {
    const result = await generateJson<{ datasets: DatasetOption[] }>({
      usage: { userId: context.userId, feature: "find_datasets" },
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
        papers: z
          .array(
            z.object({
              title: z.string(),
              authors: z.string(),
              year: z.string(),
              venue: z.string(),
              url: z.string(),
              pdf_url: z.string().nullable(),
              downloadable: z.boolean(),
              summary: z.string(),
              relevance: z.string(),
            }),
          )
          .max(10)
          .default([]),

      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const plan = await generateJson<{ sections: SectionPlan[] }>({
      usage: { userId, feature: "plan_sections" },
      name: "implementation_plan",
      instructions:
        "You break a student project into simple, sequential steps. TITLES MUST BE VERY SIMPLE, everyday language a beginner instantly understands, 2-5 words, e.g. 'Problem Statement', 'Create Project Structure', 'Install Libraries', 'Load the Data', 'Clean the Data', 'Train the Model', 'Test the App', 'Deploy the Project'. Never use jargon-heavy titles. The number of sections is fully DYNAMIC: use only as many as this specific project genuinely needs (as few as 4, as many as 12). Each section must build on the previous one. The FIRST section must be titled 'Problem Statement' and have kind 'overview' — it is an explanation-only section (problem, solution, tech stack, objective), never code. Exactly one section must have kind 'structure' (creating the project folder/file structure) and it should come early. All other sections use kind 'step'. Keep 'question' and 'objective' in plain, short language too.",
      input: `Project: ${data.title}\nDescription: ${data.description}\nDomain: ${data.domain}\nTech stack: ${data.techStack.join(", ")}\nDataset: ${data.dataset ? `${data.dataset.name} (${data.dataset.source}, ${data.dataset.format})` : "none"}\n${data.domain === "project_management" ? "This is a Project Management student project: the steps are management deliverables (project charter, stakeholder map, scope & WBS, schedule/Gantt, budget, risk register, status reporting, closure & lessons learned), not software features. Use documents, tables and templates instead of programming code.\n" : ""}\nReturn the sections in execution order — only as many as this project actually needs.`,
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

    const rows = plan.sections.slice(0, 12).map((s, index) => ({
      user_id: userId,
      project_id: project.id,
      position: index,
      title: s.title,
      question: s.question,
      objective: s.objective,
      kind:
        index === 0 || s.kind === "overview"
          ? "overview"
          : s.kind === "structure"
            ? "structure"
            : "step",
      status: "pending",
    }));

    const { error: sectionError } = await supabase.from("build_sections").insert(rows);
    if (sectionError) throw new Error("The implementation sections could not be saved.");

    if (data.papers.length > 0) {
      await supabase.from("research_sources").insert(
        data.papers.map((p) => ({
          user_id: userId,
          project_id: project.id,
          title: p.title,
          authors: p.authors || null,
          year: Number.parseInt(p.year, 10) || null,
          source_type: "paper",
          url: p.pdf_url ?? p.url,
          notes: [p.summary, p.relevance].filter(Boolean).join("\n\n") || null,
        })),
      );
    }

    return { projectId: project.id };

  });

/* ------------------------------------------------------------------ */
/* 4. Generate / fix a single section                                  */
/* ------------------------------------------------------------------ */

const sectionSchema = obj({
  language: str,
  blocks: {
    type: "array",
    items: obj({ title: str, code: str, explanation: strArray }),
  },
  insights: strArray,
  business_connection: str,
  structure: nullableStr,
  files: {
    type: "array",
    items: obj({ path: str, content: str }),
  },
});

interface OverviewContent {
  problem_statement: string;
  solution: string;
  tech_stack: { name: string; reason: string }[];
  objectives: string[];
  insights: string[];
  business_connection: string;
}

const joinBlocks = (blocks: CodeBlock[]) =>
  (blocks ?? []).map((b) => `# ${b.title}\n${b.code}`).join("\n\n");

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

    const isOverview =
      section.kind === "overview" ||
      (section.position === 0 && /problem\s*statement/i.test(section.title));

    if (isOverview) {
      const overview = await generateJson<OverviewContent>({
        usage: { userId: context.userId, projectId: section.project_id, feature: "section_overview" },
        name: "section_overview",
        instructions:
          "You are a mentor introducing a student project. Write NO CODE AT ALL. Explain, in simple plain language: the problem statement (what problem exists and why it matters, 2-4 short paragraphs worth of bullet-free prose), the proposed solution / approach, the technology stack with a one-line reason for each item, and 3-5 concrete measurable objectives. Keep it concrete to this specific project — no generic filler.",
        input: `${brief}\n\nCURRENT SECTION: ${section.title}\nQuestion: ${section.question ?? ""}\nObjective: ${section.objective ?? ""}`,
        schema: obj({
          problem_statement: str,
          solution: str,
          tech_stack: { type: "array", items: obj({ name: str, reason: str }) },
          objectives: strArray,
          insights: strArray,
          business_connection: str,
        }),
      });

      const blocks = [
        { title: "Problem statement", code: "", explanation: [overview.problem_statement] },
        { title: "Solution / approach", code: "", explanation: [overview.solution] },
        {
          title: "Technology stack",
          code: "",
          explanation: (overview.tech_stack ?? []).map((t) => `${t.name} — ${t.reason}`),
        },
        { title: "Objectives", code: "", explanation: overview.objectives ?? [] },
      ];

      const { error: overviewError } = await supabase
        .from("build_sections")
        .update({
          code: null,
          blocks: JSON.parse(JSON.stringify(blocks)),
          files: [],
          language: "text",
          explanation: blocks.flatMap((b) => b.explanation),
          insights: overview.insights ?? [],
          business_connection: overview.business_connection,
          structure: null,
          status: "generated",
        })
        .eq("id", section.id);
      if (overviewError) throw new Error("The generated section could not be saved.");

      return { blocks, insights: overview.insights ?? [], language: "text" };
    }

    const isStructure = section.kind === "structure";
    const task = isStructure
      ? "Produce the complete project folder/file structure as an ASCII tree in `structure`, AND fill `files` with EVERY file of that structure: a relative path (e.g. 'src/data/loader.py', 'requirements.txt', 'README.md') and sensible starter content for each (config files and READMEs should be real, code files can be short stubs with comments). Folders are implied by the paths. `blocks` should contain 1-3 small parts, e.g. the folder tree creation commands, then the config file. Do not dump the whole project into one block."
      : "Produce runnable code for THIS section only, split into SMALL PARTS. Each block is one small logical part (e.g. 'Install the libraries', then 'Import them', then 'Load the data'), with a short simple title and 2-4 plain-language bullets explaining just that part. NEVER put installation commands and the rest of the code in one block. Keep every block short (typically under 20 lines) and continue directly from the previous sections' code (same variable names, same file conventions). Write BEGINNER-FRIENDLY code: simple, readable, straight-line steps with clear descriptive variable names and a short comment above each important line. Prefer the simplest efficient approach (vectorised/standard library helpers) over clever one-liners, custom classes, decorators, deep nesting, metaprogramming or heavy abstractions. No unnecessary try/except, no premature optimisation.";

    const draft = await generateJson<SectionContent>({
      usage: { userId: context.userId, projectId: section.project_id, feature: "section_draft" },
      name: "section_content",
      instructions: `You are a senior engineer mentoring a beginner student. ${task} Use simple, friendly language everywhere. The student must be able to read the code top-to-bottom and understand it without help. Insights: 2-4 warnings or gotchas. business_connection: 1-2 sentences linking this section to the project goal. When the section is not a structure section, return an empty \`files\` array. Return 2-6 blocks.`,
      input: `${brief}\n\nCURRENT SECTION ${section.position + 1}: ${section.title}\nQuestion: ${section.question ?? ""}\nObjective: ${section.objective ?? ""}`,
      schema: sectionSchema,
    });

    // Second, independent review pass — the code is checked twice before the
    // student ever sees it.
    const reviewed = await generateJson<SectionContent>({
      usage: { userId: context.userId, projectId: section.project_id, feature: "section_review" },
      name: "section_content",
      instructions:
        "You are a strict code reviewer. Review the draft for logic errors, undefined variables, wrong APIs, data leakage, and continuity breaks with the previous sections. Return the corrected, final version in the same shape. Keep everything that was already correct. Also simplify anything unnecessarily complex so a beginner can follow it, while keeping it efficient.",
      input: `${brief}\n\nCURRENT SECTION ${section.position + 1}: ${section.title}\nObjective: ${section.objective ?? ""}\n\nDRAFT TO REVIEW:\n${JSON.stringify(draft)}`,
      schema: sectionSchema,
    });

    const { error } = await supabase
      .from("build_sections")
      .update({
        code: joinBlocks(reviewed.blocks),
        blocks: JSON.parse(JSON.stringify(reviewed.blocks ?? [])),
        files: JSON.parse(JSON.stringify(reviewed.files ?? [])),
        language: reviewed.language || "python",
        explanation: (reviewed.blocks ?? []).flatMap((b) => b.explanation ?? []),
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
      usage: { userId: context.userId, projectId: section.project_id, feature: "section_fix" },
      name: "section_content",
      instructions:
        "The student hit an error running this section's code. Diagnose the cause, fix the code, and return the updated full section in the same block-by-block shape (small parts, each with a simple title and plain-language bullets). The first block's explanation must start with what caused the error and what you changed. Keep `files` unchanged unless the fix requires new files.",
      input: `${brief}\n\nCURRENT SECTION ${section.position + 1}: ${section.title}\n\nCURRENT CODE:\n${section.code ?? ""}\n\nERROR REPORTED BY THE STUDENT:\n${data.errorText}`,
      schema: sectionSchema,
    });

    const { error } = await supabase
      .from("build_sections")
      .update({
        code: joinBlocks(fixed.blocks),
        blocks: JSON.parse(JSON.stringify(fixed.blocks ?? [])),
        files: JSON.parse(JSON.stringify(fixed.files ?? [])),
        language: fixed.language || "python",
        explanation: (fixed.blocks ?? []).flatMap((b) => b.explanation ?? []),
        insights: fixed.insights,
        business_connection: fixed.business_connection,
        structure: fixed.structure,
        status: "generated",
      })
      .eq("id", section.id);
    if (error) throw new Error("The fixed section could not be saved.");

    return fixed;
  });
