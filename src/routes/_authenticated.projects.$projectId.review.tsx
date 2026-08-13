import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";

import { MeterBar, meterTone } from "@/components/metrics";
import { PageHeader } from "@/components/page-header";
import { ListRow, RecordDialog, type RecordValues } from "@/components/record-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useRecordMutations, type Risk } from "@/lib/db";
import { RISK_SEVERITIES, labelOf } from "@/lib/project-domain";
import { useWorkspace } from "@/lib/use-workspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projects/$projectId/review")({
  head: () => ({
    meta: [
      { title: "Project review — Project Helper" },
      { name: "description", content: "An honest readiness review across planning, build, testing and docs." },
      { property: "og:title", content: "Project review — Project Helper" },
      { property: "og:description", content: "Readiness review across every project area." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReviewPage,
});

const RISK_STATUSES = [
  { value: "open", label: "Open" },
  { value: "mitigating", label: "Mitigating" },
  { value: "closed", label: "Closed" },
];

const RISK_FIELDS = [
  { name: "title", label: "Risk", type: "text" as const, required: true },
  { name: "description", label: "Description", type: "textarea" as const },
  { name: "mitigation", label: "Mitigation plan", type: "textarea" as const },
  { name: "severity", label: "Severity", type: "select" as const, options: [...RISK_SEVERITIES] },
  { name: "status", label: "Status", type: "select" as const, options: RISK_STATUSES },
];

const STATE_STYLES: Record<string, string> = {
  complete: "border-success/40 bg-success/10 text-success",
  attention: "border-warning/40 bg-warning/10 text-warning",
  at_risk: "border-destructive/40 bg-destructive/10 text-destructive",
  empty: "border-border bg-muted text-muted-foreground",
};

function ReviewPage() {
  const { projectId, data, metrics } = useWorkspace();
  const { create, update, remove } = useRecordMutations("risks", projectId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Risk | null>(null);

  if (!data || !metrics) return null;

  const submit = (values: RecordValues) => {
    const v = (k: string) => (values[k] ?? "").trim();
    const payload = {
      title: v("title"),
      description: v("description") || null,
      mitigation: v("mitigation") || null,
      severity: v("severity") || "medium",
      status: v("status") || "open",
    };
    if (editing) update.mutate({ id: editing.id, values: payload }, { onSuccess: () => setOpen(false) });
    else create.mutate(payload, { onSuccess: () => setOpen(false) });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project review"
        description="A blunt readiness check based only on what you've actually recorded."
      />

      <div className="panel p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Readiness
            </p>
            <p className="mt-2 font-display text-3xl">{metrics.progress}%</p>
          </div>
          <ShieldCheck className="h-8 w-8 text-muted-foreground" />
        </div>
        <MeterBar className="mt-4" value={metrics.progress} tone={meterTone(metrics.progress)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.review.map((area) => (
          <div key={area.area} className="panel p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{area.area}</p>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
                  STATE_STYLES[area.state],
                )}
              >
                {area.state.replace("_", " ")}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{area.detail}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg">
            <AlertTriangle className="h-4 w-4" /> Risks
          </h2>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add risk
          </Button>
        </div>
        {data.risks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No risks recorded. Examiners almost always ask what could go wrong — record two or three.
          </p>
        ) : (
          data.risks.map((r) => (
            <ListRow
              key={r.id}
              title={r.title}
              meta={labelOf(RISK_STATUSES, r.status)}
              badges={<StatusBadge value={r.severity} label={labelOf(RISK_SEVERITIES, r.severity)} />}
              actions={
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(r);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              }
            >
              {r.description ? (
                <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
              ) : null}
              {r.mitigation ? (
                <p className="mt-2 rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Mitigation: </span>
                  {r.mitigation}
                </p>
              ) : null}
            </ListRow>
          ))
        )}
      </div>

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit risk" : "Add risk"}
        fields={RISK_FIELDS}
        busy={create.isPending || update.isPending}
        initial={
          editing
            ? {
                title: editing.title,
                description: editing.description ?? "",
                mitigation: editing.mitigation ?? "",
                severity: editing.severity,
                status: editing.status,
              }
            : undefined
        }
        onSubmit={submit}
      />
    </div>
  );
}
