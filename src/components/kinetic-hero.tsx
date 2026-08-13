import { Link } from "@tanstack/react-router";
import { ArrowRight, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import heroFullAsset from "@/assets/hero-full.png.asset.json";
import heroLoopAsset from "@/assets/hero-loop.mp4.asset.json";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <p className="font-display text-4xl text-hero-ink">{shown}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-hero-ink-muted">
        {label}
      </p>
    </div>
  );
}

export function KineticHero() {
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
      <video
        src={heroLoopAsset.url}
        poster={heroFullAsset.url}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-label="Students planning a project, coding and taking notes together in a warm studio"
        className="absolute inset-0 h-full w-full scale-110 object-cover transition-transform duration-500 ease-out"
        style={{ transform: `scale(1.08) translate3d(${offset.x}px, ${offset.y}px, 0)` }}
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

          <h1 className="mt-8 max-w-2xl font-display text-5xl leading-[0.92] tracking-tight sm:text-6xl lg:text-7xl">
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
                          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-lg transition-colors",
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
                        <span className="block font-display text-lg text-hero-ink">
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
