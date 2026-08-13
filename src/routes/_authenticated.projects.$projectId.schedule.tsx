import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Download, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { withMeter } from "@/components/credit-meter";
import { PageHeader } from "@/components/page-header";
import { RecordDialog, type RecordValues } from "@/components/record-dialog";
import { EmptyState } from "@/components/state-views";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { usePmMutations, type ScheduleTask } from "@/lib/db";
import { exportProjectReportPdf, generateSchedule } from "@/lib/pm.functions";
import { useWorkspace } from "@/lib/use-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule — Project Helper" },
      { name: "description", content: "Interactive Gantt-style schedule for your project." },
      { property: "og:title", content: "Schedule — Project Helper" },
      { property: "og:description", content: "Interactive Gantt-style schedule." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedulePage,
});

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

function parseDate(v: string | null) {
  if (!v) return null;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayDiff(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

function SchedulePage() {
  const { projectId, data } = useWorkspace();
  const { create, update, remove } = usePmMutations("schedule_tasks", projectId);
  const generate = withMeter("pm_schedule", useServerFn(generateSchedule));
  const exportPdf = withMeter("pm_report_pdf", useServerFn(exportProjectReportPdf));
  const [open, setOpen] = useState(false);

  if (!data) return null;
  const tasks = data.schedule;

  const minDate = tasks
    .map((t) => parseDate(t.start_date))
    .filter(Boolean)[0] ?? null;

  const chartData = minDate
    ? tasks.map((t) => {
        const start = parseDate(t.start_date);
        const end = parseDate(t.end_date);
        const offset = start ? Math.max(0, dayDiff(start, minDate)) : 0;
        const duration = start && end ? Math.max(1, dayDiff(end, start) + 1) : 1;
        return { name: t.name, offset, duration, start: t.start_date, end: t.end_date };
      })
    : [];

  const submit = (values: RecordValues) => {
    const payload = {
      name: (values["name"] ?? "").trim(),
      start_date: values["start_date"] || null,
      end_date: values["end_date"] || null,
      owner: values["owner"]?.trim() || null,
      status: values["status"],
      duration_days: null,
      dependencies: null,
      milestone: false,
      position: tasks.length,
    };
    create.mutate(payload, { onSuccess: () => setOpen(false) });
  };

  const onExport = async () => {
    try {
      const result = (await exportPdf({ data: { projectId } })) as { pdfBase64: string; filename: string };
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${result.pdfBase64}`;
      link.download = result.filename;
      link.click();
      toast.success("Report downloaded.");
    } catch {
      toast.error("PDF export failed.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description="A Gantt-style view of tasks, milestones and owners. Generate with AI or edit manually."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void generate({ data: { projectId } })}>
              <Sparkles className="mr-1.5 h-4 w-4" /> Generate
            </Button>
            <Button variant="outline" onClick={onExport}>
              <Download className="mr-1.5 h-4 w-4" /> Export PDF
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add task
            </Button>
          </div>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title="No schedule yet"
          description="Generate a realistic schedule with AI, or add the first task yourself."
          action={
            <div className="flex gap-2">
              <Button onClick={() => void generate({ data: { projectId } })}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Generate
              </Button>
              <Button variant="outline" onClick={() => setOpen(true)}>
                Add task
              </Button>
            </div>
          }
        />
      ) : (
        <>
          {chartData.length > 0 && (
            <div className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold">Timeline</h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]?.payload as (typeof chartData)[number];
                        return (
                          <div className="rounded-lg border border-border bg-popover p-2 text-xs shadow">
                            <p className="font-medium">{row.name}</p>
                            <p className="text-muted-foreground">
                              {row.start} → {row.end}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="offset" stackId="a" fill="transparent" />
                    <Bar dataKey="duration" stackId="a" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Tasks</h2>
            {tasks.map((t) => (
              <ScheduleRow key={t.id} task={t} onUpdate={(v) => update.mutate({ id: t.id, values: v })} onDelete={() => remove.mutate(t.id)} />
            ))}
          </div>
        </>
      )}

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title="Add schedule task"
        fields={[
          { name: "name", label: "Task name", type: "text", required: true },
          { name: "start_date", label: "Start date", type: "date" },
          { name: "end_date", label: "End date", type: "date" },
          { name: "owner", label: "Owner", type: "text" },
          { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
        ]}
        onSubmit={submit}
        busy={create.isPending}
      />
    </div>
  );
}

function ScheduleRow({
  task,
  onUpdate,
  onDelete,
}: {
  task: ScheduleTask;
  onUpdate: (values: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{task.name}</span>
          <StatusBadge value={task.status} label={STATUS_OPTIONS.find((o) => o.value === task.status)?.label ?? task.status} />
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
          <span>{task.start_date ?? "—"} → {task.end_date ?? "—"}</span>
          {task.owner ? <span>Owner: {task.owner}</span> : null}
          {task.milestone ? <span className="text-primary">Milestone</span> : null}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <select
          value={task.status}
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
