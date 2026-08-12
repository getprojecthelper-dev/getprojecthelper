import { useEffect, useRef, useState } from "react";

import { useInView, usePrefersReducedMotion } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const STAGES = [
  {
    step: "Idea",
    detail: "Describe the project you want to build and pick its domain.",
    screen: "New project → Idea",
  },
  {
    step: "Plan",
    detail: "Turn the chosen idea into simple, ordered implementation steps.",
    screen: "Implementation plan",
  },
  {
    step: "Build",
    detail: "Generate each step on demand, with code split into explained parts.",
    screen: "Implementation",
  },
  {
    step: "Test",
    detail: "Record test cases with expected and actual results, tied to requirements.",
    screen: "Testing",
  },
  {
    step: "Document",
    detail: "Write the report section by section, tracked to completion.",
    screen: "Documentation",
  },
  {
    step: "Present",
    detail: "Check readiness, close risks and rehearse the questions you'll be asked.",
    screen: "Review & viva",
  },
  {
    step: "Showcase",
    detail: "README, case study and CV lines built only from what the project contains.",
    screen: "Showcase",
  },
] as const;

export function LifecycleStepper() {
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();
  const listRef = useRef<HTMLOListElement | null>(null);

  useEffect(() => {
    if (pinned || reduced || !inView) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % STAGES.length), 2800);
    return () => window.clearInterval(id);
  }, [pinned, reduced, inView]);

  const move = (delta: number) => {
    const next = (active + delta + STAGES.length) % STAGES.length;
    setActive(next);
    setPinned(true);
    const buttons = listRef.current?.querySelectorAll("button");
    buttons?.[next]?.focus();
  };

  const current = STAGES[active]!;
  const progress = (active / (STAGES.length - 1)) * 100;

  return (
    <div ref={ref} className="mt-8">
      <div className="relative">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" aria-hidden />
        <div
          className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-primary transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
        <ol
          ref={listRef}
          className="relative flex flex-wrap items-center gap-2"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
              e.preventDefault();
              move(1);
            }
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
              e.preventDefault();
              move(-1);
            }
          }}
        >
          {STAGES.map((stage, i) => {
            const isActive = i === active;
            const done = i < active;
            return (
              <li key={stage.step}>
                <button
                  type="button"
                  aria-current={isActive ? "step" : undefined}
                  onMouseEnter={() => {
                    setActive(i);
                    setPinned(true);
                  }}
                  onFocus={() => {
                    setActive(i);
                    setPinned(true);
                  }}
                  onClick={() => {
                    setActive(i);
                    setPinned(true);
                  }}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "-translate-y-0.5 border-primary bg-primary text-primary-foreground shadow-[var(--shadow-lift)]"
                      : done
                        ? "border-primary/40 bg-card text-foreground shadow-[var(--shadow-panel)]"
                        : "border-border bg-card text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "mr-2 text-xs",
                      isActive ? "text-primary-foreground/80" : "text-primary",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {stage.step}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="panel mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <p key={current.step} className="max-w-xl text-sm text-foreground transition-opacity">
          {current.detail}
        </p>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {current.screen}
        </span>
      </div>
    </div>
  );
}
