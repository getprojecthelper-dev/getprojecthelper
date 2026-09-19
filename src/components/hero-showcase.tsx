import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspacePreview } from "@/components/workspace-preview";
import { useAuth } from "@/hooks/use-auth";

/** Landing hero: dark editorial surface, product preview on the right. */
export function HeroShowcase() {
  const { session } = useAuth();
  return (
    <section className="hero-surface relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:radial-gradient(var(--hero-ink)_1px,transparent_1px)] [background-size:26px_26px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-28 sm:px-6 sm:pb-16 sm:pt-32 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 lg:pb-20 lg:pt-32">
        <div className="min-w-0">
          <span className="animate-fade-in inline-flex max-w-full items-center gap-2 rounded-full border border-hero-line bg-hero-ink/10 px-3 py-1 text-xs font-medium text-hero-ink-muted">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered project assistant
          </span>

          <h1 className="animate-fade-in mt-6 font-display text-4xl leading-[1.05] text-hero-ink [animation-delay:80ms] sm:text-5xl xl:text-6xl">
            Create smarter
            <br />
            projects, <span className="text-primary">faster</span>
          </h1>

          <p className="animate-fade-in mt-5 max-w-md text-base text-hero-ink-muted [animation-delay:140ms]">
            Plan, structure and build high-quality projects with AI guidance — from the first idea
            through to the final submission.
          </p>

          <div className="animate-fade-in mt-8 grid gap-3 [animation-delay:200ms] sm:flex sm:flex-wrap sm:items-center">
            <Button asChild size="lg" className="group w-full sm:w-auto">
              {session ? (
                <Link to="/dashboard">Open your workspace<ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
              ) : (
                <Link to="/auth" search={{ mode: "signup" }}>Start your project<ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
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

          <div className="animate-fade-in mt-8 flex min-w-0 items-center gap-3 [animation-delay:260ms]">
            <div className="flex -space-x-2">
              {["A", "S", "R", "M"].map((initial) => (
                <span
                  key={initial}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-hero-line bg-hero-ink/15 text-xs font-semibold text-hero-ink"
                >
                  {initial}
                </span>
              ))}
            </div>
            <div className="min-w-0">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <p className="mt-0.5 text-xs text-hero-ink-muted">
                Loved by students &amp; final-year teams
              </p>
            </div>
          </div>
        </div>

        <div className="animate-hero-preview min-w-0">
          <WorkspacePreview />
        </div>
      </div>
    </section>
  );
}
