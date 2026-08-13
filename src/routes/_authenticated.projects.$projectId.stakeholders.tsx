import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Sparkles, Trash2, Users } from "lucide-react";
import { useState } from "react";

import { withMeter } from "@/components/credit-meter";
import { PageHeader } from "@/components/page-header";
import { RecordDialog, type RecordValues } from "@/components/record-dialog";
import { EmptyState } from "@/components/state-views";
import { Button } from "@/components/ui/button";
import { usePmMutations, type Stakeholder } from "@/lib/db";
import { generateRaci } from "@/lib/pm.functions";
import { useWorkspace } from "@/lib/use-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId/stakeholders")({
  head: () => ({
    meta: [
      { title: "Stakeholders & RACI — Project Helper" },
      { name: "description", content: "Stakeholder analysis and editable RACI matrix." },
      { property: "og:title", content: "Stakeholders & RACI — Project Helper" },
      { property: "og:description", content: "Stakeholder analysis and RACI matrix." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StakeholdersPage,
});

const RESP_OPTIONS = [
  { value: "R", label: "R — Responsible" },
  { value: "A", label: "A — Accountable" },
  { value: "C", label: "C — Consulted" },
  { value: "I", label: "I — Informed" },
];

function StakeholdersPage() {
  const { projectId, data } = useWorkspace();
  const { create, update, remove } = usePmMutations("stakeholders", projectId);
  const raciMut = usePmMutations("raci_assignments", projectId);
  const generate = withMeter("pm_raci", useServerFn(generateRaci));
  const [open, setOpen] = useState(false);

  if (!data) return null;
  const stakeholders = data.stakeholders;
  const raci = data.raci;

  const tasks = Array.from(new Set(raci.map((r) => r.task_name)));

  const submit = (values: RecordValues) => {
    create.mutate(
      {
        name: (values["name"] ?? "").trim(),
        role: values["role"]?.trim() || null,
        influence: values["influence"]?.trim() || null,
        interest: values["interest"]?.trim() || null,
        contact: values["contact"]?.trim() || null,
        notes: values["notes"]?.trim() || null,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  const setRaci = (taskName: string, stakeholderId: string, responsibility: string) => {
    const existing = raci.find((r) => r.task_name === taskName && r.stakeholder_id === stakeholderId);
    if (existing) {
      raciMut.update.mutate({ id: existing.id, values: { responsibility } });
    } else {
      raciMut.create.mutate({
        stakeholder_id: stakeholderId,
        task_name: taskName,
        responsibility,
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stakeholders & RACI"
        description="Who matters, how much influence they have, and who is responsible for each task."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void generate({ data: { projectId } })}>
              <Sparkles className="mr-1.5 h-4 w-4" /> Generate
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add stakeholder
            </Button>
          </div>
        }
      />

      {stakeholders.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No stakeholders yet"
          description="Generate a stakeholder list and RACI matrix with AI, or add people manually."
          action={
            <div className="flex gap-2">
              <Button onClick={() => void generate({ data: { projectId } })}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Generate
              </Button>
              <Button variant="outline" onClick={() => setOpen(true)}>
                Add stakeholder
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stakeholders.map((s) => (
              <StakeholderCard key={s.id} stakeholder={s} onDelete={() => remove.mutate(s.id)} />
            ))}
          </div>

          {tasks.length > 0 && (
            <div className="panel overflow-x-auto p-4">
              <h2 className="mb-3 text-sm font-semibold">RACI Matrix</h2>
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 text-left font-medium">Task</th>
                    {stakeholders.map((s) => (
                      <th key={s.id} className="px-2 py-2 text-center font-medium">
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task} className="border-b border-border/50">
                      <td className="py-2 pr-4 align-top">{task}</td>
                      {stakeholders.map((s) => {
                        const assignment = raci.find((r) => r.task_name === task && r.stakeholder_id === s.id);
                        return (
                          <td key={s.id} className="px-2 py-2 text-center">
                            <select
                              value={assignment?.responsibility ?? ""}
                              onChange={(e) => setRaci(task, s.id, e.target.value)}
                              className="h-8 w-20 rounded-md border border-input bg-background text-center text-xs"
                            >
                              <option value="">—</option>
                              {RESP_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.value}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title="Add stakeholder"
        fields={[
          { name: "name", label: "Name", type: "text", required: true },
          { name: "role", label: "Role", type: "text" },
          { name: "influence", label: "Influence", type: "select", options: [{ value: "", label: "—" }, { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }] },
          { name: "interest", label: "Interest", type: "select", options: [{ value: "", label: "—" }, { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }] },
          { name: "contact", label: "Contact", type: "text" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
        onSubmit={submit}
        busy={create.isPending}
      />
    </div>
  );
}

function StakeholderCard({ stakeholder, onDelete }: { stakeholder: Stakeholder; onDelete: () => void }) {
  return (
    <div className="panel space-y-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{stakeholder.name}</p>
          <p className="text-xs text-muted-foreground">{stakeholder.role}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {stakeholder.influence ? <span>Influence: {stakeholder.influence}</span> : null}
        {stakeholder.interest ? <span>Interest: {stakeholder.interest}</span> : null}
      </div>
      {stakeholder.contact ? <p className="text-xs text-muted-foreground">{stakeholder.contact}</p> : null}
      {stakeholder.notes ? <p className="text-xs text-muted-foreground">{stakeholder.notes}</p> : null}
    </div>
  );
}
