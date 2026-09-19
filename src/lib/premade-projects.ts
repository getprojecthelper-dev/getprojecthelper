/**
 * Static catalogue of projects students can buy once.
 * Purchasing creates a real project in their workspace, pre-filled with a
 * detailed brief so the guided builder can take over from there.
 */

export interface PremadeProject {
  id: string;
  title: string;
  domain: "software" | "data_science" | "project_management";
  level: "Beginner" | "Intermediate" | "Advanced";
  /** Stable payment-catalog identifiers shared between test and live. */
  productId: string;
  priceId: string;
  summary: string;
  /** Seeded into the project as its description — feeds every AI generation. */
  brief: string;
  stack: string;
}

export const PREMADE_PROJECTS: PremadeProject[] = [
  {
    id: "campus-event-planner",
    title: "Campus Event Planner",
    domain: "software",
    level: "Beginner",
    productId: "campus_event_planner",
    priceId: "campus_event_planner_once",
    summary:
      "A web app where student clubs publish events, students RSVP, and organisers track attendance.",
    brief:
      "Build a campus event planner web application. Student clubs can create and publish events with date, venue and capacity; students can browse, search and RSVP; organisers see attendance lists and simple analytics. Include authentication, a clean event feed, and an organiser dashboard.",
    stack: "React, Node.js, PostgreSQL",
  },
  {
    id: "personal-finance-tracker",
    title: "Personal Finance Tracker",
    domain: "software",
    level: "Intermediate",
    productId: "personal_finance_tracker",
    priceId: "personal_finance_tracker_once",
    summary:
      "Track income and expenses, set monthly budgets, and visualise spending habits over time.",
    brief:
      "Build a personal finance tracker. Users record income and expenses with categories, set monthly budgets per category, and see charts of spending over time. Include recurring transactions, budget warnings, CSV export and a dashboard summarising the current month.",
    stack: "React, Node.js, PostgreSQL, Chart.js",
  },
  {
    id: "flight-delay-predictor",
    title: "Flight Delay Predictor",
    domain: "data_science",
    level: "Intermediate",
    productId: "flight_delay_predictor",
    priceId: "flight_delay_predictor_once",
    summary:
      "Predict arrival delays from historical flight data and compare classification models.",
    brief:
      "Build a flight delay prediction project. Using a public flights dataset, clean and explore the data, engineer features such as route, carrier, time of day and season, then train and compare classification models (logistic regression, random forest, gradient boosting) to predict whether a flight arrives delayed. Evaluate with precision, recall, F1 and a confusion matrix, and document which features matter most.",
    stack: "Python, pandas, scikit-learn, Jupyter",
  },
  {
    id: "student-performance-analysis",
    title: "Student Performance Analysis",
    domain: "data_science",
    level: "Beginner",
    productId: "student_performance_analysis",
    priceId: "student_performance_analysis_once",
    summary:
      "Explore which factors influence exam scores and present the findings as a data story.",
    brief:
      "Analyse a student performance dataset to find which factors (study time, attendance, parental education, test preparation) influence exam scores. Clean the data, run exploratory analysis with clear visualisations, quantify correlations, and finish with a written data story summarising actionable findings for students and teachers.",
    stack: "Python, pandas, matplotlib, Jupyter",
  },
  {
    id: "website-redesign-pm",
    title: "Website Redesign Project Plan",
    domain: "project_management",
    level: "Beginner",
    productId: "website_redesign_pm",
    priceId: "website_redesign_pm_once",
    summary:
      "Manage a small business website redesign from charter to closure with real PM deliverables.",
    brief:
      "Plan and manage the redesign of a small business website as a complete project management exercise. Produce a project charter, stakeholder register, work breakdown structure, schedule, budget, risk register and status reports, then close with a lessons-learned review. The client is a fictional local bakery with 5 pages, a menu and a contact form.",
    stack: "Word, Excel, Project Helper workspace",
  },
  {
    id: "office-relocation-pm",
    title: "Office Relocation Project",
    domain: "project_management",
    level: "Advanced",
    productId: "office_relocation_pm",
    priceId: "office_relocation_pm_once",
    summary:
      "Plan a 60-person office move: scope, vendors, budget, risks and a week-by-week schedule.",
    brief:
      "Plan the relocation of a 60-person company to a new office over 12 weeks. Deliver a project charter, stakeholder and communication plan, work breakdown structure, vendor comparison, detailed budget, risk register with mitigations, and a week-by-week schedule culminating in move weekend and post-move review.",
    stack: "Word, Excel, Project Helper workspace",
  },
];

export function getPremadeProject(id: string): PremadeProject | undefined {
  return PREMADE_PROJECTS.find((p) => p.id === id);
}
