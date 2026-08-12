import {
  BookOpen,
  Bot,
  ClipboardList,
  FileText,
  FlaskConical,
  ListChecks,
  Presentation,
  TestTube,
  type LucideIcon,
} from "lucide-react";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  example: string;
};

const FEATURES: Feature[] = [
  {
    icon: ClipboardList,
    title: "Project Planning",
    body: "Start from a domain template and get a lifecycle, stages and starter tasks — not an empty board.",
    example: "e.g. “Install libraries” → “Load the dataset” → “Clean the data”.",
  },
  {
    icon: Bot,
    title: "AI Mentor",
    body: "A project-aware mentor that reads your real tasks, requirements and results, and challenges weak reasoning.",
    example: "Asks why a metric moved before it congratulates you on it.",
  },
  {
    icon: ListChecks,
    title: "Requirements Management",
    body: "Typed, prioritised requirements with acceptance criteria, traced through to tasks and tests.",
    example: "Every requirement shows the test that proves it.",
  },
  {
    icon: BookOpen,
    title: "Research Workspace",
    body: "Sources, notes and themes stay attached to the project instead of scattered across tabs.",
    example: "Papers, links and quotes grouped by the theme they support.",
  },
  {
    icon: FlaskConical,
    title: "Data & Experiments",
    body: "Record datasets, parameters, metrics and results so your evaluation story is reproducible.",
    example: "Run 3: max_depth=8 → F1 0.81, logged with the dataset used.",
  },
  {
    icon: TestTube,
    title: "Testing",
    body: "Test cases with expected and actual results, linked to the requirement they verify.",
    example: "Failing cases stay visible until they're actually fixed.",
  },
  {
    icon: FileText,
    title: "Documentation",
    body: "A structured report with per-section completion, so nothing is written the night before.",
    example: "Abstract, method, results, conclusion — each with a status.",
  },
  {
    icon: Presentation,
    title: "Showcase & Viva",
    body: "README, case study, CV lines and viva questions generated only from what your project actually contains.",
    example: "Practice questions drawn from your own recorded results.",
  },
];

export function FeatureGrid() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((f, i) => (
        <article
          key={f.title}
          tabIndex={0}
          style={{ transitionDelay: `${i * 60}ms` }}
          className={cn(
            "group panel p-5 transition-all duration-500 ease-out focus-visible:outline-none",
            "hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-lift)]",
            "focus-visible:-translate-y-1 focus-visible:border-primary/40 focus-visible:shadow-[var(--shadow-lift)]",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary transition-all duration-300 group-hover:bg-primary/10 group-focus-visible:bg-primary/10">
            <f.icon className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110" />
          </span>
          <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
          <p className="mt-0 max-h-0 overflow-hidden text-sm text-primary opacity-0 transition-all duration-300 group-hover:mt-2 group-hover:max-h-24 group-hover:opacity-100 group-focus-visible:mt-2 group-focus-visible:max-h-24 group-focus-visible:opacity-100">
            {f.example}
          </p>
        </article>
      ))}
    </div>
  );
}
