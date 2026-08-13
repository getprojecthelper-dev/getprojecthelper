import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { MeterBar, MetricCard, healthTone, meterTone } from "@/components/metrics";
import { PageHeader } from "@/components/page-header";
import {
  DOMAINS,
  PURPOSES,
  STAGE_LABELS,
  daysUntil,
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
  if (!data || !metrics) return null;

  const { project } = data;
  const template = getTemplate(project.template);
  const days = daysUntil(project.deadline);
  const tone = healthTone(metrics.health.score);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description={project.description ?? "No objective recorded yet."}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Overall progress" value={`${metrics.progress}%`}>
          <MeterBar value={metrics.progress} />
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
          value={STAGE_LABELS[project.current_stage as Stage] ?? project.current_stage}
          hint={`${template.label} workflow`}
        />
        <MetricCard
          label="Deadline"
          value={days === null ? "Not set" : days < 0 ? `${Math.abs(days)}d late` : `${days} days`}
          hint={project.deadline ?? "Add one in project settings"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Health factors
          </p>
          {metrics.health.factors.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nothing is dragging this project down right now.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {metrics.health.factors.map((f) => (
                <li key={f.label} className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="shrink-0 font-medium text-destructive">-{f.penalty}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Project details
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <Detail label="Domain" value={labelOf(DOMAINS, project.domain)} />
            <Detail label="Template" value={template.label} />
            <Detail label="Purpose" value={labelOf(PURPOSES, project.purpose)} />
            <Detail label="Type" value={project.project_type ?? "—"} />
          </dl>
        </div>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
