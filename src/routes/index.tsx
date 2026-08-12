import { Link, createFileRoute } from "@tanstack/react-router";
import { Beaker, GraduationCap, Lock, Sparkles } from "lucide-react";

import { FeatureGrid } from "@/components/feature-grid";
import { KineticHero } from "@/components/kinetic-hero";
import { LifecycleStepper } from "@/components/lifecycle-stepper";
import { MentorDialogue } from "@/components/mentor-dialogue";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";



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

function Landing() {

  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-50 bg-gradient-to-b from-black/45 via-black/15 to-transparent">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-hero-ink">
            <GraduationCap className="h-5 w-5 text-primary" />
            Project Helper
          </Link>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            <a href="#how-it-works" className="story-link text-hero-ink-muted transition-colors hover:text-hero-ink">
              How it works
            </a>
            <a href="#features" className="story-link text-hero-ink-muted transition-colors hover:text-hero-ink">
              Features
            </a>
            <a href="#mentor" className="story-link text-hero-ink-muted transition-colors hover:text-hero-ink">
              AI Mentor
            </a>
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle className="text-hero-ink hover:bg-hero-ink/10" />
            <Button asChild variant="ghost" size="sm" className="text-hero-ink hover:bg-hero-ink/10 hover:text-hero-ink">
              <Link to="/auth">Log in</Link>
            </Button>
            <Button asChild size="sm" className="bg-hero-ink text-hero-ink-foreground hover:bg-hero-ink/90">
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
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                How it works
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                The complete project lifecycle, in order
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Every stage, every deliverable, zero confusion. Each screen answers three questions:
                where am I, how am I doing, and what should I do next.
              </p>
            </div>
            <LifecycleStepper />

            <div className="panel mt-10 grid gap-6 p-6 sm:grid-cols-3">
              {[
                {
                  icon: GraduationCap,
                  title: "Designed for academic success",
                  body: "Built around how projects are actually marked.",
                },
                {
                  icon: Lock,
                  title: "Your data is yours",
                  body: "Your work stays private to your account.",
                },
                {
                  icon: Sparkles,
                  title: "AI that understands your project",
                  body: "Context-aware, honest, and never inventing results.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
              Features
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Everything the project needs
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              One workspace for planning, research, code, evidence and the final defence.
            </p>
          </div>
          <FeatureGrid />
        </section>


        <section id="mentor" className="border-t border-border bg-secondary/40">
          <MentorDialogue />
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
