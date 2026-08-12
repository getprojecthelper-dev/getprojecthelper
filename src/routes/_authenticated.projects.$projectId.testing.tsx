import { createFileRoute } from "@tanstack/react-router";
import { CheckSquare, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { MetricCard } from "@/components/metrics";
import { PageHeader } from "@/components/page-header";
import { ListRow, RecordDialog, type RecordValues } from "@/components/record-dialog";
import { EmptyState } from "@/components/state-views";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useRecordMutations, type TestCase } from "@/lib/db";
import { TEST_STATUSES, labelOf } from "@/lib/project-domain";
import { useWorkspace } from "@/lib/use-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId/testing")({
  head: () => ({
    meta: [
      { title: "Testing — Project Helper" },
      { name: "description", content: "Record test cases, expected results and outcomes as evidence." },
      { property: "og:title", content: "Testing — Project Helper" },
      { property: "og:description", content: "Test cases and results as project evidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TestingPage,
});

function TestingPage() {
  const { projectId, data } = useWorkspace();
  const { create, update, remove } = useRecordMutations("test_cases", projectId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TestCase | null>(null);

  if (!data) return null;
  const tests = data.tests;
  const passed = tests.filter((t) => t.status === "passed").length;
  const failed = tests.filter((t) => t.status === "failed").length;

  const fields = [
    { name: "title", label: "Test case", type: "text" as const, required: true },
    { name: "expected_result", label: "Expected result", type: "textarea" as const },
    { name: "actual_result", label: "Actual result", type: "textarea" as const },
    { name: "status", label: "Status", type: "select" as const, options: [...TEST_STATUSES] },
    {
      name: "requirement_id",
      label: "Linked requirement",
      type: "select" as const,
      options: [
        { value: "none", label: "Not linked" },
        ...data.requirements.map((r) => ({ value: r.id, label: `${r.code} · ${r.title}` })),
      ],
    },
  ];

  const submit = (values: RecordValues) => {
    const payload = {
      title: values.title!.trim(),
      expected_result: values.expected_result?.trim() || null,
      actual_result: values.actual_result?.trim() || null,
      status: values.status!,
      requirement_id: values.requirement_id && values.requirement_id !== "none" ? values.requirement_id : null,
    };
    if (editing) update.mutate({ id: editing.id, values: payload }, { onSuccess: () => setOpen(false) });
    else create.mutate(payload, { onSuccess: () => setOpen(false) });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testing"
        description="Evidence beats claims. Record what you tested, what you expected and what happened."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add test case
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total tests" value={tests.length} />
        <MetricCard label="Passing" value={passed} tone="good" />
        <MetricCard label="Failing" value={failed} tone={failed > 0 ? "bad" : "default"} />
      </div>

      {tests.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-8 w-8" />}
          title="No test cases yet"
          description="Write one test per completed requirement. Examiners look for traceability between them."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Add the first test case
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {tests.map((t) => {
            const req = data.requirements.find((r) => r.id === t.requirement_id);
            return (
              <ListRow
                key={t.id}
                title={t.title}
                meta={req ? `Traces to ${req.code}` : "Not linked to a requirement"}
                badges={<StatusBadge value={t.status} label={labelOf(TEST_STATUSES, t.status)} />}
                actions={
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => update.mutate({ id: t.id, values: { status: "passed" } })}
                    >
                      Pass
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => update.mutate({ id: t.id, values: { status: "failed" } })}
                    >
                      Fail
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(t);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                }
              >
                {t.expected_result || t.actual_result ? (
                  <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <p>
                      <span className="font-medium text-foreground">Expected: </span>
                      {t.expected_result ?? "—"}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Actual: </span>
                      {t.actual_result ?? "—"}
                    </p>
                  </div>
                ) : null}
              </ListRow>
            );
          })}
        </div>
      )}

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit test case" : "New test case"}
        fields={fields}
        busy={create.isPending || update.isPending}
        initial={
          editing
            ? {
                title: editing.title,
                expected_result: editing.expected_result ?? "",
                actual_result: editing.actual_result ?? "",
                status: editing.status,
                requirement_id: editing.requirement_id ?? "none",
              }
            : undefined
        }
        onSubmit={submit}
      />
    </div>
  );
}
