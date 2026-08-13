import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CodeBlock } from "@/components/code-block";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/lib/db";
import { DOC_TYPES, findDocType, type DocFormat, type DocType } from "@/lib/doc-templates";
import {
  deleteDocument,
  generateDocument,
  listDocuments,
  type DocAuthor,
  type GeneratedDocument,
} from "@/lib/documents.functions";
import { useProjectId } from "@/lib/use-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId/documents")({
  head: () => ({
    meta: [
      { title: "Documentation Templates — Project Helper" },
      {
        name: "description",
        content:
          "Pick a template — research paper, literature review, report or synopsis — and let AI draft it from your project data, ready for Overleaf.",
      },
      { property: "og:title", content: "Documentation Templates — Project Helper" },
      {
        property: "og:description",
        content: "AI-written academic documents built from your own project, exported as LaTeX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentsPage,
});

const emptyAuthor = (role = "Author"): DocAuthor => ({
  name: "",
  affiliation: "",
  email: "",
  role,
});

function DocumentsPage() {
  const projectId = useProjectId();
  const qc = useQueryClient();
  const list = useServerFn(listDocuments);
  const remove = useServerFn(deleteDocument);

  const [wizardType, setWizardType] = useState<DocType | null>(null);
  const [open, setOpen] = useState<GeneratedDocument | null>(null);

  const docs = useQuery({
    queryKey: ["documents", projectId],
    queryFn: () => list({ data: { projectId } }),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Document deleted.");
      void qc.invalidateQueries({ queryKey: ["documents", projectId] });
    },
    onError: () => toast.error("That document couldn't be deleted."),
  });

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title="Documentation"
        description="Choose a template, tell us who is on the team, import your project — the AI writes the document and hands you compile-ready LaTeX for Overleaf."
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Templates
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {DOC_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setWizardType(type)}
              className="panel flex h-full flex-col gap-3 p-5 text-left transition-colors"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4.5 w-4.5" />
              </span>
              <span className="font-display text-base">{type.label}</span>
              <span className="text-sm text-muted-foreground">{type.description}</span>
              <span className="mt-auto flex flex-wrap gap-1 pt-2">
                {type.formats.slice(0, 3).map((f) => (
                  <Badge key={f.id} variant="secondary" className="text-[11px]">
                    {f.label}
                  </Badge>
                ))}
                {type.formats.length > 3 ? (
                  <Badge variant="secondary" className="text-[11px]">
                    +{type.formats.length - 3}
                  </Badge>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your documents
        </h2>
        {docs.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (docs.data ?? []).length === 0 ? (
          <p className="panel p-6 text-sm text-muted-foreground">
            Nothing generated yet. Pick a template above to create your first document.
          </p>
        ) : (
          <div className="space-y-2">
            {(docs.data ?? []).map((doc) => (
              <div
                key={doc.id}
                className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{doc.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {doc.meta?.doc_type_label ?? doc.doc_type} · {doc.meta?.format_label ?? doc.format} ·{" "}
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => setOpen(doc)}>
                    Open
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete document"
                    onClick={() => del.mutate(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {wizardType ? (
        <DocumentWizard
          projectId={projectId}
          type={wizardType}
          onClose={() => setWizardType(null)}
          onDone={(doc) => {
            setWizardType(null);
            setOpen(doc);
            void qc.invalidateQueries({ queryKey: ["documents", projectId] });
          }}
        />
      ) : null}

      {open ? <DocumentViewer doc={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Wizard: format → details & members → import projects → generate      */
/* ------------------------------------------------------------------ */

function DocumentWizard({
  projectId,
  type,
  onClose,
  onDone,
}: {
  projectId: string;
  type: DocType;
  onClose: () => void;
  onDone: (doc: GeneratedDocument) => void;
}) {
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState<DocFormat | null>(type.formats[0] ?? null);
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [keywords, setKeywords] = useState("");
  const [notes, setNotes] = useState("");
  const [authors, setAuthors] = useState<DocAuthor[]>([emptyAuthor("Lead author")]);
  const [imported, setImported] = useState<string[]>([]);

  const projects = useProjects();
  const generate = useServerFn(generateDocument);

  const run = useMutation({
    mutationFn: () =>
      generate({
        data: {
          projectId,
          docType: type.id,
          docTypeLabel: type.label,
          format: format?.id ?? "",
          formatLabel: format?.label ?? "",
          formatBrief: format?.brief ?? "",
          title: title.trim(),
          authors: authors
            .filter((a) => a.name.trim())
            .map((a) => ({ ...a, name: a.name.trim() })),
          venue,
          keywords,
          notes,
          importedProjectIds: imported,
        },
      }),
    onSuccess: (doc) => {
      toast.success("Your document is ready.");
      onDone(doc);
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "The document couldn't be generated."),
  });

  const canContinue =
    step === 0 ? Boolean(format) : step === 1 ? title.trim().length > 2 && authors.some((a) => a.name.trim()) : true;

  const setAuthor = (index: number, patch: Partial<DocAuthor>) =>
    setAuthors((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));

  return (
    <Dialog open onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{type.label}</DialogTitle>
          <DialogDescription>
            {["Choose a format", "Paper details & members", "Import project data"][step]}
          </DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-2 text-xs text-muted-foreground">
          {["Format", "Details", "Import"].map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  i <= step ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {label}
              {i < 2 ? <span className="mx-1 h-px w-6 bg-border" /> : null}
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <div className="space-y-2">
            {type.formats.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f)}
                className={`w-full rounded-xl border p-4 text-left ${
                  format?.id === f.id ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{f.label}</span>
                  {format?.id === f.id ? <Check className="h-4 w-4 text-primary" /> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>
              </button>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. A Deep Learning Approach to Crop Disease Detection"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="doc-venue">Conference / journal / university</Label>
                <Input
                  id="doc-venue"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-keywords">Keywords</Label>
                <Input
                  id="doc-keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Comma separated (optional)"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Members
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAuthors((prev) => [...prev, emptyAuthor()])}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add member
                </Button>
              </div>
              {authors.map((author, i) => (
                <div key={i} className="panel space-y-3 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={author.name}
                      onChange={(e) => setAuthor(i, { name: e.target.value })}
                      placeholder="Full name"
                    />
                    <Input
                      value={author.role}
                      onChange={(e) => setAuthor(i, { role: e.target.value })}
                      placeholder="Role (author, guide, co-author)"
                    />
                    <Input
                      value={author.affiliation}
                      onChange={(e) => setAuthor(i, { affiliation: e.target.value })}
                      placeholder="Department, college / university"
                    />
                    <Input
                      value={author.email}
                      onChange={(e) => setAuthor(i, { email: e.target.value })}
                      placeholder="Email"
                    />
                  </div>
                  {authors.length > 1 ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAuthors((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-notes">Anything the AI should know?</Label>
              <Textarea
                id="doc-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional — emphasis, page limit, results to highlight…"
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This project is always used as the source. You can also import up to 3 of your other
              projects so the document covers them too.
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {(projects.data ?? [])
                .filter((p) => p.id !== projectId)
                .map((p) => {
                  const checked = imported.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          setImported((prev) =>
                            v ? (prev.length >= 3 ? prev : [...prev, p.id]) : prev.filter((id) => id !== p.id),
                          )
                        }
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{p.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {p.description ?? "No description"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              {(projects.data ?? []).filter((p) => p.id !== projectId).length === 0 ? (
                <p className="text-sm text-muted-foreground">You have no other projects to import.</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            disabled={run.isPending}
          >
            {step === 0 ? "Cancel" : (
              <>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </>
            )}
          </Button>
          {step < 2 ? (
            <Button disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={run.isPending} onClick={() => run.mutate()}>
              {run.isPending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Writing your document…
                </>
              ) : (
                <>
                  <Sparkles className="mr-1 h-4 w-4" /> Generate document
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Viewer: readable draft + Overleaf-ready LaTeX                        */
/* ------------------------------------------------------------------ */

function DocumentViewer({ doc, onClose }: { doc: GeneratedDocument; onClose: () => void }) {
  const download = (content: string, extension: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const plain = doc.sections.map((s) => `${s.heading}\n\n${s.body}`).join("\n\n");

  return (
    <Dialog open onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="pr-8">{doc.title}</DialogTitle>
          <DialogDescription>
            {doc.meta?.doc_type_label ?? doc.doc_type} · {doc.meta?.format_label ?? doc.format}
            {doc.authors.length ? ` · ${doc.authors.map((a) => a.name).join(", ")}` : ""}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="draft" className="flex min-h-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="latex">LaTeX (Overleaf)</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => download(plain, "txt", "text/plain")}>
                <Download className="mr-1 h-3.5 w-3.5" /> Text
              </Button>
              <Button
                size="sm"
                disabled={!doc.latex}
                onClick={() => download(doc.latex ?? "", "tex", "application/x-tex")}
              >
                <Download className="mr-1 h-3.5 w-3.5" /> .tex
              </Button>
            </div>
          </div>

          <TabsContent value="draft" className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
            <article className="space-y-5">
              {doc.meta?.keywords ? (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Keywords: </span>
                  {doc.meta.keywords}
                </p>
              ) : null}
              {doc.sections.map((section, i) => (
                <section key={i} className="space-y-2">
                  <h3 className="font-display text-base">{section.heading}</h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {section.body}
                  </p>
                </section>
              ))}
            </article>
          </TabsContent>

          <TabsContent value="latex" className="mt-4 max-h-[60vh] overflow-y-auto">
            {doc.latex ? (
              <CodeBlock code={doc.latex} filename="main.tex" language="latex" />
            ) : (
              <p className="text-sm text-muted-foreground">No LaTeX source was generated.</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Download <code>main.tex</code>, then upload it to Overleaf (New Project → Upload Project)
              to compile the formatted paper.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export { findDocType };
