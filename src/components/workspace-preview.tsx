import { Check, Circle, Sparkles } from "lucide-react";

const STEPS = [
  { title: "Shape the problem", detail: "Define a useful project goal", done: true },
  { title: "Plan the approach", detail: "Turn the goal into simple steps", done: true },
  { title: "Build & test", detail: "Your next focused task", done: false },
];

/** A deliberately quiet product preview used in the landing-page hero. */
export function WorkspacePreview() {
  return (
    <div className="relative min-w-0">
      <div className="absolute inset-0 scale-[1.04] rounded-2xl bg-hero-ink/5 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-hero-line bg-card p-5 text-card-foreground shadow-2xl sm:p-7" aria-hidden>
        <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Your project</p>
            <h3 className="mt-1 font-display text-lg tracking-[-0.03em]">Campus route planner</h3>
          </div>
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-4" /></span>
        </div>
        <div className="mt-6">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-sm font-semibold">A clear next step</p><p className="mt-1 text-xs text-muted-foreground">You are making steady progress.</p></div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">2 of 3</span>
          </div>
          <ol className="mt-5 space-y-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className={`flex items-center gap-3 rounded-xl border p-3 ${step.done ? "border-border bg-secondary/40" : "border-primary/35 bg-primary/5"}`}>
                <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${step.done ? "bg-primary text-primary-foreground" : "border border-primary text-primary"}`}>
                  {step.done ? <Check className="size-3.5 stroke-[3]" /> : <Circle className="size-3" />}
                </span>
                <span className="min-w-0"><span className="block text-sm font-semibold">{step.title}</span><span className="block truncate text-xs text-muted-foreground">{step.detail}</span></span>
                <span className="ml-auto text-xs font-semibold text-muted-foreground">0{index + 1}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
