/**
 * Credit pricing — shared by the server (holds/settlement) and the UI (meter).
 * 1 credit ≈ 1,000 AI tokens. Holds are estimates; the real cost is settled
 * from the model's reported token usage once the run finishes.
 */

export type CreditAction =
  | "suggest_projects"
  | "find_datasets"
  | "plan_sections"
  | "section_overview"
  | "section_draft"
  | "section_review"
  | "section_fix"
  | "general";

/** Estimated credits reserved before an AI run starts. */
export const CREDIT_HOLDS: Record<CreditAction, number> = {
  suggest_projects: 2,
  find_datasets: 2,
  plan_sections: 4,
  section_overview: 5,
  section_draft: 6,
  section_review: 4,
  section_fix: 5,
  general: 3,
};

/** What the meter shows the student while a multi-call action runs. */
export const ACTION_LABELS: Record<string, { label: string; estimate: number }> = {
  suggest_projects: { label: "Finding project ideas", estimate: 2 },
  find_datasets: { label: "Searching datasets", estimate: 2 },
  create_project: { label: "Planning your build", estimate: 4 },
  generate_section: { label: "Writing this step", estimate: 10 },
  fix_section: { label: "Fixing your error", estimate: 5 },
};

export const holdFor = (feature: string) =>
  CREDIT_HOLDS[(feature as CreditAction) in CREDIT_HOLDS ? (feature as CreditAction) : "general"];

/** Credits charged for a completed AI call, from real token usage. */
export const creditsForTokens = (totalTokens: number) =>
  Math.max(0.1, Number((totalTokens / 1000).toFixed(2)));

export const formatCredits = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, "");

export const STARTER_CREDITS = 50;

export const CREDIT_PACKS = [
  { id: "starter", name: "Starter", credits: 200, priceUsd: 5, blurb: "A few sections and revisions." },
  { id: "builder", name: "Builder", credits: 550, priceUsd: 12, blurb: "A full project, start to finish.", popular: true },
  { id: "semester", name: "Semester", credits: 1200, priceUsd: 20, blurb: "Multiple projects and a viva." },
] as const;
