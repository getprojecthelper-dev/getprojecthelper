import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Compass, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspacePreview } from "@/components/workspace-preview";
import { useAuth } from "@/hooks/use-auth";

/** Landing hero: a calm, editorial introduction to the project studio. */
export function HeroShowcase() {
  const { session } = useAuth();
  return (
    <section className="hero-surface relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(var(--hero-line)_1px,transparent_1px),linear-gradient(90deg,var(--hero-line)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="pointer-events-none absolute -right-28 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-32 sm:px-6 sm:pb-20 sm:pt-36 lg:grid-cols-[minmax(0,.86fr)_minmax(0,1.14fr)] lg:gap-16 lg:pb-24 lg:pt-40">
        <div className="min-w-0">
          <span className="animate-fade-in inline-flex max-w-full items-center gap-2 rounded-full border border-hero-line bg-hero-ink/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.13em] text-hero-ink-muted">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Your project studio
          </span>

          <h1 className="animate-fade-in mt-6 max-w-xl font-display text-4xl leading-[1.03] tracking-[-0.05em] text-hero-ink [animation-delay:80ms] sm:text-5xl xl:text-[4.25rem]">
            Build the project <span className="text-primary">you can explain</span> with confidence.
          </h1>

          <p className="animate-fade-in mt-6 max-w-lg text-base leading-7 text-hero-ink-muted [animation-delay:140ms]">
            One structured home for the ideas, evidence and decisions behind great student work —
            from first brief to final presentation.
          </p>

          <div className="animate-fade-in mt-8 grid gap-3 [animation-delay:200ms] sm:flex sm:flex-wrap sm:items-center">
            <Button asChild size="lg" className="group w-full sm:w-auto">
              {session ? (
                <Link to="/welcome">
                  Open your workspace
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <Link to="/auth" search={{ mode: "signup" }}>
                  Start a project
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-hero-line bg-transparent text-hero-ink hover:bg-hero-ink/10 hover:text-hero-ink sm:w-auto"
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          <div className="animate-fade-in mt-9 grid gap-3 text-sm text-hero-ink-muted [animation-delay:260ms] sm:grid-cols-2">
            {["Make each decision traceable", "Stay ready for your viva"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3 stroke-[3]" />
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="animate-hero-preview relative min-w-0 lg:pl-5">
          <div className="absolute -left-2 -top-5 z-10 hidden rounded-xl border border-hero-line bg-hero-surface px-4 py-3 shadow-2xl lg:block">
            <div className="flex items-center gap-2 text-xs font-semibold text-hero-ink">
              <Compass className="size-4 text-primary" /> Project clarity
            </div>
            <div className="mt-1 text-[11px] text-hero-ink-muted">One next step at a time</div>
          </div>
          <WorkspacePreview />
          <div className="absolute -bottom-5 right-4 z-10 rounded-xl border border-hero-line bg-hero-surface px-4 py-3 shadow-2xl sm:right-8">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-hero-ink-muted">
              Project status
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl text-hero-ink">On track</span>
              <span className="text-xs font-semibold text-primary">+ clear plan</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
