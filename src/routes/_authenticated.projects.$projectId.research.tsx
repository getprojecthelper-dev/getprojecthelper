import { createFileRoute } from "@tanstack/react-router";
import { BookMarked, ExternalLink, Pencil, Plus, StickyNote, Trash2 } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { ListRow, RecordDialog, type RecordValues } from "@/components/record-dialog";
import { EmptyState } from "@/components/state-views";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRecordMutations, type ResearchNote, type ResearchSource } from "@/lib/db";
import { useWorkspace } from "@/lib/use-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId/research")({
  head: () => ({
    meta: [
      { title: "Research — Project Helper" },
      { name: "description", content: "Collect sources and thematic notes for your literature review." },
      { property: "og:title", content: "Research — Project Helper" },
      { property: "og:description", content: "Sources and notes for your literature review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResearchPage,
});

const SOURCE_TYPES = [
  { value: "paper", label: "Paper" },
  { value: "book", label: "Book" },
  { value: "article", label: "Article" },
  { value: "documentation", label: "Documentation" },
  { value: "dataset", label: "Dataset" },
  { value: "other", label: "Other" },
];

const SOURCE_FIELDS = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "authors", label: "Authors", type: "text" as const },
  { name: "year", label: "Year", type: "number" as const },
  { name: "source_type", label: "Type", type: "select" as const, options: SOURCE_TYPES },
  { name: "url", label: "URL", type: "text" as const, placeholder: "https://" },
  { name: "notes", label: "Why it matters", type: "textarea" as const },
];

const NOTE_FIELDS = [
  { name: "title", label: "Note title", type: "text" as const, required: true },
  { name: "theme", label: "Theme", type: "text" as const, placeholder: "Gap in existing work" },
  { name: "content", label: "Note", type: "textarea" as const, rows: 6 },
];

function ResearchPage() {
  const { projectId, data } = useWorkspace();
  const sources = useRecordMutations("research_sources", projectId);
  const notes = useRecordMutations("research_notes", projectId);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [editSource, setEditSource] = useState<ResearchSource | null>(null);
  const [editNote, setEditNote] = useState<ResearchNote | null>(null);

  if (!data) return null;

  const submitSource = (values: RecordValues) => {
    const v = (k: string) => (values[k] ?? "").trim();
    const yearRaw = v("year");
    const payload = {
      title: v("title"),
      authors: v("authors") || null,
      year: yearRaw ? Number(yearRaw) : null,
      source_type: v("source_type") || "paper",
      url: v("url") || null,
      notes: v("notes") || null,
    };
    if (editSource)
      sources.update.mutate({ id: editSource.id, values: payload }, { onSuccess: () => setSourceOpen(false) });
    else sources.create.mutate(payload, { onSuccess: () => setSourceOpen(false) });
  };

  const submitNote = (values: RecordValues) => {
    const v = (k: string) => (values[k] ?? "").trim();
    const payload = { title: v("title"), theme: v("theme") || null, content: v("content") || null };
    if (editNote)
      notes.update.mutate({ id: editNote.id, values: payload }, { onSuccess: () => setNoteOpen(false) });
    else notes.create.mutate(payload, { onSuccess: () => setNoteOpen(false) });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Research"
        description="Your literature review, one source and one insight at a time."
      />

      <Tabs defaultValue="sources">
        <TabsList>
          <TabsTrigger value="sources">Sources ({data.sources.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({data.notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-4 space-y-3">
          <Button
            onClick={() => {
              setEditSource(null);
              setSourceOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add source
          </Button>
          {data.sources.length === 0 ? (
            <EmptyState
              icon={<BookMarked className="h-8 w-8" />}
              title="No sources yet"
              description="Add the papers, books and docs you're relying on, with a line on why each one matters."
            />
          ) : (
            data.sources.map((s) => (
              <ListRow
                key={s.id}
                title={s.title}
                meta={[s.authors, s.year, s.source_type].filter(Boolean).join(" • ")}
                actions={
                  <>
                    {s.url ? (
                      <Button size="icon" variant="ghost" asChild>
                        <a href={s.url} target="_blank" rel="noreferrer noopener">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : null}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditSource(s);
                        setSourceOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => sources.remove.mutate(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                }
              >
                {s.notes ? <p className="mt-2 text-sm text-muted-foreground">{s.notes}</p> : null}
              </ListRow>
            ))
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-3">
          <Button
            onClick={() => {
              setEditNote(null);
              setNoteOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add note
          </Button>
          {data.notes.length === 0 ? (
            <EmptyState
              icon={<StickyNote className="h-8 w-8" />}
              title="No notes yet"
              description="Group your reading into themes — themes become the paragraphs of your literature review."
            />
          ) : (
            data.notes.map((n) => (
              <ListRow
                key={n.id}
                title={n.title}
                meta={n.theme ?? "No theme"}
                actions={
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditNote(n);
                        setNoteOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => notes.remove.mutate(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                }
              >
                {n.content ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{n.content}</p>
                ) : null}
              </ListRow>
            ))
          )}
        </TabsContent>
      </Tabs>

      <RecordDialog
        open={sourceOpen}
        onOpenChange={setSourceOpen}
        title={editSource ? "Edit source" : "Add source"}
        fields={SOURCE_FIELDS}
        busy={sources.create.isPending || sources.update.isPending}
        initial={
          editSource
            ? {
                title: editSource.title,
                authors: editSource.authors ?? "",
                year: editSource.year ? String(editSource.year) : "",
                source_type: editSource.source_type,
                url: editSource.url ?? "",
                notes: editSource.notes ?? "",
              }
            : undefined
        }
        onSubmit={submitSource}
      />

      <RecordDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        title={editNote ? "Edit note" : "Add note"}
        fields={NOTE_FIELDS}
        busy={notes.create.isPending || notes.update.isPending}
        initial={
          editNote
            ? { title: editNote.title, theme: editNote.theme ?? "", content: editNote.content ?? "" }
            : undefined
        }
        onSubmit={submitNote}
      />
    </div>
  );
}
