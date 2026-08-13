/**
 * Credit pricing — shared by the server (holds/settlement) and the UI (meter).
 * 1 credit ≈ 1,000 AI tokens. Holds are estimates; the real cost is settled
 * from the model's reported token usage once the run finishes.
 */

export type CreditAction =
  | "suggest_projects"
  | "find_datasets"
  | "find_papers"
  | "plan_sections"
  | "section_overview"
  | "section_draft"
  | "section_review"
  | "section_fix"
  | "mentor_chat"
  | "generate_document"
  | "revise_document"
  | "analyze_document"
  | "pm_schedule"
  | "pm_raci"
  | "pm_budget"
  | "pm_risks"
  | "pm_status_report"
  | "pm_report_pdf"
  | "general";

/** Estimated credits reserved before an AI run starts. */
export const CREDIT_HOLDS: Record<CreditAction, number> = {
  suggest_projects: 2,
  find_datasets: 2,
  find_papers: 2,
  plan_sections: 4,
  section_overview: 5,
  section_draft: 6,
  section_review: 4,
  section_fix: 5,
  mentor_chat: 3,
  generate_document: 12,
  revise_document: 8,
  analyze_document: 5,
  pm_schedule: 6,
  pm_raci: 5,
  pm_budget: 5,
  pm_risks: 5,
  pm_status_report: 6,
  pm_report_pdf: 4,
  general: 3,
};

/** What the meter shows the student while a multi-call action runs. */
export const ACTION_LABELS: Record<string, { label: string; estimate: number }> = {
  suggest_projects: { label: "Finding project ideas", estimate: 2 },
  find_datasets: { label: "Searching datasets", estimate: 2 },
  find_papers: { label: "Finding research papers", estimate: 2 },
  create_project: { label: "Planning your build", estimate: 4 },
  generate_section: { label: "Writing this step", estimate: 10 },
  fix_section: { label: "Fixing your error", estimate: 5 },
  mentor_chat: { label: "Mentor is thinking", estimate: 3 },
  generate_document: { label: "Writing your document", estimate: 12 },
  revise_document: { label: "Revising your paper", estimate: 8 },
  analyze_document: { label: "Checking originality", estimate: 5 },
  pm_schedule: { label: "Building your schedule", estimate: 6 },
  pm_raci: { label: "Mapping stakeholders", estimate: 5 },
  pm_budget: { label: "Estimating budget", estimate: 5 },
  pm_risks: { label: "Creating risk register", estimate: 5 },
  pm_status_report: { label: "Writing status report", estimate: 6 },
  pm_report_pdf: { label: "Exporting PDF report", estimate: 4 },
};

export const holdFor = (feature: string) =>
  CREDIT_HOLDS[(feature as CreditAction) in CREDIT_HOLDS ? (feature as CreditAction) : "general"];

/** Credits charged for a completed AI call, from real token usage. */
export const creditsForTokens = (totalTokens: number) =>
  Math.max(0.1, Number((totalTokens / 1000).toFixed(2)));

export const formatCredits = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, "");

export const STARTER_CREDITS = 50;

/** Public price list lives in pricing.ts; re-exported here for older imports. */
export { PACKS as CREDIT_PACKS } from "@/lib/pricing";
