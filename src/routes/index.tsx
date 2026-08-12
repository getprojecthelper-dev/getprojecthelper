import { Link, createFileRoute } from "@tanstack/react-router";
import { Beaker, GraduationCap } from "lucide-react";

import { FeatureGrid } from "@/components/feature-grid";
import { KineticHero } from "@/components/kinetic-hero";
import { LifecycleStepper } from "@/components/lifecycle-stepper";
import { MentorDialogue } from "@/components/mentor-dialogue";
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
