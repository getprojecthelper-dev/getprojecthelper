import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Banknote, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { withMeter } from "@/components/credit-meter";
import { PageHeader } from "@/components/page-header";
import { RecordDialog, type RecordValues } from "@/components/record-dialog";
import { EmptyState } from "@/components/state-views";
import { Button } from "@/components/ui/button";
import { usePmMutations, type BudgetLine } from "@/lib/db";
import { generateBudget } from "@/lib/pm.functions";
import { useWorkspace } from "@/lib/use-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId/budget")({
  head: () => ({
    meta: [
      { title: "Budget — Project Helper" },
      { name: "description", content: "Track planned versus actual project spend." },
      { property: "og:title", content: "Budget — Project Helper" },
      { property: "og:description", content: "Track planned versus actual project spend." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BudgetPage,
});

function BudgetPage() {
  const { projectId, data } = useWorkspace();
  const { create, update, remove } = usePmMutations("budget_lines", projectId);
  const generate = withMeter("pm_budget", useServerFn(generateBudget));
  const [open, setOpen] = useState(false);

  if (!data) return null;
  const lines = data.budget;

  const totalPlanned = lines.reduce((a, b) => a + Number(b.planned || 0), 0);
  const totalActual = lines.reduce((a, b) => a + Number(b.actual || 0), 0);

  const chartData = Object.entries(
    lines.reduce<Record<string, { planned: number; actual: number }>>((acc, line) => {
      const category = line.category || "Other";
      if (!acc[category]) acc[category] = { planned: 0, actual: 0 };
      acc[category].planned += Number(line.planned || 0);
      acc[category].actual += Number(line.actual || 0);
      return acc;
    }, {}),
  ).map(([category, values]) => ({ category, ...values }));

  const submit = (values: RecordValues) => {
    create.mutate(
      {
        category: (values["category"] ?? "").trim() || "Other",
        item_name: values["item_name"]?.trim() || null,
        planned: Number(values["planned"] || 0),
        actual: Number(values["actual"] || 0),
        notes: values["notes"]?.trim() || null,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget"
        description="Keep planned and actual spending visible so overruns don't surprise you."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void generate({ data: { projectId } })}>
              <Sparkles className="mr-1.5 h-4 w-4" /> Generate
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add line
            </Button>
          </div>
        }
      />

      {lines.length === 0 ? (
        <EmptyState
          icon={<Banknote className="h-8 w-8" />}
          title="No budget yet"
          description="Estimate costs with AI or add budget lines manually."
          action={
            <div className="flex gap-2">
              <Button onClick={() => void generate({ data: { projectId } })}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Generate
              </Button>
              <Button variant="outline" onClick={() => setOpen(true)}>
                Add line
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Planned" value={totalPlanned.toFixed(2)} />
            <MetricCard label="Actual" value={totalActual.toFixed(2)} />
            <MetricCard
              label="Variance"
              value={`${totalActual > totalPlanned ? "+" : ""}${(totalActual - totalPlanned).toFixed(2)}`}
              tone={totalActual > totalPlanned ? "text-destructive" : "text-success"}
            />
          </div>

          {chartData.length > 0 && (
            <div className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold">Spend by category</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="planned" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Budget lines</h2>
            {lines.map((line) => (
              <BudgetRow key={line.id} line={line} onUpdate={(v) => update.mutate({ id: line.id, values: v })} onDelete={() => remove.mutate(line.id)} />
            ))}
          </div>
        </>
      )}

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title="Add budget line"
        fields={[
          { name: "category", label: "Category", type: "text", required: true },
          { name: "item_name", label: "Item", type: "text" },
          { name: "planned", label: "Planned", type: "number" },
          { name: "actual", label: "Actual", type: "number" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
        onSubmit={submit}
        busy={create.isPending}
      />
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl ${tone ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

function BudgetRow({
  line,
  onUpdate,
  onDelete,
}: {
  line: BudgetLine;
  onUpdate: (values: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const variance = Number(line.actual || 0) - Number(line.planned || 0);
  return (
    <div className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{line.item_name || line.category}</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{line.category}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{line.notes}</p>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-right">
          <p>Planned {Number(line.planned || 0).toFixed(2)}</p>
          <p className={variance > 0 ? "text-destructive" : "text-muted-foreground"}>Actual {Number(line.actual || 0).toFixed(2)}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
