import { createFileRoute } from "@tanstack/react-router";
import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { ListRow, RecordDialog, type RecordValues } from "@/components/record-dialog";
import { EmptyState } from "@/components/state-views";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useRecordMutations, type Task } from "@/lib/db";
import {
  PRIORITIES,
  STAGES,
  STAGE_LABELS,
  TASK_STATUSES,
  isOverdue,
  labelOf,
} from "@/lib/project-domain";
import { useWorkspace } from "@/lib/use-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId/tasks")({
  head: () => ({
    meta: [
      { title: "Plan & tasks — Project Helper" },
      { name: "description", content: "Break your project plan into trackable tasks by stage." },
      { property: "og:title", content: "Plan & tasks — Project Helper" },
      { property: "og:description", content: "Break your plan into trackable tasks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasksPage,
});

const FIELDS = [
  { name: "title", label: "Task", type: "text" as const, required: true },
  { name: "description", label: "Details", type: "textarea" as const },
  { name: "stage", label: "Stage", type: "select" as const, options: STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] })) },
  { name: "status", label: "Status", type: "select" as const, options: [...TASK_STATUSES] },
  { name: "priority", label: "Priority", type: "select" as const, options: [...PRIORITIES] },
  { name: "due_date", label: "Due date", type: "date" as const },
];

function TasksPage() {
  const { projectId, data } = useWorkspace();
  const { create, update, remove } = useRecordMutations("tasks", projectId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  if (!data) return null;
  const tasks = data.tasks;

  const submit = (values: RecordValues) => {
    const v = (k: string) => (values[k] ?? "").trim();
    const payload = {
      title: v("title"),
      description: v("description") || null,
      stage: v("stage"),
      status: v("status"),
      priority: v("priority"),
      due_date: v("due_date") || null,
    };
    if (editing) update.mutate({ id: editing.id, values: payload }, { onSuccess: () => setOpen(false) });
    else create.mutate(payload, { onSuccess: () => setOpen(false) });
  };

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (task: Task) => {
    setEditing(task);
    setOpen(true);
  };

  const byStatus = TASK_STATUSES.map((s) => ({
    ...s,
    items: tasks.filter((t) => t.status === s.value),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan & tasks"
        description="Every task is tied to a lifecycle stage, so progress and health stay honest."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Add task
          </Button>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-8 w-8" />}
          title="No tasks yet"
          description="Add the first task of your plan. Template tasks are created automatically for new projects."
          action={<Button onClick={openNew}>Add your first task</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {byStatus.map((col) => (
            <div key={col.value} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{col.label}</h2>
                <span className="text-xs text-muted-foreground">{col.items.length}</span>
              </div>
              {col.items.map((t) => (
                <div key={t.id} className="panel space-y-2 p-3">
                  <p className="text-sm font-medium">{t.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge value={t.priority} label={labelOf(PRIORITIES, t.priority)} />
                    <StatusBadge value="draft" label={STAGE_LABELS[t.stage as never] ?? t.stage} />
                  </div>
                  {t.due_date ? (
                    <p
                      className={
                        isOverdue(t.due_date, t.status)
                          ? "text-xs font-medium text-destructive"
                          : "text-xs text-muted-foreground"
                      }
                    >
                      Due {t.due_date}
                    </p>
                  ) : null}
                  <div className="flex gap-1 pt-1">
                    {t.status !== "completed" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          update.mutate({ id: t.id, values: { status: "completed" } })
                        }
                      >
                        Complete
                      </Button>
                    ) : null}
                    <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {col.items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                  Nothing here.
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {tasks.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">All tasks</h2>
          {tasks.map((t) => (
            <ListRow
              key={t.id}
              title={t.title}
              meta={`${STAGE_LABELS[t.stage as never] ?? t.stage} • ${labelOf(TASK_STATUSES, t.status)}${t.due_date ? ` • due ${t.due_date}` : ""}`}
              badges={<StatusBadge value={t.status} label={labelOf(TASK_STATUSES, t.status)} />}
              actions={
                <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            >
              {t.description ? (
                <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
              ) : null}
            </ListRow>
          ))}
        </div>
      ) : null}

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit task" : "New task"}
        fields={FIELDS}
        busy={create.isPending || update.isPending}
        initial={
          editing
            ? {
                title: editing.title,
                description: editing.description ?? "",
                stage: editing.stage,
                status: editing.status,
                priority: editing.priority,
                due_date: editing.due_date ?? "",
              }
            : undefined
        }
        onSubmit={submit}
      />
    </div>
  );
}
