import { createFileRoute } from "@tanstack/react-router";
import { Copy, Presentation, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DOMAINS, getTemplate, labelOf } from "@/lib/project-domain";
import { useWorkspace } from "@/lib/use-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId/showcase")({
  head: () => ({
    meta: [
      { title: "Showcase & viva — Project Helper" },
      { name: "description", content: "Slide outline, portfolio summary and viva questions from your real project data." },
      { property: "og:title", content: "Showcase & viva — Project Helper" },
      { property: "og:description", content: "Slide outline, portfolio summary and viva prep." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShowcasePage,
});

function ShowcasePage() {
  const { data, metrics } = useWorkspace();
  if (!data || !metrics) return null;

  const { project, requirements, tests, experiments, risks, docSections, tasks } = data;
  const template = getTemplate(project.template);
  const passed = tests.filter((t) => t.status === "passed").length;
  const done = tasks.filter((t) => t.status === "completed").length;

  const slides = [
    { title: "Title & team", points: [project.name, labelOf(DOMAINS, project.domain)] },
    {
      title: "Problem & objective",
      points: [project.description || "Describe the problem you set out to solve."],
    },
    {
      title: "Requirements",
      points: requirements.slice(0, 4).map((r) => `${r.code}: ${r.title}`).length
        ? requirements.slice(0, 4).map((r) => `${r.code}: ${r.title}`)
        : ["No requirements recorded yet."],
    },
    { title: "Approach & methodology", points: template.workflow },
    {
      title: "Implementation",
      points: [`${done}/${tasks.length} planned tasks completed`, `${metrics.progress}% overall progress`],
    },
    {
      title: "Results & evaluation",
      points:
        experiments.length > 0
          ? experiments.slice(0, 3).map((e) => `${e.name}: ${e.metrics ?? "metrics pending"}`)
          : [`${passed}/${tests.length} test cases passing`],
    },
    {
      title: "Risks & limitations",
      points: risks.length > 0 ? risks.slice(0, 3).map((r) => r.title) : ["No risks recorded yet."],
    },
    { title: "Conclusion & future work", points: ["Summarise outcomes and next steps."] },
  ];

  const vivaQuestions = [
    {
      q: "Why did you choose this approach over the alternatives?",
      hint: `Your project follows the ${template.label} workflow: ${template.workflow.join(" → ")}. Justify each step.`,
    },
    {
      q: "How do you know your requirements are met?",
      hint: `You have ${requirements.length} requirement(s) and ${tests.length} test case(s), with ${passed} passing. Walk through one trace.`,
    },
    {
      q: "What was the hardest technical problem, and how did you solve it?",
      hint:
        tasks.find((t) => t.status === "blocked")?.title ??
        "Pick a task that needed a design decision, not just effort.",
    },
    {
      q: "What are the limitations of your work?",
      hint: risks.length > 0 ? `Start with: ${risks[0]!.title}.` : "Record risks in Review to answer this well.",
    },
    {
      q: "What would you do with more time?",
      hint: `You have ${docSections.filter((d) => d.status !== "complete").length} unfinished report section(s) — future work often comes from there.`,
    },
  ];

  const summary = `${project.name} — ${labelOf(DOMAINS, project.domain)}. ${
    project.description ?? ""
  } Built using a ${template.label.toLowerCase()} workflow with ${requirements.length} tracked requirements, ${
    tasks.length
  } planned tasks (${done} completed) and ${tests.length} test cases (${passed} passing). Overall recorded progress: ${metrics.progress}%.`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Showcase & viva"
        description="Presentation outline, portfolio blurb and likely questions — all generated from your recorded work."
      />

      <div className="panel p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-4 w-4" /> Portfolio summary
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              void navigator.clipboard.writeText(summary);
              toast.success("Summary copied.");
            }}
          >
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
        </div>
        <p className="mt-3 text-sm leading-relaxed">{summary}</p>
      </div>

      <div>
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Presentation className="h-4 w-4" /> Slide outline
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {slides.map((s, i) => (
            <div key={s.title} className="panel p-4">
              <p className="text-xs text-muted-foreground">Slide {i + 1}</p>
              <p className="mt-1 font-medium">{s.title}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                {s.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold">Viva questions to rehearse</h2>
        <div className="mt-3 space-y-3">
          {vivaQuestions.map((v) => (
            <div key={v.q} className="panel p-4">
              <p className="font-medium">{v.q}</p>
              <p className="mt-1 text-sm text-muted-foreground">{v.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
