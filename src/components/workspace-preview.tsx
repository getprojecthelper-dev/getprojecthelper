import { Zap } from "lucide-react";

const PROJECTS = [
  { name: "AI Chatbot System", domain: "Software", progress: 75, updated: "Updated 2h ago" },
  { name: "Sales Forecasting", domain: "Data Science", progress: 60, updated: "Updated 5h ago" },
  { name: "Campus Portal", domain: "Web App", progress: 90, updated: "Updated 1d ago" },
];

const STATS = [
  { label: "Total projects", value: "12" },
  { label: "In progress", value: "7" },
  { label: "Completed", value: "5" },
];

const ACTIVITY = [
  { text: "Implementation step confirmed in “AI Chatbot System”", time: "2 hours ago" },
  { text: "Report section drafted for “Sales Forecasting”", time: "5 hours ago" },
  { text: "Code generated for “Campus Portal”", time: "1 day ago" },
];

/** Stylised in-app preview shown beside the hero copy. */
export function WorkspacePreview() {
  return (
    <div className="relative min-w-0">
      <div className="absolute inset-0 scale-[1.04] rounded-2xl bg-hero-ink/5 blur-2xl" aria-hidden />
      <div
        className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-hero-line bg-card text-card-foreground shadow-2xl"
        aria-hidden
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-3 min-w-0 truncate text-xs font-medium text-muted-foreground">
            Project Helper — Dashboard
          </span>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-[150px_minmax(0,1fr)]">
          <div className="hidden flex-col gap-2 sm:flex">
            {["Dashboard", "My projects", "Implementation", "AI mentor", "Documents"].map(
              (item, index) => (
                <span
                  key={item}
                  className={`rounded-md px-2.5 py-1.5 text-xs ${
                    index === 0
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {item}
                </span>
              ),
            )}

            <div className="mt-auto rounded-lg border border-border bg-secondary/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                AI credits
              </p>
              <p className="font-display text-lg tabular-nums">
                120 <span className="text-xs text-muted-foreground">/ 300</span>
              </p>
              <span className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary">
                <Zap className="h-3 w-3" /> Top up
              </span>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {PROJECTS.map((project) => (
                <div key={project.name} className="rounded-lg border border-border p-2.5">
                  <p className="truncate text-[11px] font-semibold">{project.name}</p>
                  <p className="text-[10px] text-muted-foreground">{project.domain}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{project.updated}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-lg bg-secondary/60 p-2.5">
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-base tabular-nums">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] font-semibold">Recent activity</p>
              <ul className="mt-2 space-y-1.5">
                {ACTIVITY.map((item) => (
                  <li
                    key={item.text}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[10px] text-muted-foreground"
                  >
                    <span className="truncate">{item.text}</span>
                    <span className="shrink-0">{item.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
