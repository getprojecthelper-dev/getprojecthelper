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
