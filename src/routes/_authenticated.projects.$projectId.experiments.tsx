import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { ListRow, RecordDialog, type RecordValues } from "@/components/record-dialog";
import { EmptyState } from "@/components/state-views";
import { Button } from "@/components/ui/button";
import { useRecordMutations, type Experiment } from "@/lib/db";
import { useWorkspace } from "@/lib/use-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId/experiments")({
  head: () => ({
    meta: [
      { title: "Experiments — Project Helper" },
      { name: "description", content: "Log datasets, models, parameters and results for every run." },
      { property: "og:title", content: "Experiments — Project Helper" },
      { property: "og:description", content: "Track datasets, models, parameters and results." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExperimentsPage,
});

const FIELDS = [
  { name: "name", label: "Experiment", type: "text" as const, required: true, placeholder: "Baseline logistic regression" },
  { name: "dataset", label: "Dataset", type: "text" as const },
  { name: "model", label: "Model / approach", type: "text" as const },
  { name: "parameters", label: "Parameters", type: "textarea" as const, placeholder: "lr=0.01, epochs=20" },
  { name: "metrics", label: "Metrics", type: "textarea" as const, placeholder: "accuracy=0.87, f1=0.83" },
  { name: "results", label: "Results", type: "textarea" as const },
  { name: "notes", label: "Notes", type: "textarea" as const },
];

function ExperimentsPage() {
  const { projectId, data } = useWorkspace();
  const { create, update, remove } = useRecordMutations("experiments", projectId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Experiment | null>(null);

  if (!data) return null;
  const items = data.experiments;

  const submit = (values: RecordValues) => {
    const v = (k: string) => (values[k] ?? "").trim();
    const payload = {
      name: v("name"),
      dataset: v("dataset") || null,
      model: v("model") || null,
      parameters: v("parameters") || null,
      metrics: v("metrics") || null,
      results: v("results") || null,
      notes: v("notes") || null,
    };
    if (editing) update.mutate({ id: editing.id, values: payload }, { onSuccess: () => setOpen(false) });
    else create.mutate(payload, { onSuccess: () => setOpen(false) });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Experiments"
        description="A reproducible log of what you tried, with the numbers to back it up."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Log experiment
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<FlaskConical className="h-8 w-8" />}
          title="No experiments logged"
          description="Log each run with its dataset, parameters and metrics so your results section writes itself."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Log the first run
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((e) => (
            <ListRow
              key={e.id}
              title={e.name}
              meta={[e.dataset, e.model].filter(Boolean).join(" • ") || "No dataset or model recorded"}
              actions={
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(e);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(e.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              }
            >
              <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                {e.parameters ? (
                  <p>
                    <span className="font-medium text-foreground">Parameters: </span>
                    {e.parameters}
                  </p>
                ) : null}
                {e.metrics ? (
                  <p>
                    <span className="font-medium text-foreground">Metrics: </span>
                    {e.metrics}
                  </p>
                ) : null}
                {e.results ? (
                  <p className="sm:col-span-2">
                    <span className="font-medium text-foreground">Results: </span>
                    {e.results}
                  </p>
                ) : null}
              </div>
            </ListRow>
          ))}
        </div>
      )}

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit experiment" : "Log experiment"}
        fields={FIELDS}
        busy={create.isPending || update.isPending}
        initial={
          editing
            ? {
                name: editing.name,
                dataset: editing.dataset ?? "",
                model: editing.model ?? "",
                parameters: editing.parameters ?? "",
                metrics: editing.metrics ?? "",
                results: editing.results ?? "",
                notes: editing.notes ?? "",
              }
            : undefined
        }
        onSubmit={submit}
      />
    </div>
  );
}
