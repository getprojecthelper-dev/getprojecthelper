import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, Lock, Sparkles } from "lucide-react";

import { DomainCards } from "@/components/domain-cards";
import { FeatureGrid } from "@/components/feature-grid";
import { HeroShowcase } from "@/components/hero-showcase";
import { LifecycleStepper } from "@/components/lifecycle-stepper";
import { MentorDialogue } from "@/components/mentor-dialogue";
import { Testimonials } from "@/components/testimonials";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Helper — Create Smarter Projects, Faster" },
      {
        name: "description",
        content:
          "Plan, structure and build high-quality student projects with AI guidance — from idea and dataset to code, documentation and viva prep.",
      },
      { property: "og:title", content: "Project Helper — Create Smarter Projects, Faster" },
      {
        property: "og:description",
        content:
          "Plan, structure and build high-quality student projects with AI guidance — from idea and dataset to code, documentation and viva prep.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-lg font-semibold text-hero-ink"
          >
            <GraduationCap className="h-5 w-5 text-primary" />
            Project Helper
          </Link>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            <a
              href="#how-it-works"
              className="story-link text-hero-ink-muted transition-colors hover:text-hero-ink"
            >
              How it works
            </a>
            <a
              href="#domains"
              className="story-link text-hero-ink-muted transition-colors hover:text-hero-ink"
            >
              Domains
            </a>
            <a
              href="#features"
              className="story-link text-hero-ink-muted transition-colors hover:text-hero-ink"
            >
              Features
            </a>
            <Link
              to="/pricing"
              className="story-link text-hero-ink-muted transition-colors hover:text-hero-ink"
            >
              Pricing
            </Link>
            <a
              href="#mentor"
              className="story-link text-hero-ink-muted transition-colors hover:text-hero-ink"
            >
              AI Mentor
            </a>
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle className="text-hero-ink hover:bg-hero-ink/10" />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-hero-ink hover:bg-hero-ink/10 hover:text-hero-ink"
            >
              <Link to="/auth">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "signup" }}>
                Sign up
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <HeroShowcase />

        <section id="how-it-works" className="border-b border-border bg-secondary/50">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                How it works
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                From idea to project in a few simple steps
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Every stage answers three questions: where am I, how am I doing, and what should I
                do next.
              </p>
            </div>
            <LifecycleStepper />
          </div>
        </section>

        <section id="domains" className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold">Popular domains</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Start your project in any of these domains — each one opens the right sections.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/auth" search={{ mode: "signup" }}>
                Explore all domains
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <DomainCards />
        </section>


        <section id="mentor">
          <MentorDialogue />
        </section>

        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-semibold">
                Loved by students &amp; developers
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                See what people building real projects say.
              </p>
            </div>
            <Testimonials />
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-20 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <h2 className="mt-4 font-display text-3xl font-semibold">
            Start the project you keep postponing
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Pick a domain, define the objective, and get a plan you can actually follow.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/auth" search={{ mode: "signup" }}>
              Start your project
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

