import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Plus, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import { withMeter } from "@/components/credit-meter";
import { PageHeader } from "@/components/page-header";
import { RecordDialog, type RecordValues } from "@/components/record-dialog";
import { EmptyState } from "@/components/state-views";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useRecordMutations, type Risk } from "@/lib/db";
import { generateRisks } from "@/lib/pm.functions";
import { useWorkspace } from "@/lib/use-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId/risks")({
  head: () => ({
    meta: [
      { title: "Risk Register — Project Helper" },
      { name: "description", content: "Risk heatmap and register for your project." },
      { property: "og:title", content: "Risk Register — Project Helper" },
      { property: "og:description", content: "Risk heatmap and register." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RisksPage,
});

const LEVELS = ["low", "medium", "high"];
const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "mitigated", label: "Mitigated" },
  { value: "closed", label: "Closed" },
];

function RisksPage() {
  const { projectId, data } = useWorkspace();
  const { create, update, remove } = useRecordMutations("risks", projectId);
  const generate = withMeter("pm_risks", useServerFn(generateRisks));
  const [open, setOpen] = useState(false);

  if (!data) return null;
  const risks = data.risks;

  const heatmap = LEVELS.map((likelihood) =>
    LEVELS.map((impact) => ({
      likelihood,
      impact,
      count: risks.filter((r) => r.likelihood === likelihood && r.impact === impact).length,
      risks: risks.filter((r) => r.likelihood === likelihood && r.impact === impact),
    })),
  );

  const submit = (values: RecordValues) => {
    create.mutate(
      {
        title: (values["title"] ?? "").trim(),
        description: values["description"]?.trim() || null,
        likelihood: (values["likelihood"] as string) || null,
        impact: (values["impact"] as string) || null,
        severity: values["severity"] as string,
        status: values["status"] as string,
        mitigation: values["mitigation"]?.trim() || null,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk Register"
        description="Spot high-likelihood, high-impact risks early and track mitigations."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void generate({ data: { projectId } })}>
              <Sparkles className="mr-1.5 h-4 w-4" /> Generate
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add risk
            </Button>
          </div>
        }
      />

      {risks.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="h-8 w-8" />}
          title="No risks recorded"
          description="Generate a risk register with AI or add the first risk yourself."
          action={
            <div className="flex gap-2">
              <Button onClick={() => void generate({ data: { projectId } })}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Generate
              </Button>
              <Button variant="outline" onClick={() => setOpen(true)}>
                Add risk
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="panel p-4">
            <h2 className="mb-3 text-sm font-semibold">Likelihood × Impact Heatmap</h2>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-xs text-muted-foreground"></div>
              {LEVELS.map((impact) => (
                <div key={impact} className="text-center text-xs font-medium capitalize text-muted-foreground">
                  {impact} impact
                </div>
              ))}
              {heatmap.flat().map((cell) => (
                <div
                  key={`${cell.likelihood}-${cell.impact}`}
                  className={`rounded-lg p-3 text-center ${cell.count > 0 ? heatmapColor(cell.likelihood, cell.impact) : "bg-muted"}`}
                >
                  <p className="text-lg font-semibold">{cell.count}</p>
                  <p className="text-[10px] uppercase tracking-wide opacity-80">{cell.likelihood}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Risks</h2>
            {risks.map((r) => (
              <RiskRow key={r.id} risk={r} onUpdate={(v) => update.mutate({ id: r.id, values: v })} onDelete={() => remove.mutate(r.id)} />
            ))}
          </div>
        </>
      )}

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title="Add risk"
        fields={[
          { name: "title", label: "Risk", type: "text", required: true },
          { name: "description", label: "Description", type: "textarea" },
          { name: "likelihood", label: "Likelihood", type: "select", options: LEVELS.map((v) => ({ value: v, label: v })) },
          { name: "impact", label: "Impact", type: "select", options: LEVELS.map((v) => ({ value: v, label: v })) },
          { name: "severity", label: "Severity", type: "select", options: LEVELS.map((v) => ({ value: v, label: v })) },
          { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
          { name: "mitigation", label: "Mitigation", type: "textarea" },
        ]}
        onSubmit={submit}
        busy={create.isPending}
      />
    </div>
  );
}

function heatmapColor(likelihood: string, impact: string) {
  const l = LEVELS.indexOf(likelihood);
  const i = LEVELS.indexOf(impact);
  if (l >= 2 && i >= 2) return "bg-destructive/20 text-destructive border border-destructive/30";
  if (l + i >= 3) return "bg-warning/20 text-warning-foreground border border-warning/40";
  return "bg-success/15 text-success border border-success/30";
}

function RiskRow({
  risk,
  onUpdate,
  onDelete,
}: {
  risk: Risk;
  onUpdate: (values: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{risk.title}</span>
          <StatusBadge value={risk.severity} label={risk.severity} />
          <StatusBadge value={risk.status} label={STATUS_OPTIONS.find((o) => o.value === risk.status)?.label ?? risk.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{risk.description}</p>
        {risk.mitigation ? (
          <p className="mt-2 rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Mitigation: </span>
            {risk.mitigation}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <select
          value={risk.status}
          onChange={(e) => onUpdate({ status: e.target.value })}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
