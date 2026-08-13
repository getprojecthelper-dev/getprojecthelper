import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus, ScrollText, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MeterBar } from "@/components/metrics";
import { PageHeader } from "@/components/page-header";
import { RecordDialog, type RecordValues } from "@/components/record-dialog";
import { EmptyState } from "@/components/state-views";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRecordMutations } from "@/lib/db";
import { DOC_STATUSES, labelOf } from "@/lib/project-domain";
import { useWorkspace } from "@/lib/use-workspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projects/$projectId/documents")({
  head: () => ({
    meta: [
      { title: "Documentation — Project Helper" },
      { name: "description", content: "Write your report section by section and export it as Markdown." },
      { property: "og:title", content: "Documentation — Project Helper" },
      { property: "og:description", content: "Write and export your project report." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const { projectId, data } = useWorkspace();
  const { create, update, remove } = useRecordMutations("document_sections", projectId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);

  const sections = data?.docSections ?? [];
  const active = sections.find((s) => s.id === activeId) ?? sections[0] ?? null;

  useEffect(() => {
    setDraft(active?.content ?? "");
  }, [active?.id, active?.content]);

  if (!data) return null;

  const done = sections.filter((s) => s.status === "complete").length;
  const pct = sections.length === 0 ? 0 : Math.round((done / sections.length) * 100);

  const addSection = (values: RecordValues) => {
    create.mutate(
      {
        title: (values["title"] ?? "").trim(),
        position: sections.length,
        status: "not_started",
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  const exportMarkdown = () => {
    const md = [
      `# ${data.project.name}`,
      data.project.description ? `\n${data.project.description}\n` : "",
      ...sections.map((s) => `\n## ${s.title}\n\n${s.content?.trim() || "_Not written yet._"}\n`),
    ].join("\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-report.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported as Markdown.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentation"
        description="A structured report skeleton you can fill in as the project progresses."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportMarkdown} disabled={sections.length === 0}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add section
            </Button>
          </div>
        }
      />

      <div className="panel p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Report completion</span>
          <span className="font-medium">
            {done}/{sections.length} sections
          </span>
        </div>
        <MeterBar className="mt-3" value={pct} />
      </div>

      {sections.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-8 w-8" />}
          title="No report sections"
          description="Add sections such as Abstract, Introduction, Literature Review, Methodology, Results and Conclusion."
          action={<Button onClick={() => setOpen(true)}>Add a section</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveId(s.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  active?.id === s.id ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted",
                )}
              >
                <span className="truncate">{s.title}</span>
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    s.status === "complete"
                      ? "bg-success"
                      : s.status === "in_progress"
                        ? "bg-warning"
                        : "bg-border",
                  )}
                />
              </button>
            ))}
          </div>

          {active ? (
            <div className="panel space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg">{active.title}</h2>
                <div className="flex items-center gap-2">
                  <Select
                    value={active.status}
                    onValueChange={(status) => update.mutate({ id: active.id, values: { status } })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(active.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Textarea
                rows={18}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Write the ${active.title.toLowerCase()} section here. Markdown is supported in the export.`}
              />
              <div className="flex items-center gap-3">
                <Button
                  disabled={update.isPending || draft === (active.content ?? "")}
                  onClick={() =>
                    update.mutate(
                      { id: active.id, values: { content: draft } },
                      { onSuccess: () => toast.success("Section saved.") },
                    )
                  }
                >
                  Save section
                </Button>
                <span className="text-xs text-muted-foreground">
                  {draft.trim() ? `${draft.trim().split(/\s+/).length} words` : "Empty"} •{" "}
                  {labelOf(DOC_STATUSES, active.status)}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title="Add report section"
        fields={[{ name: "title", label: "Section title", type: "text", required: true }]}
        busy={create.isPending}
        onSubmit={addSection}
      />
    </div>
  );
}
