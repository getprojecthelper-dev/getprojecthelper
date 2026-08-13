/**
 * Per-domain playbooks.
 *
 * Every domain works differently: a software project ships code, a project
 * management project ships plans, schedules, registers and reports, a research
 * project ships method and analysis. These playbooks make the builder dynamic
 * instead of assuming every project is a coding project.
 */

export interface DomainPlaybook {
  /** Does the implementation actually produce runnable code? */
  buildsCode: boolean;
  /** What one implementation section is called for this domain. */
  unitNoun: string;
  unitNounPlural: string;
  /** Headline copy for the implementation screen. */
  headline: string;
  subhead: string;
  /** Extra instructions appended to the section-planning prompt. */
  planInstructions: string;
  /** Task instructions used when generating one section. */
  sectionTask: string;
  /** Typical deliverables the AI should draw from. */
  deliverables: string[];
  /** Plain-language primer shown before the student starts the steps. */
  gettingStarted?: {
    title: string;
    intro: string;
    /** What the student physically creates, and in which everyday tool. */
    tools: { label: string; detail: string }[];
    /** How the workflow runs, step by step, in plain words. */
    how: string[];
    note?: string;
  };
}

const CODE_PLAN =
  "Exactly one section must have kind 'structure' (creating the project folder/file structure) and it should come early. All other sections use kind 'step'.";

const codePlaybook = (deliverables: string[]): DomainPlaybook => ({
  buildsCode: true,
  unitNoun: "Step",
  unitNounPlural: "Implementation steps",
  headline: "Implementation steps",
  subhead:
    "Simple steps, in order. Open a step, generate it when you're ready, then confirm to move on.",
  planInstructions: CODE_PLAN,
  sectionTask:
    "Produce runnable code for THIS section only, split into SMALL PARTS. Each block is one small logical part, with a short simple title and 2-4 plain-language bullets explaining just that part. NEVER put installation commands and the rest of the code in one block. Keep every block short (typically under 20 lines) and continue directly from the previous sections' code (same variable names, same file conventions). Write BEGINNER-FRIENDLY code: simple, readable, straight-line steps with clear descriptive variable names and a short comment above each important line. Prefer the simplest efficient approach over clever one-liners, custom classes, decorators, deep nesting or heavy abstractions.",
  deliverables,
});

const nonCodePlaybook = (
  o: Omit<DomainPlaybook, "buildsCode" | "unitNoun" | "unitNounPlural"> &
    Partial<Pick<DomainPlaybook, "unitNoun" | "unitNounPlural">>,
): DomainPlaybook => ({
  buildsCode: false,
  unitNoun: o.unitNoun ?? "Deliverable",
  unitNounPlural: o.unitNounPlural ?? "Project deliverables",
  ...o,
});

const PM_DELIVERABLES = [
  "Project definition (what, why, for whom, success criteria, in scope vs out of scope)",
  "Project charter and objectives",
  "Stakeholder map and RACI responsibility matrix",
  "Scope statement and work breakdown structure (WBS)",
  "Schedule with tasks, durations, dependencies and milestones (Gantt-style table)",
  "Resource plan and budget estimate",
  "Risk register with likelihood, impact and mitigation",
  "Communication plan and reporting cadence",
  "Change control / scope-creep handling process",
  "Progress tracking: status report, % complete, blockers, schedule and budget variance",
  "Quality plan and acceptance criteria",
  "Closure: deliverable sign-off, lessons learned, archive and resource release",
];

const PM: DomainPlaybook = nonCodePlaybook({
  unitNoun: "Deliverable",
  unitNounPlural: "Project management deliverables",
  headline: "Project management plan",
  subhead:
    "Each step produces a real management deliverable — charter, WBS, schedule, risk register, status reports and closure. No coding required.",
  planInstructions:
    "This is a PROJECT MANAGEMENT project. There is NO CODE anywhere. Every section is a management deliverable a project manager actually produces, in real project order: define the project, plan the work, plan people and responsibilities, plan the schedule, plan cost and resources, plan risk, plan communication, execute and track progress, control scope and change, then close the project with lessons learned. Titles must be plain deliverable names such as 'Define the Project', 'Project Charter', 'Stakeholder Map', 'Scope and WBS', 'Schedule and Dependencies', 'Budget and Resources', 'Risk Register', 'Communication Plan', 'Track Progress', 'Close the Project'. Never use a 'structure' section and never mention programming. All sections after the first use kind 'step'.",
  sectionTask:
    "Produce the actual management deliverable for THIS section as a real, usable document — never code. Split it into 2-5 blocks. For each block, put the deliverable content itself in `code` as clean plain text or a markdown table (for example a WBS list, a schedule table with Task | Duration | Dependency | Owner, a RACI matrix, or a risk register table with Risk | Likelihood | Impact | Mitigation | Owner), and use `explanation` for 2-4 plain-language bullets telling the student how to read, use and defend it. Fill the tables with realistic, project-specific rows — never placeholders like 'TBD'. Set `language` to 'markdown', return an empty `files` array and null `structure`.",
  deliverables: PM_DELIVERABLES,
});

const RESEARCH: DomainPlaybook = nonCodePlaybook({
  unitNoun: "Stage",
  unitNounPlural: "Research stages",
  headline: "Research plan",
  subhead:
    "Each stage produces part of your study — problem, literature, method, data, analysis, findings.",
  planInstructions:
    "This is a RESEARCH project. Sections are research stages (research problem, literature review, research questions and hypotheses, methodology, data collection plan, analysis plan, findings, discussion, limitations, conclusion). Only include code if the study genuinely requires an analysis script; otherwise write no code. Never use a 'structure' section.",
  sectionTask:
    "Produce the written research content for THIS stage. Use `code` only when a short analysis snippet is genuinely needed; otherwise leave `code` empty and put the substance in `explanation` as clear academic prose or structured points (e.g. a comparison table of prior studies, a variable table, a sampling plan). Set `language` to 'markdown', return an empty `files` array and null `structure`.",
  deliverables: [
    "Research problem and rationale",
    "Literature review matrix",
    "Research questions and hypotheses",
    "Methodology and study design",
    "Sampling and data collection plan",
    "Analysis plan",
    "Findings, discussion and limitations",
  ],
});

const BUSINESS: DomainPlaybook = nonCodePlaybook({
  unitNoun: "Deliverable",
  unitNounPlural: "Business deliverables",
  headline: "Business plan steps",
  subhead: "Each step produces a business deliverable — no coding required.",
  planInstructions:
    "This is a BUSINESS / MANAGEMENT project. Sections are business deliverables (problem and opportunity, market and competitor analysis, customer segments, value proposition, business model, operations plan, financial projections, go-to-market, risks, recommendations). No code, no 'structure' section.",
  sectionTask:
    "Produce the real business deliverable for THIS section. Put tables and frameworks (SWOT, competitor matrix, cost breakdown, projections) in `code` as markdown tables and use `explanation` for 2-4 plain-language bullets. Never write programming code. Set `language` to 'markdown', return an empty `files` array and null `structure`.",
  deliverables: [
    "Problem and opportunity",
    "Market and competitor analysis",
    "Value proposition and segments",
    "Business model and operations",
    "Financials and projections",
    "Go-to-market and risks",
  ],
});

const PLAYBOOKS: Record<string, DomainPlaybook> = {
  project_management: PM,
  research: RESEARCH,
  business: BUSINESS,
  software: codePlaybook(["Architecture", "Features", "Tests", "Deployment"]),
  web: codePlaybook(["Pages", "API", "Database", "Deployment"]),
  mobile: codePlaybook(["Screens", "State", "Device APIs", "Builds"]),
  data_science: codePlaybook(["Dataset", "EDA", "Model", "Evaluation"]),
  ml_ai: codePlaybook(["Dataset", "Training", "Evaluation", "Serving"]),
  analytics: codePlaybook(["Data", "Cleaning", "Analysis", "Dashboard"]),
  cybersecurity: codePlaybook(["Scope", "Threat model", "Testing", "Mitigation"]),
  cloud: codePlaybook(["Architecture", "Provisioning", "Deployment", "Reliability"]),
  iot: codePlaybook(["Hardware", "Firmware", "Connectivity", "Dashboard"]),
  engineering: codePlaybook(["Design", "Simulation", "Build", "Validation"]),
};

const DEFAULT_PLAYBOOK = codePlaybook(["Plan", "Build", "Test", "Document"]);

export function getPlaybook(domain: string | null | undefined): DomainPlaybook {
  return (domain && PLAYBOOKS[domain]) || DEFAULT_PLAYBOOK;
}

export const domainBuildsCode = (domain: string | null | undefined) =>
  getPlaybook(domain).buildsCode;
