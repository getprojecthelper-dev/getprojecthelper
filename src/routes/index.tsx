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
            <LifecycleStepper />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-2xl font-semibold">Everything the project needs</h2>
          <FeatureGrid />
        </section>

        <section className="border-t border-border bg-secondary/40">
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
