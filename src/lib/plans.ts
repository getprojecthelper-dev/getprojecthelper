/** Subscription plan allowances are expressed in customer-facing AI credits. */
export type PlanId = "free" | "starter" | "student" | "professional";

export interface Plan {
  id: PlanId;
  name: string;
  inrPrice: number;
  priceId: string | null;
  tagline: string;
  credits: number;
  projectLimit: number;
  badge?: string;
  /** Hidden from new purchases while existing subscribers keep their plan. */
  isPublic?: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    inrPrice: 0,
    priceId: null,
    tagline: "Explore your first project idea",
    credits: 100,
    projectLimit: 1,
    features: [
      "100 free joining credits",
      "1 active project",
      "Download files and folders as ZIP",
      "Project documentation",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    inrPrice: 199,
    priceId: "starter_monthly",
    tagline: "Plan your first complete project",
    credits: 1000,
    projectLimit: 2,
    isPublic: false,
    features: [
      "1,000 AI credits",
      "2 active projects",
      "Everything in Free",
      "Requirements, tasks and schedule",
      "Research and dataset guidance",
      "Core project documents",
      "Standard AI Mentor",
    ],
  },
  {
    id: "student",
    name: "Student",
    inrPrice: 399,
    priceId: "student_monthly",
    tagline: "For students building standout projects",
    badge: "Best value",
    credits: 1000,
    projectLimit: 3,
    features: [
      "1,000 credits each month",
      "3 active projects",
      "Better project suggestions",
      "Find relevant research papers",
      "Student viva practice",
      "Project documentation",
      "AI Project Mentor",
      "Build projects from a job description",
    ],
  },
  {
    id: "professional",
    name: "Max",
    inrPrice: 999,
    priceId: "professional_monthly",
    tagline: "For serious, production-ready builds",
    credits: 3000,
    projectLimit: 15,
    features: [
      "3,000 total credits",
      "15 active projects",
      "Everything in Student",
      "Production-level code",
    ],
  },
];

export const getPlan = (id: string | null | undefined): Plan =>
  PLANS.find((p) => p.id === id) ?? PLANS[0]!;

export const planForPriceId = (priceId: string | null | undefined): Plan | null =>
  PLANS.find((p) => p.priceId && p.priceId === priceId) ?? null;
