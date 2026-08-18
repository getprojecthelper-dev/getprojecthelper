/**
 * Pure domain logic for Project Helper.
 * No React, no data fetching — just types, constants and deterministic maths.
 */

export const DOMAINS = [
  { value: "software", label: "Software Development" },
  { value: "project_management", label: "Project Management" },
  { value: "data_science", label: "Data Science" },
  { value: "it", label: "IT (Systems, Networks & Support)" },
] as const;

export const PURPOSES = [
  { value: "academic", label: "Academic" },
  { value: "personal", label: "Personal" },
  { value: "professional", label: "Professional" },
] as const;

export const ACADEMIC_LEVELS = [
  { value: "school", label: "School" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "masters", label: "Masters" },
  { value: "phd", label: "PhD" },
  { value: "none", label: "Not academic" },
] as const;

export const STAGES = [
  "planning",
  "requirements",
  "research",
  "development",
  "testing",
  "documentation",
  "review",
  "presentation",
  "showcase",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  planning: "Planning",
  requirements: "Requirements",
  research: "Research",
  development: "Development",
  testing: "Testing",
  documentation: "Documentation",
  review: "Review",
  presentation: "Presentation",
  showcase: "Showcase",
};

export interface ProjectTemplate {
  value: string;
  label: string;
  description: string;
  workflow: string[];
  documentSections: string[];
  starterTasks: { title: string; stage: Stage }[];
}

const DEFAULT_DOC_SECTIONS = [
  "Introduction",
  "Literature Review",
  "Methodology",
  "System Design",
  "Implementation",
  "Results",
  "Discussion",
  "Conclusion",
  "References",
];

export const TEMPLATES: ProjectTemplate[] = [
  {
    value: "software",
    label: "Software Development",
    description: "Requirements-driven build with architecture, testing and deployment.",
    workflow: [
      "Requirements",
      "Architecture",
      "Development",
      "Testing",
      "Deployment",
      "Documentation",
    ],
    documentSections: DEFAULT_DOC_SECTIONS,
    starterTasks: [
      { title: "Define project scope and objective", stage: "planning" },
      { title: "Write functional requirements", stage: "requirements" },
      { title: "Design system architecture", stage: "development" },
      { title: "Implement core features", stage: "development" },
      { title: "Write and run test cases", stage: "testing" },
      { title: "Draft final report", stage: "documentation" },
    ],
  },
  {
    value: "data_science",
    label: "Data Science / Machine Learning",
    description: "Problem framing through dataset, EDA, modelling and evaluation.",
    workflow: [
      "Problem",
      "Dataset",
      "Cleaning",
      "EDA",
      "Feature Engineering",
      "Modelling",
      "Evaluation",
      "Documentation",
    ],
    documentSections: DEFAULT_DOC_SECTIONS,
    starterTasks: [
      { title: "Define the prediction problem and success metric", stage: "planning" },
      { title: "Acquire and document the dataset", stage: "research" },
      { title: "Clean data and handle missing values", stage: "development" },
      { title: "Exploratory data analysis", stage: "development" },
      { title: "Train baseline model", stage: "development" },
      { title: "Evaluate model (precision, recall, F1, confusion matrix)", stage: "testing" },
      { title: "Document methodology and results", stage: "documentation" },
    ],
  },
  {
    value: "analytics",
    label: "Data Analytics",
    description: "Question-led analysis with cleaning, insight and reporting.",
    workflow: ["Questions", "Data", "Cleaning", "Analysis", "Visualisation", "Report"],
    documentSections: DEFAULT_DOC_SECTIONS,
    starterTasks: [
      { title: "Define the analytical questions", stage: "planning" },
      { title: "Collect and validate data", stage: "research" },
      { title: "Build analysis and visualisations", stage: "development" },
      { title: "Validate findings", stage: "testing" },
      { title: "Write the report", stage: "documentation" },
    ],
  },
  {
    value: "cybersecurity",
    label: "Cybersecurity",
    description: "Scoped assessment with threat model, controlled testing and mitigation.",
    workflow: [
      "Scope",
      "Assets",
      "Threat Model",
      "Risk Assessment",
      "Controlled Testing",
      "Findings",
      "Mitigation",
      "Validation",
      "Report",
    ],
    documentSections: [
      "Introduction",
      "Scope and Assets",
      "Threat Model",
      "Methodology",
      "Findings",
      "Risk Assessment",
      "Mitigation",
      "Validation",
      "Conclusion",
      "References",
    ],
    starterTasks: [
      { title: "Define scope and rules of engagement", stage: "planning" },
      { title: "Inventory assets", stage: "requirements" },
      { title: "Build threat model", stage: "research" },
      { title: "Run controlled testing", stage: "testing" },
      { title: "Document findings and mitigations", stage: "documentation" },
    ],
  },
  {
    value: "research",
    label: "Research",
    description: "Literature-led enquiry from research question to conclusion.",
    workflow: [
      "Problem",
      "Literature Review",
      "Research Question",
      "Methodology",
      "Data Collection",
      "Analysis",
      "Findings",
      "Discussion",
      "Conclusion",
    ],
    documentSections: [
      "Abstract",
      "Introduction",
      "Literature Review",
      "Research Questions",
      "Methodology",
      "Analysis",
      "Findings",
      "Discussion",
      "Conclusion",
      "References",
    ],
    starterTasks: [
      { title: "Frame the research problem", stage: "planning" },
      { title: "Conduct literature review", stage: "research" },
      { title: "Define methodology", stage: "requirements" },
      { title: "Collect data", stage: "development" },
      { title: "Analyse and interpret findings", stage: "testing" },
      { title: "Write discussion and conclusion", stage: "documentation" },
    ],
  },
  {
    value: "cloud",
    label: "Cloud Computing",
    description: "Architecture, provisioning, deployment and reliability testing.",
    workflow: ["Requirements", "Architecture", "Provisioning", "Deployment", "Testing", "Documentation"],
    documentSections: DEFAULT_DOC_SECTIONS,
    starterTasks: [
      { title: "Define workload requirements", stage: "requirements" },
      { title: "Design cloud architecture", stage: "development" },
      { title: "Provision environment", stage: "development" },
      { title: "Load and failure testing", stage: "testing" },
      { title: "Document architecture decisions", stage: "documentation" },
    ],
  },
  {
    value: "it",
    label: "IT (Systems, Networks & Support)",
    description:
      "Infrastructure, networking, automation and support systems — set up, secure, automate and document.",
    workflow: [
      "Requirements",
      "Network / System Design",
      "Setup & Configuration",
      "Automation & Scripting",
      "Security Hardening",
      "Testing",
      "Documentation",
    ],
    documentSections: DEFAULT_DOC_SECTIONS,
    starterTasks: [
      { title: "Define the IT need and success criteria", stage: "planning" },
      { title: "Document current setup and requirements", stage: "requirements" },
      { title: "Design the network / system topology", stage: "development" },
      { title: "Configure servers, services and access control", stage: "development" },
      { title: "Automate routine tasks with scripts", stage: "development" },
      { title: "Test connectivity, backups and recovery", stage: "testing" },
      { title: "Write the runbook and support documentation", stage: "documentation" },
    ],
  },
  {
    value: "project_management",
    label: "Project Management",
    description:
      "Charter to closure: scope, schedule, budget, risk, stakeholders and lessons learned.",
    workflow: [
      "Initiation",
      "Stakeholders",
      "Scope",
      "Schedule",
      "Budget",
      "Risk",
      "Execution",
      "Monitoring",
      "Closure",
    ],
    documentSections: [
      "Executive Summary",
      "Project Charter",
      "Stakeholder Analysis",
      "Scope and WBS",
      "Schedule and Milestones",
      "Budget and Resources",
      "Risk Register",
      "Quality and Communication Plan",
      "Monitoring and Control",
      "Closure and Lessons Learned",
      "References",
    ],
    starterTasks: [
      { title: "Write the project charter and objectives", stage: "planning" },
      { title: "Map stakeholders and communication plan", stage: "planning" },
      { title: "Define scope and build the work breakdown structure", stage: "requirements" },
      { title: "Build the schedule (Gantt / milestones)", stage: "requirements" },
      { title: "Estimate budget and allocate resources", stage: "development" },
      { title: "Create the risk register with mitigations", stage: "research" },
      { title: "Track progress against baseline (status reports)", stage: "testing" },
      { title: "Write closure report and lessons learned", stage: "documentation" },
    ],
  },
  {
    value: "custom",
    label: "Custom Project",
    description: "A blank lifecycle you shape yourself.",
    workflow: ["Plan", "Build", "Test", "Document", "Review", "Showcase"],
    documentSections: DEFAULT_DOC_SECTIONS,
    starterTasks: [
      { title: "Define objective and success criteria", stage: "planning" },
      { title: "Break the work into milestones", stage: "planning" },
    ],
  },
];

export function getTemplate(value: string | null | undefined): ProjectTemplate {
  return TEMPLATES.find((t) => t.value === value) ?? TEMPLATES[TEMPLATES.length - 1]!;
}

export const TASK_STATUSES = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "completed", label: "Completed" },
] as const;

export const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

export const REQUIREMENT_TYPES = [
  { value: "functional", label: "Functional" },
  { value: "non_functional", label: "Non-Functional" },
  { value: "business", label: "Business" },
  { value: "technical", label: "Technical" },
] as const;

export const REQUIREMENT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
] as const;

export const TEST_STATUSES = [
  { value: "not_run", label: "Not Run" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "blocked", label: "Blocked" },
] as const;

export const DOC_STATUSES = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "complete", label: "Complete" },
] as const;

export const RISK_SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

export function labelOf(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined,
): string {
  return options.find((o) => o.value === value)?.label ?? value ?? "—";
}

/* ---------------------------------------------------------------- metrics */

export interface ProjectSignals {
  tasks: { title?: string; status: string; due_date: string | null; priority: string }[];
  requirements: { status: string }[];
  tests: { status: string }[];
  docSections: { status: string }[];
  risks: { status: string; severity: string }[];
  deadline: string | null;
  /** Project-management structured signals (optional). */
  pmSchedule?: {
    name?: string;
    task_name?: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
  }[];
  pmBudget?: { planned: number; actual: number }[];
  pmRisks?: {
    title?: string;
    status: string;
    severity: string;
    likelihood?: string | undefined;
    impact?: string | undefined;
  }[];
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function ratio(done: number, total: number) {
  return total === 0 ? 0 : done / total;
}

/** Progress is derived from real completion signals, never entered by hand. */
export function computeProgress(s: ProjectSignals): number {
  const parts: { weight: number; value: number; total: number }[] = [
    {
      weight: 0.35,
      value: s.tasks.filter((t) => t.status === "completed").length,
      total: s.tasks.length,
    },
    {
      weight: 0.2,
      value: s.requirements.filter((r) => r.status === "completed").length,
      total: s.requirements.length,
    },
    {
      weight: 0.2,
      value: s.tests.filter((t) => t.status === "passed").length,
      total: s.tests.length,
    },
    {
      weight: 0.25,
      value: s.docSections.filter((d) => d.status === "complete").length,
      total: s.docSections.length,
    },
  ];
  const active = parts.filter((p) => p.total > 0);
  if (active.length === 0) return 0;
  const weightSum = active.reduce((a, p) => a + p.weight, 0);
  const score = active.reduce((a, p) => a + p.weight * ratio(p.value, p.total), 0);
  return clamp((score / weightSum) * 100);
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / 86_400_000);
}

export function isOverdue(due: string | null, status: string): boolean {
  if (!due || status === "completed") return false;
  const d = daysUntil(due);
  return d !== null && d < 0;
}

export interface HealthResult {
  score: number;
  factors: { label: string; penalty: number }[];
}

/** Deterministic MVP health model — penalties applied to a perfect score. */
export function computeHealth(s: ProjectSignals, progress: number): HealthResult {
  const factors: { label: string; penalty: number }[] = [];

  const overdue = s.tasks.filter((t) => isOverdue(t.due_date, t.status)).length;
  if (overdue > 0) factors.push({ label: `${overdue} overdue task(s)`, penalty: Math.min(30, overdue * 8) });

  const blocked = s.tasks.filter((t) => t.status === "blocked").length;
  if (blocked > 0) factors.push({ label: `${blocked} blocked task(s)`, penalty: Math.min(15, blocked * 5) });

  const openRisks = s.risks.filter((r) => r.status === "open");
  const highRisks = openRisks.filter((r) => r.severity === "high").length;
  if (openRisks.length > 0)
    factors.push({
      label: `${openRisks.length} unresolved risk(s)`,
      penalty: Math.min(25, openRisks.length * 5 + highRisks * 5),
    });

  const pmOpenRisks = (s.pmRisks ?? []).filter((r) => r.status === "open");
  const pmHighRisks = pmOpenRisks.filter(
    (r) =>
      (r.impact === "high" || r.severity === "high") &&
      (r.likelihood === "high" || r.likelihood === "almost_certain"),
  ).length;
  if (pmOpenRisks.length > 0)
    factors.push({
      label: `${pmOpenRisks.length} open PM risk(s)`,
      penalty: Math.min(20, pmOpenRisks.length * 4 + pmHighRisks * 6),
    });

  const failed = s.tests.filter((t) => t.status === "failed").length;
  if (failed > 0) factors.push({ label: `${failed} failing test(s)`, penalty: Math.min(20, failed * 7) });

  if (s.tests.length === 0 && progress > 40)
    factors.push({ label: "No test cases recorded", penalty: 10 });

  if (s.docSections.filter((d) => d.status === "complete").length === 0 && progress > 50)
    factors.push({ label: "Documentation not started", penalty: 10 });

  const lateSchedule = (s.pmSchedule ?? []).filter(
    (t) => t.end_date && t.status !== "completed" && daysUntil(t.end_date)! < 0,
  ).length;
  if (lateSchedule > 0)
    factors.push({
      label: `${lateSchedule} late schedule task(s)`,
      penalty: Math.min(25, lateSchedule * 7),
    });

  const budget = s.pmBudget ?? [];
  const totalPlanned = budget.reduce((a, b) => a + (Number(b.planned) || 0), 0);
  const totalActual = budget.reduce((a, b) => a + (Number(b.actual) || 0), 0);
  if (totalPlanned > 0 && totalActual > totalPlanned * 1.1) {
    factors.push({
      label: "Budget overrun",
      penalty: Math.min(20, Math.round(((totalActual - totalPlanned) / totalPlanned) * 20)),
    });
  }

  const days = daysUntil(s.deadline);
  if (days !== null && days <= 21) {
    const pressure = Math.round(((21 - Math.max(days, -14)) / 35) * (100 - progress) * 0.45);
    if (pressure > 0)
      factors.push({
        label: days < 0 ? "Deadline passed" : `${days} day(s) to deadline vs remaining work`,
        penalty: Math.min(30, pressure),
      });
  }

  const total = factors.reduce((a, f) => a + f.penalty, 0);
  return { score: clamp(100 - total), factors };
}

export interface NextAction {
  title: string;
  reason: string;
  to: string;
}

/** The single most useful next step, derived from real project state. */
export function computeNextAction(s: ProjectSignals, progress: number): NextAction {
  const overdue = s.tasks.filter((t) => isOverdue(t.due_date, t.status));
  if (overdue.length > 0)
    return {
      title: `Clear overdue task: ${overdue[0]!.title ?? "overdue work"}`,
      reason: "Overdue work drags every downstream stage and damages project health.",
      to: "tasks",
    };

  const pmLate = (s.pmSchedule ?? []).filter(
    (t) => t.end_date && t.status !== "completed" && daysUntil(t.end_date)! < 0,
  );
  if (pmLate.length > 0)
    return {
      title: `Catch up schedule: ${pmLate[0]!.name ?? pmLate[0]!.task_name ?? "late task"}`,
      reason: "Late schedule tasks push milestones and threaten the project deadline.",
      to: "schedule",
    };

  const pmHighRisk = (s.pmRisks ?? []).find(
    (r) =>
      r.status === "open" &&
      (r.impact === "high" || r.severity === "high") &&
      (r.likelihood === "high" || r.likelihood === "almost_certain"),
  );
  if (pmHighRisk)
    return {
      title: `Mitigate high risk: ${pmHighRisk.title ?? "open risk"}`,
      reason: "High-likelihood, high-impact risks need an owner and a mitigation plan now.",
      to: "risks",
    };

  const budget = s.pmBudget ?? [];
  const totalPlanned = budget.reduce((a, b) => a + (Number(b.planned) || 0), 0);
  const totalActual = budget.reduce((a, b) => a + (Number(b.actual) || 0), 0);
  if (totalPlanned > 0 && totalActual > totalPlanned * 1.1)
    return {
      title: "Review budget overrun",
      reason: "Actual spend has passed the planned budget; re-baseline or cut scope.",
      to: "budget",
    };

  if (s.requirements.length === 0)
    return {
      title: "Define your first requirements",
      reason: "Without requirements there is nothing to trace tasks, tests or evidence back to.",
      to: "requirements",
    };

  if (s.tasks.length === 0)
    return {
      title: "Break the plan into tasks",
      reason: "Your plan has no executable work items yet, so progress cannot be measured.",
      to: "tasks",
    };

  const blocked = s.tasks.filter((t) => t.status === "blocked");
  if (blocked.length > 0)
    return {
      title: "Resolve blocked work",
      reason: "Blocked tasks stop delivery and usually need a decision, not more effort.",
      to: "tasks",
    };

  const failed = s.tests.filter((t) => t.status === "failed").length;
  if (failed > 0)
    return {
      title: "Fix failing tests",
      reason: "Failing tests mean recorded results are not yet trustworthy.",
      to: "testing",
    };

  const reqDone = s.requirements.filter((r) => r.status === "completed").length;
  if (s.tests.length === 0 && reqDone > 0)
    return {
      title: "Write test cases for completed requirements",
      reason: "Completed requirements without tests leave no evidence of correctness.",
      to: "testing",
    };

  const inProgress = s.tasks.find((t) => t.status === "in_progress");
  if (inProgress)
    return {
      title: `Finish: ${inProgress.title ?? "work in progress"}`,
      reason: "Closing in-flight work before starting new work keeps progress honest.",
      to: "tasks",
    };

  const unfinishedDocs = s.docSections.filter((d) => d.status !== "complete").length;
  if (progress > 50 && unfinishedDocs > 0)
    return {
      title: "Complete the next documentation section",
      reason: "Testing and build are ahead of documentation, which is now the blocking stage.",
      to: "documents",
    };

  const notStarted = s.tasks.find((t) => t.status === "not_started");
  if (notStarted)
    return {
      title: `Start: ${notStarted.title ?? "next task"}`,
      reason: "This is the next unstarted item in your plan.",
      to: "tasks",
    };

  return {
    title: "Run a project review",
    reason: "Everything recorded is complete — review the project before presenting it.",
    to: "review",
  };
}

export type ReviewState = "complete" | "attention" | "at_risk" | "empty";

export interface ReviewArea {
  area: string;
  state: ReviewState;
  detail: string;
}

export function computeReview(s: ProjectSignals): ReviewArea[] {
  const pct = (d: number, t: number) => (t === 0 ? 0 : Math.round((d / t) * 100));
  const grade = (value: number, total: number, emptyMsg: string, unit: string): ReviewState => {
    if (total === 0) return "empty";
    const p = pct(value, total);
    void emptyMsg;
    void unit;
    return p >= 90 ? "complete" : p >= 50 ? "attention" : "at_risk";
  };

  const tasksDone = s.tasks.filter((t) => t.status === "completed").length;
  const reqDone = s.requirements.filter((r) => r.status === "completed").length;
  const testsPassed = s.tests.filter((t) => t.status === "passed").length;
  const docsDone = s.docSections.filter((d) => d.status === "complete").length;
  const scheduleDone = (s.pmSchedule ?? []).filter((t) => t.status === "completed").length;
  const budget = s.pmBudget ?? [];
  const budgetOk =
    budget.length === 0 ||
    budget.reduce((a, b) => a + (Number(b.actual) || 0), 0) <=
      budget.reduce((a, b) => a + (Number(b.planned) || 0), 0) * 1.1;

  const base: ReviewArea[] = [
    {
      area: "Planning",
      state: s.tasks.length === 0 ? "empty" : s.tasks.length >= 4 ? "complete" : "attention",
      detail: `${s.tasks.length} task(s) planned`,
    },
    {
      area: "Requirements",
      state: grade(reqDone, s.requirements.length, "", ""),
      detail: `${reqDone}/${s.requirements.length} completed`,
    },
    {
      area: "Development",
      state: grade(tasksDone, s.tasks.length, "", ""),
      detail: `${tasksDone}/${s.tasks.length} tasks done`,
    },
    {
      area: "Testing",
      state: grade(testsPassed, s.tests.length, "", ""),
      detail: `${testsPassed}/${s.tests.length} tests passing`,
    },
    {
      area: "Documentation",
      state: grade(docsDone, s.docSections.length, "", ""),
      detail: `${docsDone}/${s.docSections.length} sections complete`,
    },
    {
      area: "Research",
      state: "empty",
      detail: "Sources and notes recorded in the research workspace",
    },
    {
      area: "Presentation",
      state: docsDone > 0 && testsPassed > 0 ? "attention" : "empty",
      detail: "Prepare slides and viva answers in Showcase",
    },
  ];

  if ((s.pmSchedule ?? []).length > 0) {
    base.push({
      area: "Schedule",
      state: grade(scheduleDone, s.pmSchedule!.length, "", ""),
      detail: `${scheduleDone}/${s.pmSchedule!.length} schedule tasks done`,
    });
  }

  if (budget.length > 0) {
    base.push({
      area: "Budget",
      state: budgetOk ? "complete" : "at_risk",
      detail: budgetOk ? "Within planned budget" : "Budget overrun detected",
    });
  }

  return base;
}
