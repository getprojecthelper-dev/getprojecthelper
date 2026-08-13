import {
  ClipboardList,
  Code2,
  FileText,
  Lightbulb,
  Presentation,
  Rocket,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useInView, usePrefersReducedMotion } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const STAGES: {
  step: string;
  blurb: string;
  detail: string;
  screen: string;
  icon: LucideIcon;
}[] = [
  {
    step: "Idea",
    blurb: "Start with a problem worth solving.",
    detail: "Describe the project you want to build and pick its domain.",
    screen: "New project → Idea",
    icon: Lightbulb,
  },
  {
    step: "Plan",
    blurb: "Define goals, scope and a plan.",
    detail: "Turn the chosen idea into simple, ordered implementation steps.",
    screen: "Implementation plan",
    icon: ClipboardList,
  },
  {
    step: "Build",
    blurb: "Develop, analyse and experiment.",
    detail: "Generate each step on demand, with code split into explained parts.",
    screen: "Implementation",
    icon: Code2,
  },
  {
    step: "Test",
    blurb: "Validate your work with confidence.",
    detail: "Record test cases with expected and actual results, tied to requirements.",
    screen: "Testing",
    icon: ShieldCheck,
  },
  {
    step: "Document",
    blurb: "Write better reports, faster.",
    detail: "Write the report section by section, tracked to completion.",
    screen: "Documentation",
    icon: FileText,
  },
  {
    step: "Present",
    blurb: "Prepare a defence that holds up.",
    detail: "Check readiness, close risks and rehearse the questions you'll be asked.",
    screen: "Review & viva",
    icon: Presentation,
  },
  {
    step: "Showcase",
    blurb: "Stand out with a strong portfolio.",
    detail: "README, case study and CV lines built only from what the project contains.",
    screen: "Showcase",
    icon: Rocket,
  },
];

export function LifecycleStepper() {
  const [active, setActive] = useState(2);
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
    listRef.current?.querySelectorAll("button")[next]?.focus();
  };

  const current = STAGES[active]!;

  return (
    <div ref={ref} className="mt-10">
      <ol
        ref={listRef}
        className="grid grid-cols-2 gap-x-2 gap-y-8 sm:grid-cols-4 lg:grid-cols-7"
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
            <li key={stage.step} className="relative">
              {i < STAGES.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-1/2 top-8 hidden h-px w-full translate-x-8 border-t border-dashed transition-colors duration-500 lg:block",
                    done ? "border-primary/60" : "border-border",
                  )}
                />
              )}
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
                className="group flex w-full flex-col items-center gap-3 rounded-2xl px-1 py-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    "relative flex h-16 w-16 items-center justify-center rounded-full border transition-all duration-500",
                    isActive
                      ? "-translate-y-1 border-primary bg-primary text-primary-foreground shadow-[var(--shadow-lift)]"
                      : done
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:text-primary",
                    inView ? "opacity-100" : "opacity-0",
                  )}
                  style={{ transitionDelay: `${i * 70}ms` }}
                >
                  <stage.icon className="h-6 w-6" />
                </span>
                <span
                  className={cn(
                    "font-display text-base transition-colors",
                    isActive ? "text-primary" : "text-foreground",
                  )}
                >
                  {stage.step}
                </span>
                <span className="max-w-[15ch] text-xs leading-relaxed text-muted-foreground">
                  {stage.blurb}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="panel mt-10 flex flex-wrap items-center justify-between gap-3 p-5">
        <p key={current.step} className="max-w-xl animate-fade-in text-sm text-foreground">
          {current.detail}
        </p>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {current.screen}
        </span>
      </div>
    </div>
  );
}
