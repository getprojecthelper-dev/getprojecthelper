import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateJson, nullableStr, obj, str, strArray } from "@/lib/ai.server";
import { getPlaybook, PM_ARTIFACT_PLAN, type PmProfile } from "@/lib/domain-playbooks";


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
  /** Which file this part belongs in, e.g. "src/app.py" or "requirements.txt". */
  file?: string;
  /** "create" | "modify" | "run" — what the student does with it. */
  action?: string;
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
        idea: z.string().trim().max(600).default(""),
        domain: z.string().min(1).max(40),
        difficulty: z.enum(["easy", "intermediate", "hard"]).optional(),
        page: z.number().int().min(1).max(20),
        exclude: z.array(z.string()).max(60).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const wanted = data.difficulty ?? "any";
    const buildsCode = getPlaybook(data.domain).buildsCode;
    const stackRule = buildsCode
      ? "Tech stack: 5-8 concrete tools/libraries."
      : "This domain involves NO programming. Never propose apps, websites, dashboards to code, ML models, or any software to be built, and never list programming languages, frameworks or libraries. Propose real-world projects that are planned, coordinated and delivered by a manager (events, construction/site works, product launches, process improvement, migrations, campaigns, community or campus initiatives). The `tech_stack` field must instead list 5-8 methods, artefacts and standard PM tools (e.g. WBS, Gantt schedule, RACI matrix, risk register, earned value, stakeholder plan, MS Project, Trello).";
    const result = await generateJson<{ projects: SuggestedProject[] }>({
      usage: { userId: context.userId, feature: "suggest_projects" },
      name: "project_suggestions",
      instructions: `You are a senior project mentor for students. Propose realistic, portfolio-worthy projects that match the student's idea (if given) and domain. Keep descriptions to 2-3 sentences. ${stackRule} The difficulty field must be exactly one of: Easy, Intermediate, Hard.`,
      input: `Idea: ${data.idea || "(none given — suggest strong projects for the domain)"}\nDomain: ${data.domain}\nRequested difficulty: ${wanted}\nSuggestion page: ${data.page}\nAlready shown (do not repeat): ${data.exclude.join(", ") || "none"}\n\nReturn exactly 4 distinct project ideas${data.difficulty ? ` that are all ${data.difficulty} difficulty` : ""}.`,

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

    const playbook = getPlaybook(data.domain);
    const isPm = data.domain === "project_management";

    // Project Management projects always follow the same professional artifact
    // sequence (charter → ... → lessons learned), so the plan is fixed and the
    // AI only classifies the project profile.
    let pmProfile: PmProfile | null = null;
    let plan: { sections: SectionPlan[] };

    if (isPm) {
      pmProfile = await generateJson<PmProfile>({
        usage: { userId, feature: "plan_sections" },
        name: "pm_profile",
        instructions:
          "You are a PMP-certified project manager. Classify the student's project. `industry` is the real-world industry it belongs to (e.g. Cybersecurity, Construction, Healthcare, Education, Retail). `methodology` is the best-fit delivery methodology (Agile, Scrum, Waterfall, Hybrid, Kanban, PRINCE2) — name it and nothing else. `duration` is a realistic student-project duration in weeks, written like '12 weeks'. No code, no software talk.",
        input: `Project: ${data.title}\nDescription: ${data.description}\nTools & methods: ${data.techStack.join(", ")}`,
        schema: obj({ industry: str, methodology: str, duration: str }),
      });
      plan = { sections: PM_ARTIFACT_PLAN as unknown as SectionPlan[] };
    } else {
      plan = await generateJson<{ sections: SectionPlan[] }>({
      usage: { userId, feature: "plan_sections" },
      name: "implementation_plan",
      instructions:
        `You break a student project into simple, sequential steps. TITLES MUST BE VERY SIMPLE, everyday language a beginner instantly understands, 2-5 words. Never use jargon-heavy titles. The number of sections is fully DYNAMIC: use only as many as this specific project genuinely needs (as few as 4, as many as 12). Each section must build on the previous one. The FIRST section must be titled 'Problem Statement' and have kind 'overview' — it is an explanation-only section (problem, solution, approach, objective), never code. AT MOST ONE section may have kind 'structure' (the project folder/file layout) — never plan two structure sections, and never repeat the folder tree in another section. ${playbook.planInstructions} Keep 'question' and 'objective' in plain, short language too.`,
      input: `Project: ${data.title}\nDescription: ${data.description}\nDomain: ${data.domain}\nTech stack: ${data.techStack.join(", ")}\nDataset: ${data.dataset ? `${data.dataset.name} (${data.dataset.source}, ${data.dataset.format})` : "none"}\nTypical deliverables for this domain: ${playbook.deliverables.join("; ")}\n${playbook.buildsCode ? "" : "This domain produces documents and plans, NOT software. Do not plan any coding sections.\n"}\nReturn the sections in execution order — only as many as this project actually needs.`,

      schema: obj({
        sections: {
          type: "array",
          items: obj({ title: str, question: str, objective: str, kind: str }),
        },
      }),
      });
    }

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
        pm_profile: pmProfile ? { ...pmProfile } : null,
      })
      .select("id")
      .single();

    if (error || !project) throw new Error("The project could not be created.");

    // Only ONE section may be the project-structure section; any later
    // structure-ish section is downgraded to a normal step so the folder tree
    // is never produced twice.
    let structureUsed = false;
    const rows = plan.sections.slice(0, isPm ? PM_ARTIFACT_PLAN.length : 12).map((s, index) => {
      let kind: string;
      if (index === 0 || s.kind === "overview") {
        kind = "overview";
      } else if (s.kind === "structure" && playbook.buildsCode && !structureUsed) {
        kind = "structure";
        structureUsed = true;
      } else {
        kind = "step";
      }

      return {
        user_id: userId,
        project_id: project.id,
        position: index,
        title: s.title,
        question: s.question,
        objective: s.objective,
        kind,
        status: "pending",
      };
    });


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

const sectionFields = {
  language: str,
  blocks: {
    type: "array",
    items: obj({ title: str, code: str, explanation: strArray, file: str, action: str }),
  },
  insights: strArray,
  business_connection: str,
  structure: nullableStr,
  files: {
    type: "array",
    items: obj({ path: str, content: str }),
  },
};

const sectionSchema = obj(sectionFields);

/** Same as a section, plus a plain-language record of what was wrong and what changed. */
const fixSchema = obj({
  ...sectionFields,
  diagnosis: str,
  changes: {
    type: "array",
    items: obj({ part: str, what_changed: str, why: str }),
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

  const playbook = getPlaybook(project.domain as string | null);

  const pm = project.pm_profile as { industry?: string; methodology?: string; duration?: string } | null;
  const brief = `Project: ${project.name}\nDescription: ${project.description ?? ""}\nDomain: ${project.domain}${pm ? `\nIndustry: ${pm.industry}\nMethodology: ${pm.methodology}\nDuration: ${pm.duration}` : ""}\nTech stack: ${(project.tech_stack as string[] | null)?.join(", ") ?? ""}\nDataset: ${dataset ? `${dataset["name"]} — ${dataset["source"]} (${dataset["format"]}, ${dataset["size"]}) ${dataset["url"]}` : "none"}\nTypical deliverables for this domain: ${playbook.deliverables.join("; ")}\n${playbook.buildsCode ? "" : "IMPORTANT: this domain produces documents, plans and tables — NOT software. Never write programming code.\n"}\nPrevious sections:\n${priorContext || "(this is the first section)"}`;

  return { section: section as SectionRow & { project_id: string }, brief, playbook, supabase };

}

export const generateSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sectionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { section, brief, playbook } = await loadContext(supabase as never, data.sectionId);


    const isOverview =
      section.kind === "overview" ||
      (section.position === 0 && /problem\s*statement/i.test(section.title));

    if (isOverview) {
      const overview = await generateJson<OverviewContent>({
        usage: { userId: context.userId, projectId: section.project_id, feature: "section_overview" },
        name: "section_overview",
        instructions: playbook.buildsCode
          ? "You are a mentor introducing a student project. Write NO CODE AT ALL. Explain, in simple plain language: the problem statement (what problem exists and why it matters), the proposed solution / approach, the technology stack with a one-line reason for each item, and 3-5 concrete measurable objectives. Keep it concrete to this specific project — no generic filler."
          : "You are a mentor introducing a student project that is managed, not programmed. Write NO CODE AT ALL and never mention programming languages or libraries. Explain in simple plain language: the problem statement (what needs to happen and why it matters, who it is for, what is in and out of scope), the approach for delivering it, the tools, methods and roles involved (each with a one-line reason — e.g. Gantt chart, RACI matrix, risk register, weekly status review, stakeholders), and 3-5 concrete measurable success criteria.",

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
        {
          title: playbook.buildsCode ? "Solution / approach" : "Approach",
          code: "",
          explanation: [overview.solution],
        },
        {
          title: playbook.buildsCode ? "Technology stack" : "Tools, methods and roles",
          code: "",
          explanation: (overview.tech_stack ?? []).map((t) => `${t.name} — ${t.reason}`),
        },
        {
          title: playbook.buildsCode ? "Objectives" : "Success criteria",
          code: "",
          explanation: overview.objectives ?? [],
        },
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

    const isStructure = section.kind === "structure" && playbook.buildsCode;
    const task = isStructure
      ? "Produce the complete project folder/file structure as an ASCII tree in `structure`, AND fill `files` with EVERY file of that structure: a relative path (e.g. 'src/data/loader.py', 'requirements.txt', 'README.md') and sensible starter content for each (config files and READMEs should be real, code files can be short stubs with comments). Folders are implied by the paths. `blocks` should contain 1-3 small parts, e.g. the folder tree creation commands, then the config file. Do not dump the whole project into one block."
      : playbook.sectionTask;

    const draft = await generateJson<SectionContent>({
      usage: { userId: context.userId, projectId: section.project_id, feature: "section_draft" },
      name: "section_content",
      instructions: playbook.buildsCode
        ? `You are a senior engineer mentoring a beginner student. ${task} Use simple, friendly language everywhere. The student must be able to read the code top-to-bottom and understand it without help. EVERY block MUST set \`file\` to the exact relative path the code belongs in (e.g. "src/app.py", "requirements.txt", or "terminal" for commands to run) and \`action\` to exactly one of "create", "modify" or "run". Keep file paths consistent with earlier sections — reuse the same path when extending a file. Insights: 2-4 warnings or gotchas. business_connection: 1-2 sentences linking this section to the project goal. When the section is not a structure section, return an empty \`files\` array. Return 2-6 blocks.`
        : `You are an experienced practitioner mentoring a student in this domain. ${task} Write NO programming code anywhere. Use simple, friendly language. EVERY block MUST set \`file\` to the everyday office file it belongs in (e.g. "Project Charter.docx", "Schedule.xlsx — sheet: Gantt", "Kickoff.pptx") and \`action\` to exactly one of "create" or "modify". Never mention terminals, repositories or code files. Insights: 2-4 warnings or common mistakes. business_connection: 1-2 sentences linking this deliverable to the project objective. Return 2-5 blocks.`,

      input: `${brief}\n\nCURRENT SECTION ${section.position + 1}: ${section.title}\nQuestion: ${section.question ?? ""}\nObjective: ${section.objective ?? ""}`,
      schema: sectionSchema,
    });

    // Second, independent review pass — content is checked twice before the
    // student ever sees it.
    const reviewed = await generateJson<SectionContent>({
      usage: { userId: context.userId, projectId: section.project_id, feature: "section_review" },
      name: "section_content",
      instructions: playbook.buildsCode
        ? "You are a strict code reviewer. Review the draft for logic errors, undefined variables, wrong APIs, data leakage, and continuity breaks with the previous sections. Return the corrected, final version in the same shape. Keep everything that was already correct. Also simplify anything unnecessarily complex so a beginner can follow it, while keeping it efficient."
        : "You are a strict reviewer of professional project documents. Check the draft for vague or placeholder content, missing owners, dates, dependencies or numbers, unrealistic estimates, and breaks in continuity with the previous sections. Return the corrected, final version in the same shape, keeping everything already correct. Remove any programming code entirely and make every table concrete and specific to this project.",

      input: `${brief}\n\nCURRENT SECTION ${section.position + 1}: ${section.title}\nObjective: ${section.objective ?? ""}\n\nDRAFT TO REVIEW:\n${JSON.stringify(draft)}`,
      schema: sectionSchema,
    });

    const { error } = await supabase
      .from("build_sections")
      .update({
        code: joinBlocks(reviewed.blocks),
        blocks: JSON.parse(JSON.stringify(reviewed.blocks ?? [])),
        files: JSON.parse(JSON.stringify(reviewed.files ?? [])),
        language: reviewed.language || (playbook.buildsCode ? "python" : "markdown"),
        explanation: (reviewed.blocks ?? []).flatMap((b) => b.explanation ?? []),
        insights: reviewed.insights,
        business_connection: reviewed.business_connection,
        structure: isStructure ? reviewed.structure : null,
        fix_notes: null,
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
    const { section, brief, playbook } = await loadContext(supabase as never, data.sectionId);

    const fixed = await generateJson<
      SectionContent & {
        diagnosis: string;
        changes: { part: string; what_changed: string; why: string }[];
      }
    >({
      usage: { userId: context.userId, projectId: section.project_id, feature: "section_fix" },
      name: "section_content",
      instructions: playbook.buildsCode
        ? "The student hit an error running this section's code. Diagnose the cause, fix the code, and return the updated full section in the same block-by-block shape (small parts, each with a simple title and plain-language bullets). Keep `files` unchanged unless the fix requires new files. ALSO fill `diagnosis` with one or two plain sentences on what caused the error, and `changes` with one entry per edit you made: `part` = the block title, file name or line/function you touched, `what_changed` = the concrete edit (old → new) in plain language, `why` = why it fixes the problem. Never leave `changes` empty when you edited anything."
        : "The student reported a problem with this deliverable (wrong, unrealistic, missing or unclear content). Diagnose it, correct the deliverable and return the updated full section in the same block-by-block shape, keeping tables in `code` as markdown and plain-language bullets in `explanation`. Write no programming code. ALSO fill `diagnosis` with one or two plain sentences on what was wrong, and `changes` with one entry per edit: `part` = the deliverable section or table you touched, `what_changed` = the concrete edit in plain language, `why` = why it is better. Never leave `changes` empty when you edited anything.",
      input: `${brief}\n\nCURRENT SECTION ${section.position + 1}: ${section.title}\n\nCURRENT CONTENT:\n${section.code ?? ""}\n\nPROBLEM REPORTED BY THE STUDENT:\n${data.errorText}`,
      schema: fixSchema,
    });

    const { error } = await supabase
      .from("build_sections")
      .update({
        code: joinBlocks(fixed.blocks),
        blocks: JSON.parse(JSON.stringify(fixed.blocks ?? [])),
        files: JSON.parse(JSON.stringify(fixed.files ?? [])),
        language: fixed.language || (playbook.buildsCode ? "python" : "markdown"),

        explanation: (fixed.blocks ?? []).flatMap((b) => b.explanation ?? []),
        insights: fixed.insights,
        business_connection: fixed.business_connection,
        structure:
          section.kind === "structure" && playbook.buildsCode ? fixed.structure : null,
        fix_notes: JSON.parse(
          JSON.stringify({
            diagnosis: fixed.diagnosis ?? "",
            changes: fixed.changes ?? [],
            reported: data.errorText,
            at: new Date().toISOString(),
          }),
        ),
        status: "generated",
      })
      .eq("id", section.id);
    if (error) throw new Error("The fixed section could not be saved.");


    return fixed;
  });
