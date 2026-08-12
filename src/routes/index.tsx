import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Beaker,
  BookOpen,
  Bot,
  ClipboardList,
  FileText,
  FlaskConical,
  GraduationCap,
  Play,
  ListChecks,
  Presentation,
  ShieldCheck,
  TestTube,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import heroFullAsset from "@/assets/hero-full.png.asset.json";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Helper — From Idea to Final Submission" },
      {
        name: "description",
        content:
          "Plan, build, analyse, document and showcase your academic or personal projects in one intelligent workspace.",
      },
      { property: "og:title", content: "Project Helper — From Idea to Final Submission" },
      {
        property: "og:description",
        content:
          "Plan, build, analyse, document and showcase your academic or personal projects in one intelligent workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const WORKFLOW = ["Idea", "Plan", "Build", "Test", "Document", "Present", "Showcase"];

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Project Planning",
    body: "Start from a domain template and get a lifecycle, stages and starter tasks — not an empty board.",
  },
  {
    icon: Bot,
    title: "AI Mentor",
    body: "A project-aware mentor that reads your real tasks, requirements and results, and challenges weak reasoning.",
  },
  {
    icon: ListChecks,
    title: "Requirements Management",
    body: "Typed, prioritised requirements with acceptance criteria, traced through to tasks and tests.",
  },
  {
    icon: BookOpen,
    title: "Research Workspace",
    body: "Sources, notes and themes stay attached to the project instead of scattered across tabs.",
  },
  {
    icon: FlaskConical,
    title: "Data & Experiments",
    body: "Record datasets, parameters, metrics and results so your evaluation story is reproducible.",
  },
  {
    icon: TestTube,
    title: "Testing",
    body: "Test cases with expected and actual results, linked to the requirement they verify.",
  },
  {
    icon: FileText,
    title: "Documentation",
    body: "A structured report with per-section completion, so nothing is written the night before.",
  },
  {
    icon: Presentation,
    title: "Showcase & Viva",
    body: "README, case study, CV lines and viva questions generated only from what your project actually contains.",
  },
];

const PHASES = [
  { id: "idea", num: "01", label: "Idea Vault", note: "Capture the spark" },
  { id: "plan", num: "02", label: "Timeline", note: "Structured milestones" },
  { id: "build", num: "03", label: "Development", note: "Code, step by step" },
  { id: "test", num: "04", label: "Verification", note: "Prove it works" },
  { id: "viva", num: "05", label: "Final Viva", note: "Defend with evidence" },
] as const;

const STATS = [
  { value: 13, suffix: "", label: "project domains" },
  { value: 9, suffix: "", label: "lifecycle stages" },
  { value: 1, suffix: "", label: "clear next action" },
] as const;

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out so the number settles rather than stopping abruptly
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

function Stat({ value, label }: { value: number; label: string }) {
  const shown = useCountUp(value);
  return (
    <div>
      <p className="font-display text-4xl font-semibold text-hero-ink">{shown}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-hero-ink-muted">
        {label}
      </p>
    </div>
  );
}

function KineticHero() {
  const [active, setActive] = useState(2);
  const [pinned, setPinned] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLElement | null>(null);

  // Slow auto-advance through the lifecycle until the visitor takes over.
  useEffect(() => {
    if (pinned) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % PHASES.length), 2600);
    return () => window.clearInterval(id);
  }, [pinned]);

  const onMove = (event: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    setOffset({
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 24,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 18,
    });
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      className="relative min-h-[100svh] w-full overflow-hidden"
    >
      <img
        src={heroFullAsset.url}
        alt="Students planning a project on a whiteboard, coding on a laptop and taking notes together in a warm studio"
        className="absolute inset-0 h-full w-full scale-110 object-cover transition-transform duration-500 ease-out"
        style={{ transform: `scale(1.08) translate3d(${offset.x}px, ${offset.y}px, 0)` }}
        width={1536}
        height={1024}
      />
      <div className="hero-scrim" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/25 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-warning/15 blur-[140px]"
        aria-hidden
      />

      <div className="relative mx-auto grid min-h-[100svh] max-w-6xl items-center gap-12 px-5 py-24 text-hero-ink lg:grid-cols-12">
        <div className="animate-fade-in lg:col-span-7">
          <div className="inline-flex w-fit items-center gap-3 rounded-full border border-hero-ink/20 bg-hero-ink/10 px-4 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-warning opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hero-ink-muted">
              {`Phase ${PHASES[active]!.num}: ${PHASES[active]!.label}`}
            </span>
          </div>

          <h1 className="mt-8 max-w-2xl font-display text-5xl font-semibold leading-[0.92] tracking-tight sm:text-6xl lg:text-7xl">
            From messy <span className="text-primary">ideas</span> to a polished{" "}
            <span className="font-light italic text-warning">viva</span>.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-hero-ink-muted">
            Plan, build, analyse, document and showcase your academic or personal projects in one
            intelligent workspace — from the first idea to the final defence.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Button
              asChild
              size="lg"
              className="rounded-2xl px-8 py-6 text-base shadow-[var(--shadow-lift)] transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Start Your Project
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <a href="#how-it-works" className="group flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-hero-ink/25 transition-colors group-hover:border-warning group-hover:bg-hero-ink/10">
                <Play className="ml-0.5 h-4 w-4 fill-warning text-warning" />
              </span>
              <span className="font-medium tracking-wide text-hero-ink">Explore How It Works</span>
            </a>
          </div>

          <div className="mt-14 flex gap-14 border-t border-hero-ink/15 pt-8">
            {STATS.map((s) => (
              <Stat key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 lg:flex lg:justify-end">
          <div className="relative w-full max-w-sm">
            <div
              className="absolute bottom-8 left-[27px] top-8 w-0.5 bg-gradient-to-b from-warning via-primary to-hero-ink/10"
              aria-hidden
            />
            <ul className="relative space-y-4">
              {PHASES.map((phase, i) => {
                const done = i < active;
                const current = i === active;
                return (
                  <li key={phase.id}>
                    <button
                      type="button"
                      onMouseEnter={() => {
                        setActive(i);
                        setPinned(true);
                      }}
                      onFocus={() => {
                        setActive(i);
                        setPinned(true);
                      }}
                      onMouseLeave={() => setPinned(false)}
                      onBlur={() => setPinned(false)}
                      className={cn(
                        "flex w-full items-center gap-6 rounded-[2rem] p-3 text-left transition-all duration-500",
                        current
                          ? "-ml-3 border border-hero-ink/15 bg-hero-ink/10 shadow-[var(--shadow-lift)] backdrop-blur-md"
                          : done
                            ? "opacity-90"
                            : "opacity-40 hover:opacity-100",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-semibold transition-colors",
                          current
                            ? "border-2 border-primary bg-background/20 text-primary"
                            : done
                              ? "bg-warning text-warning-foreground"
                              : "border border-hero-ink/25 text-hero-ink-muted",
                        )}
                      >
                        {phase.num}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-lg font-semibold text-hero-ink">
                          {phase.label}
                        </span>
                        <span
                          className={cn(
                            "block text-[10px] font-bold uppercase tracking-widest",
                            current ? "text-primary" : done ? "text-warning" : "text-hero-ink-muted",
                          )}
                        >
                          {current ? "In progress…" : done ? "Locked in" : phase.note}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <GraduationCap className="h-5 w-5 text-primary" />
            Project Helper
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start Your Project
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <KineticHero />



        <section id="how-it-works" className="border-y border-border bg-secondary/50">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="font-display text-2xl font-semibold">The whole lifecycle, in order</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Project Helper is not a board with a chatbot bolted on. Every screen answers three
              questions: where am I, how am I doing, and what should I do next.
            </p>
            <ol className="mt-8 flex flex-wrap items-center gap-2">
              {WORKFLOW.map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-[var(--shadow-panel)]">
                    <span className="mr-2 text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                    {step}
                  </span>
                  {i < WORKFLOW.length - 1 ? (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-2xl font-semibold">Everything the project needs</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="panel p-5">
                <f.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-2 lg:items-center">
            <div>
              <ShieldCheck className="h-6 w-6 text-accent" />
              <h2 className="mt-3 font-display text-2xl font-semibold">
                An AI that won't just agree with you
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                The mentor reads your recorded project state and refuses to invent results, metrics
                or citations. If a number isn't recorded, it says so.
              </p>
            </div>
            <div className="panel space-y-4 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Student
                </p>
                <p className="mt-1 text-sm">
                  “My model has 96% accuracy so it is excellent.”
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  AI Mentor
                </p>
                <p className="mt-1 text-sm">
                  “Accuracy alone does not establish that. Check class balance, precision, recall,
                  F1-score and the confusion matrix before concluding that the model performs well.”
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-20 text-center">
          <Beaker className="mx-auto h-6 w-6 text-primary" />
          <h2 className="mt-4 font-display text-3xl font-semibold">
            Start the project you keep postponing
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Pick a domain, define the objective, and get a plan you can actually follow.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/auth" search={{ mode: "signup" }}>
              Start Your Project
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-5 text-sm text-muted-foreground">
          Project Helper — plan, build, document and showcase your work.
        </div>
      </footer>
    </div>
  );
}
