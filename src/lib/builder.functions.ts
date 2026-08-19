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
  /** 0-100 — how strong this project is against current market/hiring trends. */
  market_score: number;
  /** One short sentence: why the market rates it that way. */
  market_reason: string;
  /** 2-4 short trend/standard tags, e.g. "AI adoption", "Cloud-first". */
  market_signals: string[];
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
  /** "What we did" — plain bullets. */
  explanation: string[];
  /** "Why we did it" — plain bullets. */
  why?: string[];
  /** "Why these settings" — the key choices made in this part. */
  parameters?: { name: string; value: string; why: string }[];
  /** Which file this part belongs in, e.g. "src/app.py" or "requirements.txt". */
  file?: string;
  /** "create" | "modify" | "run" — what the student does with it. */
  action?: string;
}



export interface StructureFile {
  path: string;
  content: string;
}

/** Plain-language recap shown under a finished step. */
export interface Walkthrough {
  completed: string[];
  whats_next: string[];
  analogy: string;
}

export interface SectionContent {
  language: string;
  blocks: CodeBlock[];
  insights: string[];
  business_connection: string;
  structure: string | null;
  files: StructureFile[];
  walkthrough: Walkthrough;
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
        jobDescription: z.string().trim().max(6000).default(""),
        skills: z.string().trim().max(600).default(""),
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
    const jobRule = data.jobDescription
      ? " The student pasted a job description: every project must be a portfolio piece that proves the exact skills, tools and responsibilities that job asks for. In the description, say plainly which requirement from the job each project demonstrates."
      : "";
    const skillsRule = data.skills
      ? " The student listed skills they already have or want to practise: every project must genuinely exercise those skills, and the description should name which of them it uses. Do not propose projects that ignore the listed skills."
      : "";
    const result = await generateJson<{ projects: SuggestedProject[] }>({
      usage: { userId: context.userId, feature: "suggest_projects" },
      name: "project_suggestions",
      instructions: `You are a senior project mentor for students. Propose realistic, portfolio-worthy projects that match the student's idea (if given) and domain. Keep descriptions to 2-3 sentences. ${stackRule}${jobRule}${skillsRule} The difficulty field must be exactly one of: Easy, Intermediate, Hard.

Also rate each project's MARKET POTENTIAL as a hiring-manager would, judging it against what companies are actually hiring for and paying for right now, and against current professional standards in that field:
- market_score: integer 0-100. Be discriminating — the four projects must have clearly different scores, and at least one should stand out as the strongest. Reserve 85+ for projects that map directly to in-demand roles and modern practice; give 40-60 to generic or dated ideas.
- market_reason: ONE short sentence (max 22 words) explaining the score in terms of current demand, hiring signals or industry standards. Be concrete, no hype.
- market_signals: 2-4 very short tags naming the trend or standard it rides (e.g. "AI copilots", "Cloud-native", "Data governance", "Agile delivery", "PMP-aligned"). No dates, no invented statistics.`,
      input: `Idea: ${data.idea || "(none given — suggest strong projects for the domain)"}\nDomain: ${data.domain}\n${data.skills ? `Student's skills: ${data.skills}\n` : ""}${data.jobDescription ? `Job description to target:\n"""\n${data.jobDescription}\n"""\n` : ""}Requested difficulty: ${wanted}\nSuggestion page: ${data.page}\nAlready shown (do not repeat): ${data.exclude.join(", ") || "none"}\n\nReturn exactly 4 distinct project ideas${data.difficulty ? ` that are all ${data.difficulty} difficulty` : ""}.`,


      schema: obj({
        projects: {
          type: "array",
          items: obj({
            title: str,
            description: str,
            tech_stack: strArray,
            difficulty: str,
            market_score: { type: "integer" },
            market_reason: str,
            market_signals: strArray,
          }),
        },
      }),
    });
    return result.projects.slice(0, 4).map((p) => ({
      ...p,
      market_score: Math.max(0, Math.min(100, Math.round(Number(p.market_score) || 0))),
      market_signals: (p.market_signals ?? []).slice(0, 4),
    }));
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
    items: obj({
      title: str,
      code: str,
      explanation: strArray,
      why: strArray,
      parameters: {
        type: "array",
        items: obj({ name: str, value: str, why: str }),
      },
      file: str,
      action: str,
    }),

  },
  insights: strArray,
  business_connection: str,
  structure: nullableStr,
  files: {
    type: "array",
    items: obj({ path: str, content: str }),
  },
  walkthrough: obj({
    completed: strArray,
    whats_next: strArray,
    analogy: str,
  }),
};

const sectionSchema = obj(sectionFields);

/**
 * A fix never rewrites the original section. It returns only the parts that had
 * a problem, re-issued as new "fixed" parts that keep their original part number.
 */
const fixSchema = obj({
  language: str,
  diagnosis: str,
  error_explained: str,
  fixed_blocks: {
    type: "array",
    items: obj({
      part_number: { type: "number" },
      title: str,
      code: str,
      explanation: strArray,
      file: str,
      action: str,
    }),
  },
  changes: {
    type: "array",
    items: obj({
      file: str,
      part: str,
      what_changed: str,
      why: str,
      removed: strArray,
      added: strArray,
    }),
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

  return {
    section: section as SectionRow & { project_id: string },
    brief,
    playbook,
    domain: (project.domain as string | null) ?? null,
    supabase,
  };

}

export const generateSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sectionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { section, brief, playbook, domain } = await loadContext(supabase as never, data.sectionId);


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
          walkthrough: null,
          status: "generated",
        })
        .eq("id", section.id);
      if (overviewError) throw new Error("The generated section could not be saved.");

      return { blocks, insights: overview.insights ?? [], language: "text" };
    }

    const isStructure = section.kind === "structure" && playbook.buildsCode;
    const dataProject = isDataDomain(String(domain ?? ""));
    const notebookRule = dataProject
      ? " NOTEBOOKS MATTER IN THIS PROJECT: put the exploration, analysis and every chart inside a Jupyter notebook. When a part belongs in a notebook, set `file` to the notebook path followed by the cell, exactly like \"notebooks/01_explore.ipynb — cell: 2\", set `action` to \"create\" for the first cell of that notebook and \"modify\" afterwards, and keep each cell short enough to run on its own. Every chart you create must actually be looked at and explained: after a plotting cell, say in the bullets what the student should see in the chart and what it means for the project. Never create a notebook or a plotting script that is then ignored — if a file exists in the plan, this project must use it."
      : "";
    const task = isStructure
      ? "Produce the project folder/file structure as an ASCII tree in `structure`, AND list the same files in `files`. ONLY include files this specific project genuinely needs — no speculative folders, no files nothing will ever use. EVERY file in `files` must have an EMPTY string as `content`: the student fills them in during the later steps, so do not write code, config, README text or any data into them." +
        (dataProject
          ? " Include the Jupyter notebooks this project will actually work in (e.g. notebooks/01_explore.ipynb, notebooks/02_model.ipynb) — notebooks are where the analysis and charts happen, so the later steps must use them."
          : "") +
        " `blocks` should contain 1-3 small parts: the commands that create the folders, then how to open the project. Do not dump the whole project into one block."
      : playbook.sectionTask + notebookRule;

    const draft = await generateJson<SectionContent>({
      usage: { userId: context.userId, projectId: section.project_id, feature: "section_draft" },
      name: "section_content",
      instructions: playbook.buildsCode
        ? `You are a senior engineer mentoring a beginner student. ${task} Use simple, friendly language everywhere. The student must be able to read the code top-to-bottom and understand it without help. ALWAYS choose the SIMPLEST logic that achieves the result: plain loops and clear variable names over clever one-liners, comprehensions-in-comprehensions, regex tricks, heavy abstractions or unnecessary classes/design patterns. Short, obvious code beats short, clever code. WRITE INLINE COMMENTS FROM THE STUDENT'S OWN PERSPECTIVE: every comment is written as if the student wrote it while doing the work, in first person present/past — \`# load the dataset i downloaded\`, \`# here i'm cleaning the empty rows\`, \`# i store the total so i can print it later\`. Never write instruction-style comments addressed at the reader (\"This function does X\", \"Now we will initialize the variables\", \"Step 1:\"). Comment the meaningful lines or small groups only, explaining WHY the student did it in plain words (not restating syntax). Use descriptive names so the code reads like English. WRITE IT LIKE A HUMAN, NOT AN AI: the code must read as if a real developer typed it while building this project. Use lowercase, casual comments in a natural voice (e.g. \`# grab the rows we care about\`, \`# quick sanity check\`) instead of formal, uniform, machine-generated comment banners. Do NOT comment every single line mechanically, do NOT use decorative separator lines (####, ====, /* --- */), do NOT add docstring templates with Args/Returns/Raises on trivial functions, and never write filler like \"Step 1:\", \"Initialize variables\", \"This function does X\" repeated in the same shape. Vary sentence length and structure; leave natural blank lines to group related work; use short practical names a person would pick (rows, df, total, user_input) instead of over-descriptive ones (processed_data_dictionary_result). Occasional small pragmatic touches are good: a TODO note, a short inline note about why a simpler approach was chosen. Never mention AI, models, or that the code was generated. Avoid emoji in code and avoid over-polished symmetry — real code is slightly uneven. EVERY block MUST set \`file\` to the exact relative path the code belongs in (e.g. "src/app.py", "requirements.txt", or "terminal" for commands to run) and \`action\` to exactly one of "create", "modify" or "run". Keep file paths consistent with earlier sections — reuse the same path when extending a file. AFTER-CODE EXPLANATION (REQUIRED for EVERY block, in three parts): \`explanation\` = 2-5 short bullets on WHAT WE DID in this part (start each with a verb, plain English, no jargon); \`why\` = 2-4 short bullets on WHY WE DID IT (the purpose and what would break without it); \`parameters\` = one entry for each meaningful choice made in this part (a number, threshold, model/tool, library, option, file format, column, size, rate) with \`name\`, the \`value\` used, and \`why\` that value was chosen in one short sentence — return an empty array only when the part truly has no choices to justify. Insights: 2-4 warnings or gotchas. business_connection: 1-2 sentences linking this section to the project goal. \`walkthrough\` (REQUIRED): where_am_i = one short sentence on where the student is in the overall project; completed = 2-4 short bullets on what this step just accomplished; whats_next = 1-3 short bullets on what comes next; analogy = ONE short everyday analogy (max 2 sentences) that makes this step's logic click. When the section is not a structure section, return an empty \`files\` array. Return 2-6 blocks.`
        : `You are an experienced practitioner mentoring a student in this domain. ${task} Write NO programming code anywhere. Use simple, friendly language.

ONE DELIVERABLE, ONE PIECE — THIS IS THE MOST IMPORTANT RULE. Return EXACTLY ONE block. That single block holds the COMPLETE, finished deliverable for this section, written continuously from start to end. NEVER split the deliverable into parts, stages or halves. Never write "Part 1", "Part 2", "continued", "first create the file, then paste the next piece", and never ask the student to create the same file twice. A table is NEVER broken across blocks or interrupted by commentary — every table is written once, complete, with all of its rows together. Set the block \`title\` to the deliverable's own name (e.g. "Project Charter", "Risk Register") — no numbering.

FILE: set \`file\` to the plain office file name only, with no section or sheet suffix — "Project Charter.docx" for a document or "Risk Register.xlsx" for a table-based deliverable. Choose .xlsx only when the deliverable really is a table (register, schedule, budget, RACI); otherwise use .docx. REUSE the same file names across the whole project — one charter document, one schedule workbook, one risk workbook — and set \`action\` to "create" the first time that file appears in the project and "modify" when this section adds to a file an earlier section already started.

WRITE IT AS A REAL DOCUMENT in \`code\` using simple markdown so it reads like a page: "# Title" for the document title, "## Heading" for sections, normal paragraphs of plain prose, "- " bullets, and markdown pipe tables for any tabular content (header row, separator row, then every data row). Fill in real, project-specific content — no placeholders like "TBD" or "<insert here>" unless the student genuinely must decide. Keep the flow continuous: headings and paragraphs in the natural reading order of that document.

Never mention terminals, command lines, repositories, code files or developer tools. EXPLANATION (REQUIRED, in three parts): \`explanation\` = 2-5 short bullets on WHAT WE DID, the first one saying in one plain sentence where this goes (which file, and whether it is a new file or added to an existing one); \`why\` = 2-4 short bullets on WHY WE DID IT; \`parameters\` = one entry per meaningful choice made in this deliverable (a date, duration, threshold, scale, owner role, format) with \`name\`, \`value\` and a one-sentence \`why\` — empty array only when there is genuinely nothing to justify. Insights: 2-4 warnings or common mistakes. business_connection: 1-2 sentences linking this deliverable to the project objective. \`walkthrough\` (REQUIRED): completed = 2-4 short bullets on what this deliverable just achieved; whats_next = 1-3 short bullets on what comes next; analogy = ONE short everyday analogy (max 2 sentences).`,


      input: `${brief}\n\nCURRENT SECTION ${section.position + 1}: ${section.title}\nQuestion: ${section.question ?? ""}\nObjective: ${section.objective ?? ""}`,
      schema: sectionSchema,
    });

    // Second, independent review pass — content is checked twice before the
    // student ever sees it.
    const reviewed = await generateJson<SectionContent>({
      usage: { userId: context.userId, projectId: section.project_id, feature: "section_review" },
      name: "section_content",
      instructions: playbook.buildsCode
        ? "You are a strict code reviewer AND a beginner-friendliness reviewer. Before returning anything, mentally RUN the draft line by line and verify the logic actually produces the intended result: check control flow and conditions, variable definition order, function signatures and argument order, imports, indentation/syntax validity, file paths, edge cases (empty input, missing file, division by zero) and that every variable used is defined earlier. Fix anything that would not run or would give a wrong result. Also review for undefined variables, wrong APIs, data leakage, and continuity breaks with the previous sections. Then SIMPLIFY: rewrite any clever, dense or over-engineered code into the simplest logic that still works efficiently, remove unnecessary abstractions, and rename unclear variables. Ensure the meaningful lines or small groups have inline comments written in the STUDENT'S OWN VOICE (first person, e.g. `# i filter out the empty rows here`) — rewrite any formal, instructional or third-person comments into that voice and add missing ones yourself. Then HUMANISE: make the final code look hand-written by a real developer — natural lowercase conversational comments, no mechanical comment-on-every-line, no decorative separators or banner blocks, no boilerplate docstring templates on trivial functions, no repeated formulaic phrasing, varied comment length, natural blank-line grouping, and short practical variable names. Strip anything that smells machine-generated while keeping the code correct and easy to follow. Ensure EVERY block has all three explanation parts filled: `explanation` (2-5 plain bullets on what we did), `why` (2-4 plain bullets on why we did it) and `parameters` (one entry per meaningful choice: name, value, and a one-line reason it was picked), and `walkthrough` is filled (completed, whats_next, analogy) with a simple everyday analogy. Return the corrected, final version in the same shape, keeping everything already correct."
        : "You are a strict reviewer of professional project documents. Check the draft for vague or placeholder content, missing owners, dates, dependencies or numbers, unrealistic estimates, and breaks in continuity with the previous sections. Return the corrected, final version in the same shape, keeping everything already correct. Remove any programming code entirely and make every table concrete and specific to this project. Ensure EVERY block has all three explanation parts filled: `explanation` (2-5 plain bullets on what we did), `why` (2-4 plain bullets on why we did it) and `parameters` (one entry per meaningful choice: name, value, and a one-line reason it was picked), and `walkthrough` is filled (completed, whats_next, analogy).",

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
        walkthrough: reviewed.walkthrough
          ? JSON.parse(JSON.stringify(reviewed.walkthrough))
          : null,
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

    const previousRounds: unknown[] = Array.isArray(
      (section as Record<string, any>)["fix_notes"]?.rounds,
    )
      ? (section as Record<string, any>)["fix_notes"].rounds
      : (section as Record<string, any>)["fix_notes"]?.diagnosis
        ? [(section as Record<string, any>)["fix_notes"]]
        : [];

    const currentBlocks = Array.isArray((section as Record<string, any>)["blocks"])
      ? ((section as Record<string, any>)["blocks"] as CodeBlock[])
      : [];

    const partsList = currentBlocks
      .map((b, i) => `Part ${i + 1}: ${b.title}${b.file ? ` (${b.file})` : ""}\n${b.code ?? ""}`)
      .join("\n\n");

    const fixed = await generateJson<{
      language: string;
      diagnosis: string;
      error_explained: string;
      fixed_blocks: {
        part_number: number;
        title: string;
        code: string;
        explanation: string[];
        file: string;
        action: string;
      }[];
      changes: {
        file: string;
        part: string;
        what_changed: string;
        why: string;
        removed: string[];
        added: string[];
      }[];
    }>({
      usage: { userId: context.userId, projectId: section.project_id, feature: "section_fix" },
      name: "section_fix",
      instructions: playbook.buildsCode
        ? "The student hit an error running this section's code. NEVER rewrite or replace the whole section: the original parts stay exactly as they are. Instead, identify ONLY the parts that actually caused the problem and return a corrected copy of each one in `fixed_blocks`, one entry per affected part, with `part_number` = that part's original number (1-based) and `title` = its original title. If more than one part is affected, return one entry per affected part. Do not include parts you did not change. Each fixed part must contain the COMPLETE corrected code for that part (not a diff), with `file` and `action` copied from the original part, plus `explanation` = 2-4 short plain bullets on what changed in that part. Before returning, mentally run the corrected code and check logic, variable order, imports and continuity with the other parts. MARK THE FIX IN THE CODE: put a short inline comment on (or directly above) each changed or added line, in the language's comment syntax, starting with `FIX:` and written in the student's own first-person voice — e.g. `# FIX: i convert this to int so the comparison works`. Where a line was deleted, leave a one-line comment in its place such as `# FIX: removed <old line> because it crashed`. Keep the existing teaching comments; do not mark unchanged lines. ALSO fill: `error_explained` = 1-2 plain sentences explaining the error message in student language; `diagnosis` = 1-2 plain sentences on the root cause; and `changes` with one entry per edit: `file` = the exact file the student must edit (always fill it); `part` = the part title or function you touched; `what_changed`; `why`; `removed` = the EXACT old lines you deleted or replaced (one per array item, no leading - sign, empty when you only added); `added` = the EXACT new lines including their `FIX:` comments (no leading + sign, empty when you only deleted). Never leave `changes` empty when you edited anything."
        : "The student reported a problem with this deliverable. NEVER rewrite the whole deliverable: the original parts stay as they are. Identify ONLY the parts that were wrong and return a corrected copy of each in `fixed_blocks`, with `part_number` = the original part number (1-based), the original `title`, the COMPLETE corrected content in `code` (markdown tables where relevant), `file` and `action` copied from the original part, and `explanation` = 2-4 short plain bullets on what changed. Write no programming code. Mark edits inside the content with short `(Updated: ...)` and `(Removed: ...)` notes. ALSO fill `error_explained` (1-2 plain sentences restating the reported problem), `diagnosis` (1-2 plain sentences on what was wrong) and `changes` with one entry per edit: `file` = the document/sheet to update (always fill it); `part`; `what_changed`; `why`; `removed` = exact old lines/rows removed (empty if none); `added` = exact new lines/rows (empty if none). Never leave `changes` empty when you edited anything.",
      input: `${brief}\n\nCURRENT SECTION ${section.position + 1}: ${section.title}\n\nEXISTING PARTS (do not rewrite these — only return corrected copies of the broken ones):\n${partsList || section.code || ""}\n\nPREVIOUS FIX ROUNDS ALREADY APPLIED: ${previousRounds.length}\n\nPROBLEM REPORTED BY THE STUDENT:\n${data.errorText}`,
      schema: fixSchema,
    });

    const round = {
      round: previousRounds.length + 1,
      reported: data.errorText,
      at: new Date().toISOString(),
      language: fixed.language || (playbook.buildsCode ? "python" : "markdown"),
      diagnosis: fixed.diagnosis ?? "",
      error_explained: fixed.error_explained ?? "",
      fixed_blocks: fixed.fixed_blocks ?? [],
      changes: fixed.changes ?? [],
    };

    const { error } = await supabase
      .from("build_sections")
      .update({
        // The original code is intentionally left untouched — each fix is
        // appended as a new round below it.
        fix_notes: JSON.parse(JSON.stringify({ rounds: [...previousRounds, round] })),
      })
      .eq("id", section.id);
    if (error) throw new Error("The fix could not be saved.");

    return fixed;
  });

