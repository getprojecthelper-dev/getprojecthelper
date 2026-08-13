import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspacePreview } from "@/components/workspace-preview";

/** Landing hero: dark editorial surface, product preview on the right. */
export function HeroShowcase() {
  return (
    <section className="hero-surface relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:radial-gradient(var(--hero-ink)_1px,transparent_1px)] [background-size:26px_26px]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:pb-28 lg:pt-36">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-hero-line bg-hero-ink/10 px-3 py-1 text-xs font-medium text-hero-ink-muted">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered project assistant
          </span>

          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-hero-ink sm:text-6xl">
            Create smarter
            <br />
            projects, <span className="text-primary">faster</span>
          </h1>

          <p className="mt-5 max-w-md text-base text-hero-ink-muted">
            Plan, structure and build high-quality projects with AI guidance — from the first idea
            through to the final submission.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="group">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start your project
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-hero-line bg-transparent text-hero-ink hover:bg-hero-ink/10 hover:text-hero-ink"
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-3">
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
            <div>
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

        <WorkspacePreview />
      </div>
    </section>
  );
}
