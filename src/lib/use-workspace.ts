import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";

import { useProjectBundle, type ProjectBundle } from "@/lib/db";
import {
  computeHealth,
  computeNextAction,
  computeProgress,
  computeReview,
  type HealthResult,
  type NextAction,
  type ProjectSignals,
  type ReviewArea,
} from "@/lib/project-domain";

export function useProjectId(): string {
  return useParams({ from: "/_authenticated/projects/$projectId" }).projectId;
}

export interface WorkspaceMetrics {
  progress: number;
  health: HealthResult;
  nextAction: NextAction;
  review: ReviewArea[];
  signals: ProjectSignals;
}

export function deriveMetrics(bundle: ProjectBundle): WorkspaceMetrics {
  const signals: ProjectSignals = {
    tasks: bundle.tasks.map((t) => ({
      title: t.title,
      status: t.status,
      due_date: t.due_date,
      priority: t.priority,
    })),
    requirements: bundle.requirements.map((r) => ({ status: r.status })),
    tests: bundle.tests.map((t) => ({ status: t.status })),
    docSections: bundle.docSections.map((d) => ({ status: d.status })),
    risks: bundle.risks.map((r) => ({ status: r.status, severity: r.severity })),
    deadline: bundle.project.deadline,
    pmSchedule: bundle.schedule.map((t) => ({
      name: t.name,
      status: t.status,
      start_date: t.start_date,
      end_date: t.end_date,
    })),
    pmBudget: bundle.budget.map((b) => ({ planned: Number(b.planned), actual: Number(b.actual) })),
    pmRisks: bundle.risks.map((r) => ({
      title: r.title,
      status: r.status,
      severity: r.severity,
      likelihood: r.likelihood ?? undefined,
      impact: r.impact ?? undefined,
    })),
  };
  const progress = computeProgress(signals);
  return {
    progress,
    health: computeHealth(signals, progress),
    nextAction: computeNextAction(signals, progress),
    review: computeReview(signals),
    signals,
  };
}

/** Single entry point for every workspace page. */
export function useWorkspace() {
  const projectId = useProjectId();
  const query = useProjectBundle(projectId);
  const metrics = useMemo(() => (query.data ? deriveMetrics(query.data) : null), [query.data]);
  return { projectId, ...query, metrics };
}
