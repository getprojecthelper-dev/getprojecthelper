/** Subscription plans. 1 credit ≈ 1,000 tokens, so credits = tokens / 1000. */
export type PlanId = "free" | "starter" | "student" | "professional";

export interface Plan {
  id: PlanId;
  name: string;
  inrPrice: number;
  priceId: string | null;
  tagline: string;
  tokens: string;
  credits: number;
  projectLimit: number;
  badge?: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free", name: "New User", inrPrice: 0, priceId: null, tagline: "One-time welcome allowance",
    tokens: "100K", credits: 100, projectLimit: 1,
    features: ["100K token-equivalent credits", "1 project trial", "Basic project ideas", "Sample documentation", "Limited AI Mentor"],
  },
  {
    id: "starter", name: "Starter", inrPrice: 199, priceId: "starter_monthly", tagline: "For beginners",
    tokens: "1M", credits: 1000, projectLimit: 2,
    features: ["1M token-equivalent credits", "2 active projects", "Problem statements and abstracts", "Basic code generation", "README and documentation", "ZIP downloads"],
  },
  {
    id: "student", name: "Student", inrPrice: 399, priceId: "student_monthly", tagline: "Best value", badge: "Best value",
    tokens: "3M", credits: 3000, projectLimit: 5,
    features: ["3M token-equivalent credits", "5 active projects", "Complete Python and ML projects", "Dataset recommendations", "Full project documentation", "Code debugging and regeneration", "AI Mentor", "ZIP downloads"],
  },
  {
    id: "professional", name: "Professional", inrPrice: 999, priceId: "professional_monthly", tagline: "For serious builders",
    tokens: "10M", credits: 10000, projectLimit: 15,
    features: ["10M token-equivalent credits", "15 active projects", "Advanced full-stack development", "More code regeneration", "Advanced debugging", "Priority processing", "Complete project documentation", "Higher usage limits"],
  },
];

export const getPlan = (id: string | null | undefined): Plan =>
  PLANS.find((p) => p.id === id) ?? PLANS[0]!;

export const planForPriceId = (priceId: string | null | undefined): Plan | null =>
  PLANS.find((p) => p.priceId && p.priceId === priceId) ?? null;
