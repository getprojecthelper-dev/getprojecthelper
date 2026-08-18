import { Link } from "@tanstack/react-router";
import { ClipboardList, Code2, Database, Server } from "lucide-react";


const DOMAINS = [
  {
    icon: Code2,
    name: "Software Development",
    body: "Build full-stack apps from requirements to deployment.",
    meta: "Plan · Code · Deploy",
  },
  {
    icon: ClipboardList,
    name: "Project Management",
    body: "Charter, WBS, schedule, budget and risk register.",
    meta: "Plan · Track · Close",
  },
  {
    icon: Database,
    name: "Data Science",
    body: "Analyse datasets and train ML models end to end.",
    meta: "Dataset · Model · Report",
  },
];


/** Domain picker teaser used on the landing page. */
export function DomainCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
