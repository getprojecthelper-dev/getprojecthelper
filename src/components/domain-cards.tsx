import { Link } from "@tanstack/react-router";
import { BrainCircuit, Database, GraduationCap, Globe, Smartphone } from "lucide-react";

const DOMAINS = [
  {
    icon: Globe,
    name: "Web Development",
    body: "Build modern websites and full-stack web apps.",
    meta: "Plan · Code · Deploy",
  },
  {
    icon: Database,
    name: "Data Science",
    body: "Analyse datasets and train ML models end to end.",
    meta: "Dataset · Model · Report",
  },
  {
    icon: BrainCircuit,
    name: "Artificial Intelligence",
    body: "Design AI systems with honest evaluation.",
    meta: "Experiments · Metrics",
  },
  {
    icon: Smartphone,
    name: "Mobile Development",
    body: "Ship Android and iOS project apps.",
    meta: "Screens · Builds",
  },
  {
    icon: GraduationCap,
    name: "Academic Projects",
    body: "Research, documentation and viva preparation.",
    meta: "Report · Defence",
  },
];

/** Domain picker teaser used on the landing page. */
export function DomainCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {DOMAINS.map((domain) => (
        <Link
          key={domain.name}
          to="/auth"
          search={{ mode: "signup" }}
          className="panel group flex flex-col p-4 transition-all hover:-translate-y-1 hover:border-primary/60"
        >
          <domain.icon className="h-5 w-5 text-primary" />
          <p className="mt-3 text-sm font-semibold">{domain.name}</p>
          <p className="mt-1 flex-1 text-xs text-muted-foreground">{domain.body}</p>
          <p className="mt-3 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80 group-hover:text-primary">
            {domain.meta}
          </p>
        </Link>
      ))}
    </div>
  );
}
