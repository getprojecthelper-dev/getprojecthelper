import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Database, ExternalLink, Play } from "lucide-react";

import { MeterBar, MetricCard, healthTone, meterTone } from "@/components/metrics";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  DOMAINS,
  PURPOSES,
  STAGE_LABELS,
  getTemplate,
  labelOf,
  type Stage,
} from "@/lib/project-domain";
import { useWorkspace } from "@/lib/use-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId/")({
  head: () => ({
    meta: [
      { title: "Project overview — Project Helper" },
      { name: "description", content: "Stage, progress, health and project details." },
      { property: "og:title", content: "Project overview — Project Helper" },
      { property: "og:description", content: "Stage, progress, health and project details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { projectId, data, metrics } = useWorkspace();
  const { data: buildSections = [] } = useQuery({
    queryKey: ["overview-build-sections", projectId],
    queryFn: async () => {
      const { data: sections, error } = await supabase
        .from("build_sections")
        .select("id,title,position,status,kind,blocks")
        .eq("project_id", projectId)
        .order("position");
      if (error) throw new Error("We couldn't update the project overview.");
      return sections ?? [];
    },
  });
  if (!data || !metrics) return null;

  const { project } = data;
  const template = getTemplate(project.template);
  const tone = healthTone(metrics.health.score);
  const confirmed = buildSections.filter((section) => section.status === "confirmed").length;
  const progress = buildSections.length
    ? Math.round((confirmed / buildSections.length) * 100)
    : metrics.progress;
  const nextSection = buildSections.find((section) => section.status !== "confirmed");
  const isCompleted =
    project.status === "completed" || (buildSections.length > 0 && confirmed === buildSections.length);
  const currentStage = isCompleted
    ? "Completed"
    : nextSection?.title ?? STAGE_LABELS[project.current_stage as Stage] ?? project.current_stage;
  const overview = buildSections.find(
    (section) => section.kind === "overview" || /problem\s*statement/i.test(section.title),
  );
  const overviewBlocks = Array.isArray(overview?.blocks)
    ? (overview.blocks as Array<{ title?: string; explanation?: unknown; code?: string }>)
    : [];
  const blockText = (pattern: RegExp) => {
    const block = overviewBlocks.find((item) => pattern.test(item.title ?? ""));
    if (!block) return null;
    const lines = Array.isArray(block.explanation)
      ? block.explanation.filter((line): line is string => typeof line === "string")
      : [];
    return lines.join(" ").trim() || block.code?.trim() || null;
  };
  const problem = blockText(/problem|challenge/) ?? project.idea ?? project.description;
  const solution = blockText(/solution|approach/) ?? project.description;
  const dataset = asDataset(project.dataset);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Live progress and the key decisions behind your project."
        actions={
          !isCompleted ? (
            <Button asChild size="lg">
              <Link to="/projects/$projectId/build" params={{ projectId }}>
                <Play className="h-4 w-4" />
                Continue building project
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Overall progress"
          value={`${progress}%`}
          hint={buildSections.length ? `${confirmed} of ${buildSections.length} steps completed` : "Progress updates as you complete work"}
        >
          <MeterBar value={progress} />
        </MetricCard>
        <MetricCard
          label="Project health"
          value={`${metrics.health.score}`}
          hint={tone === "good" ? "On track" : tone === "warn" ? "Needs attention" : "At risk"}
        >
          <MeterBar value={metrics.health.score} tone={meterTone(metrics.health.score)} />
        </MetricCard>
        <MetricCard
          label="Current stage"
          value={currentStage}
          hint={isCompleted ? "All build steps are complete" : nextSection ? `Step ${nextSection.position + 1} is next` : `${template.label} workflow`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Problem statement
          </p>
          <p className="mt-3 text-sm leading-6 text-foreground/90">
            {concise(problem) ?? "Generate the first build step to define the problem clearly."}
          </p>
        </div>

        <div className="panel p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Solution
          </p>
          <p className="mt-3 text-sm leading-6 text-foreground/90">
            {concise(solution) ?? "Generate the first build step to define the proposed solution."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Project details</p>
          <dl className="mt-3 space-y-2 text-sm">
            <Detail label="Domain" value={labelOf(DOMAINS, project.domain)} />
            <Detail label="Template" value={template.label} />
            <Detail label="Purpose" value={labelOf(PURPOSES, project.purpose)} />
            <Detail label="Type" value={project.project_type ?? "—"} />
          </dl>
        </div>

        {dataset ? (
          <div className="panel p-5">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Database className="h-4 w-4" />
              Dataset used
            </div>
            <h2 className="mt-3 font-display text-lg">{dataset.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {[dataset.source, dataset.format, dataset.size].filter(Boolean).join(" · ")}
            </p>
            {dataset.url ? (
              <Button asChild variant="outline" size="sm" className="mt-4">
                <a href={dataset.url} target="_blank" rel="noreferrer">
                  View dataset <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="panel p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {template.label} lifecycle
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {template.workflow.map((stepName, i) => (
            <span key={stepName} className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-background px-3 py-1">
                {stepName}
              </span>
              {i < template.workflow.length - 1 ? (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              ) : null}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function concise(value: string | null | undefined) {
  if (!value) return null;
  const clean = value.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  if (clean.length <= 360) return clean;
  const shortened = clean.slice(0, 360);
  const sentenceEnd = Math.max(shortened.lastIndexOf("."), shortened.lastIndexOf("!"), shortened.lastIndexOf("?"));
  return `${shortened.slice(0, sentenceEnd > 160 ? sentenceEnd + 1 : shortened.lastIndexOf(" "))}…`;
}

function asDataset(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const name = typeof record["name"] === "string" ? record["name"].trim() : "";
  if (!name) return null;
  return {
    name,
    source: typeof record["source"] === "string" ? record["source"] : "",
    format: typeof record["format"] === "string" ? record["format"] : "",
    size: typeof record["size"] === "string" ? record["size"] : "",
    url: typeof record["url"] === "string" ? record["url"] : "",
  };
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
