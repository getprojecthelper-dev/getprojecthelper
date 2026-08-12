import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { ListRow, RecordDialog, type RecordValues } from "@/components/record-dialog";
import { EmptyState } from "@/components/state-views";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useRecordMutations, type Requirement } from "@/lib/db";
import {
  PRIORITIES,
  REQUIREMENT_STATUSES,
  REQUIREMENT_TYPES,
  labelOf,
} from "@/lib/project-domain";
import { useWorkspace } from "@/lib/use-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId/requirements")({
  head: () => ({
    meta: [
      { title: "Requirements — Project Helper" },
      { name: "description", content: "Capture functional and non-functional requirements with acceptance criteria." },
      { property: "og:title", content: "Requirements — Project Helper" },
      { property: "og:description", content: "Requirements with acceptance criteria and traceability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequirementsPage,
});

const FIELDS = [
  { name: "code", label: "Code", type: "text" as const, required: true, placeholder: "FR-01" },
  { name: "title", label: "Requirement", type: "text" as const, required: true },
  { name: "description", label: "Description", type: "textarea" as const },
  { name: "acceptance_criteria", label: "Acceptance criteria", type: "textarea" as const, placeholder: "Given… when… then…" },
  { name: "req_type", label: "Type", type: "select" as const, options: [...REQUIREMENT_TYPES] },
  { name: "status", label: "Status", type: "select" as const, options: [...REQUIREMENT_STATUSES] },
  { name: "priority", label: "Priority", type: "select" as const, options: [...PRIORITIES] },
];

function RequirementsPage() {
  const { projectId, data } = useWorkspace();
  const { create, update, remove } = useRecordMutations("requirements", projectId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Requirement | null>(null);

  if (!data) return null;
  const items = data.requirements;
  const nextCode = `FR-${String(items.length + 1).padStart(2, "0")}`;

  const submit = (values: RecordValues) => {
    const payload = {
      code: values.code!.trim(),
      title: values.title!.trim(),
      description: values.description?.trim() || null,
      acceptance_criteria: values.acceptance_criteria?.trim() || null,
      req_type: values.req_type!,
      status: values.status!,
      priority: values.priority!,
    };
    if (editing) update.mutate({ id: editing.id, values: payload }, { onSuccess: () => setOpen(false) });
    else create.mutate(payload, { onSuccess: () => setOpen(false) });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requirements"
        description="Everything you build and test should trace back to a requirement here."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add requirement
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="No requirements yet"
          description="Start with three or four functional requirements — what must the system do for a user?"
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Add the first requirement
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((r) => {
            const linkedTests = data.tests.filter((t) => t.requirement_id === r.id).length;
            return (
              <ListRow
                key={r.id}
                title={`${r.code} · ${r.title}`}
                meta={`${labelOf(REQUIREMENT_TYPES, r.req_type)} • ${labelOf(PRIORITIES, r.priority)} priority • ${linkedTests} linked test(s)`}
                badges={<StatusBadge value={r.status} label={labelOf(REQUIREMENT_STATUSES, r.status)} />}
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
                {r.acceptance_criteria ? (
                  <p className="mt-2 rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Acceptance: </span>
                    {r.acceptance_criteria}
                  </p>
                ) : null}
              </ListRow>
            );
          })}
        </div>
      )}

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit requirement" : "New requirement"}
        fields={FIELDS}
        busy={create.isPending || update.isPending}
        initial={
          editing
            ? {
                code: editing.code,
                title: editing.title,
                description: editing.description ?? "",
                acceptance_criteria: editing.acceptance_criteria ?? "",
                req_type: editing.req_type,
                status: editing.status,
                priority: editing.priority,
              }
            : { code: nextCode }
        }
        onSubmit={submit}
      />
    </div>
  );
}
