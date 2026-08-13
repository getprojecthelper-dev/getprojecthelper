import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { withMeter } from "@/components/credit-meter";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CodeBlock } from "@/components/code-block";
import { MeterBar } from "@/components/metrics";
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
import { DOC_TYPES, type DocFormat, type DocType } from "@/lib/doc-templates";
import {
  analyzeDocument,
  deleteDocument,
  generateDocument,
  listDocuments,
  reviseDocument,
  updateDocument,
  type DocAuthor,
  type DocSection,
  type DocumentAnalysis,
  type GeneratedDocument,
} from "@/lib/documents.functions";
import { CREDIT_HOLDS, formatCredits } from "@/lib/credit-costs";
import { useProjectId } from "@/lib/use-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId/documents")({
  head: () => ({
    meta: [
      { title: "Documentation Templates — Project Helper" },
      {
        name: "description",
        content:
          "Pick a template — research paper, literature review, report or synopsis — and let AI draft it from your project data, readable and editable right here.",
      },
      { property: "og:title", content: "Documentation Templates — Project Helper" },
      {
        property: "og:description",
        content:
          "AI-written academic documents built from your own project, readable and editable on site.",
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
        description="Choose a template, tell us who is on the team, import your project — the AI writes the document, shows it here, and hands you compile-ready LaTeX."
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
                    {doc.meta?.["doc_type_label"] ?? doc.doc_type} ·{" "}
                    {doc.meta?.["format_label"] ?? doc.format} ·{" "}
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

      {open ? (
        <DocumentViewer
          doc={open}
          onClose={() => setOpen(null)}
          onSaved={() => void qc.invalidateQueries({ queryKey: ["documents", projectId] })}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Wizard: format → import projects → details & members → generate      */
/* ------------------------------------------------------------------ */

function CreditBreakdown({ importedCount }: { importedCount: number }) {
  const draft = CREDIT_HOLDS.generate_document + Math.min(importedCount, 3);
  const rows: { step: string; note: string; cost: number }[] = [
    { step: "Format selection", note: "Choosing a template layout", cost: 0 },
    {
      step: "Import project data",
      note: importedCount
        ? `${importedCount} extra project${importedCount > 1 ? "s" : ""} added as context`
        : "This project is always included",
      cost: importedCount ? Math.min(importedCount, 3) : 0,
    },
    { step: "AI draft", note: "Writing and formatting the document", cost: CREDIT_HOLDS.generate_document },
    { step: "Export (LaTeX / text)", note: "Copy and download are free", cost: 0 },
  ];

  return (
    <div className="panel space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Credit breakdown
        </p>
        <Badge variant="secondary" className="text-[11px]">
          Estimate
        </Badge>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.step} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="block">{row.step}</span>
              <span className="block text-xs text-muted-foreground">{row.note}</span>
            </span>
            <span
              className={`shrink-0 tabular-nums ${row.cost ? "font-medium" : "text-muted-foreground"}`}
            >
              {row.cost ? `${formatCredits(row.cost)} cr` : "Free"}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="font-medium">Reserved before you confirm</span>
        <span className="font-display text-base">{formatCredits(draft)} credits</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Credits are held up front and settled to your real usage once the document is ready — you
        are only charged for what the AI actually uses.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
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
  const [titleTouched, setTitleTouched] = useState(false);
  const [venue, setVenue] = useState("");
  const [keywords, setKeywords] = useState("");
  const [notes, setNotes] = useState("");
  const [authors, setAuthors] = useState<DocAuthor[]>([emptyAuthor("Lead author")]);
  const [imported, setImported] = useState<string[]>([]);

  const projects = useProjects();
  const generate = withMeter("generate_document", useServerFn(generateDocument));

  const current = (projects.data ?? []).find((p) => p.id === projectId) ?? null;

  /** Entering the details step pre-fills what we already know about the project. */
  const goToDetails = () => {
    if (!titleTouched) {
      const base = current?.name?.trim();
      if (base) setTitle(base);
    }
    if (!keywords.trim()) {
      const domain = (current as { domain?: string | null } | null)?.domain;
      const stack = (current as { tech_stack?: string[] | null } | null)?.tech_stack;
      const seed = [
        domain?.replaceAll("_", " "),
        ...(Array.isArray(stack) ? stack.slice(0, 4) : []),
      ]
        .filter(Boolean)
        .join(", ");
      if (seed) setKeywords(seed);
    }
    setStep(2);
  };

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
          authors: authors.filter((a) => a.name.trim()).map((a) => ({ ...a, name: a.name.trim() })),
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

  const canContinue = step === 0 ? Boolean(format) : true;
  const canGenerate = title.trim().length > 2 && authors.some((a) => a.name.trim());

  const setAuthor = (index: number, patch: Partial<DocAuthor>) =>
    setAuthors((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));

  return (
    <Dialog open onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{type.label}</DialogTitle>
          <DialogDescription>
            {["Choose a format", "Import project data", "Paper details & members"][step]}
          </DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-2 text-xs text-muted-foreground">
          {["Format", "Import", "Details"].map((label, i) => (
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

        {step === 2 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => {
                  setTitleTouched(true);
                  setTitle(e.target.value);
                }}
                placeholder="e.g. A Deep Learning Approach to Crop Disease Detection"
              />
              <p className="text-xs text-muted-foreground">
                Pre-filled from your project — edit it to the final paper title.
              </p>
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

        {step === 1 ? (
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
                            v
                              ? prev.length >= 3
                                ? prev
                                : [...prev, p.id]
                              : prev.filter((id) => id !== p.id),
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
                <p className="text-sm text-muted-foreground">
                  You have no other projects to import.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <CreditBreakdown importedCount={imported.length} />

        <DialogFooter className="gap-2 sm:justify-between">

          <Button
            variant="ghost"
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            disabled={run.isPending}
          >
            {step === 0 ? (
              "Cancel"
            ) : (
              <>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </>
            )}
          </Button>
          {step < 2 ? (
            <Button
              disabled={!canContinue}
              onClick={() => (step === 1 ? goToDetails() : setStep((s) => s + 1))}
            >
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={run.isPending || !canGenerate} onClick={() => run.mutate()}>
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
/* Viewer: rendered paper, manual + AI editing, LaTeX and score check   */
/* ------------------------------------------------------------------ */

function scoreTone(value: number, invert = true) {
  const good = invert ? value <= 35 : value >= 70;
  const mid = invert ? value <= 65 : value >= 45;
  return good ? "text-success" : mid ? "text-warning" : "text-destructive";
}

function ScoreCard({
  label,
  value,
  invert,
  hint,
}: {
  label: string;
  value: number;
  invert?: boolean;
  hint: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="panel p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 font-display text-3xl ${scoreTone(pct, invert)}`}>
        {pct}
        <span className="text-base text-muted-foreground">/100</span>
      </p>
      <MeterBar
        className="mt-3"
        value={pct}
        tone={
          (invert ? pct <= 35 : pct >= 70)
            ? "primary"
            : (invert ? pct <= 65 : pct >= 45)
              ? "warning"
              : "danger"
        }
      />
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function DocumentViewer({
  doc: initial,
  onClose,
  onSaved,
}: {
  doc: GeneratedDocument;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [doc, setDoc] = useState(initial);
  const [title, setTitle] = useState(initial.title);
  const [sections, setSections] = useState<DocSection[]>(initial.sections);
  const [latex, setLatex] = useState(initial.latex ?? "");
  const [dirty, setDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [focusSection, setFocusSection] = useState("");

  const parsedAnalysis = (() => {
    const raw = doc.meta?.["analysis"];
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DocumentAnalysis;
    } catch {
      return null;
    }
  })();
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(parsedAnalysis);

  const save = useServerFn(updateDocument);
  const revise = withMeter("revise_document", useServerFn(reviseDocument));
  const analyze = withMeter("analyze_document", useServerFn(analyzeDocument));

  const apply = (next: GeneratedDocument) => {
    setDoc(next);
    setTitle(next.title);
    setSections(next.sections);
    setLatex(next.latex ?? "");
    setDirty(false);
    onSaved();
  };

  const saveEdits = useMutation({
    mutationFn: () =>
      save({ data: { id: doc.id, title: title.trim(), sections, latex: latex || null } }),
    onSuccess: (next) => {
      apply(next);
      toast.success("Changes saved.");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Your changes couldn't be saved."),
  });

  const askAi = useMutation({
    mutationFn: () =>
      revise({
        data: { id: doc.id, instructions: instructions.trim(), sectionHeading: focusSection },
      }),
    onSuccess: (next) => {
      apply(next);
      setAskOpen(false);
      setInstructions("");
      toast.success("The paper has been revised.");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "The revision failed. Please try again."),
  });

  const runScore = useMutation({
    mutationFn: () => analyze({ data: { id: doc.id } }),
    onSuccess: (result) => setAnalysis(result),
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "The check couldn't be completed."),
  });

  const download = (content: string, extension: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLatex = async () => {
    try {
      await navigator.clipboard.writeText(latex);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Copying isn't available in this browser.");
    }
  };

  const plain = sections.map((s) => `${s.heading}\n\n${s.body}`).join("\n\n");
  const keywords = doc.meta?.["keywords"];

  const setSection = (index: number, patch: Partial<DocSection>) =>
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  return (
    <Dialog open onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="pr-8">{title}</DialogTitle>
          <DialogDescription>
            {doc.meta?.["doc_type_label"] ?? doc.doc_type} ·{" "}
            {doc.meta?.["format_label"] ?? doc.format}
            {doc.authors.length ? ` · ${doc.authors.map((a) => a.name).join(", ")}` : ""}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="paper" className="flex min-h-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="paper">Paper</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="latex">LaTeX</TabsTrigger>
              <TabsTrigger value="score">Score</TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setAskOpen(true)}>
                <Wand2 className="mr-1 h-3.5 w-3.5" /> Ask AI to edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => download(plain, "txt", "text/plain")}
              >
                <Download className="mr-1 h-3.5 w-3.5" /> Text
              </Button>
              <Button
                size="sm"
                disabled={!latex}
                onClick={() => download(latex, "tex", "application/x-tex")}
              >
                <Download className="mr-1 h-3.5 w-3.5" /> .tex
              </Button>
            </div>
          </div>

          {/* Rendered paper — read it here, no external editor needed */}
          <TabsContent value="paper" className="mt-4 max-h-[64vh] overflow-y-auto pr-1">
            <article className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-8 shadow-panel">
              <h2 className="text-center font-display text-2xl leading-tight">{title}</h2>
              {doc.authors.length ? (
                <div className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-2 text-center text-sm">
                  {doc.authors.map((a, i) => (
                    <div key={i}>
                      <p className="font-medium">{a.name}</p>
                      {a.affiliation ? (
                        <p className="text-xs text-muted-foreground">{a.affiliation}</p>
                      ) : null}
                      {a.email ? <p className="text-xs text-muted-foreground">{a.email}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
              {keywords ? (
                <p className="mt-6 text-sm">
                  <span className="font-semibold">Keywords — </span>
                  <span className="text-muted-foreground">{keywords}</span>
                </p>
              ) : null}
              <div className="mt-6 space-y-6">
                {sections.map((section, i) => (
                  <section key={i} className="space-y-2">
                    <h3 className="font-display text-base uppercase tracking-wide">
                      {i + 1}. {section.heading}
                    </h3>
                    <p className="whitespace-pre-wrap text-justify text-[13.5px] leading-7 text-card-foreground">
                      {section.body}
                    </p>
                  </section>
                ))}
              </div>
            </article>
          </TabsContent>

          {/* Manual editing */}
          <TabsContent value="edit" className="mt-4 max-h-[64vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
            {sections.map((section, i) => (
              <div key={i} className="space-y-2">
                <Input
                  value={section.heading}
                  onChange={(e) => {
                    setSection(i, { heading: e.target.value });
                    setDirty(true);
                  }}
                  className="font-medium"
                />
                <Textarea
                  rows={8}
                  value={section.body}
                  onChange={(e) => {
                    setSection(i, { body: e.target.value });
                    setDirty(true);
                  }}
                />
              </div>
            ))}
            <div className="sticky bottom-0 flex justify-end gap-2 bg-background/90 py-2 backdrop-blur">
              <Button disabled={!dirty || saveEdits.isPending} onClick={() => saveEdits.mutate()}>
                {saveEdits.isPending ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-1 h-4 w-4" /> Save changes
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="latex" className="mt-4 max-h-[64vh] overflow-y-auto">
            <div className="mb-3 flex justify-end">
              <Button size="sm" variant="outline" disabled={!latex} onClick={copyLatex}>
                {copied ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5 text-success" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copy LaTeX
                  </>
                )}
              </Button>
            </div>
            {latex ? (
              <CodeBlock code={latex} filename="main.tex" language="latex" />
            ) : (
              <p className="text-sm text-muted-foreground">No LaTeX source was generated.</p>
            )}
          </TabsContent>

          {/* Explicit originality / AI score check */}
          <TabsContent value="score" className="mt-4 max-h-[64vh] space-y-4 overflow-y-auto pr-1">
            <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">AI &amp; plagiarism check</p>
                <p className="text-xs text-muted-foreground">
                  Heuristic estimate of AI-likeness, plagiarism risk and how relevant the paper is
                  to your project.
                </p>
              </div>
              <Button disabled={runScore.isPending} onClick={() => runScore.mutate()}>
                {runScore.isPending ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Checking…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-1 h-4 w-4" /> Calculate score
                  </>
                )}
              </Button>
            </div>

            {analysis ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <ScoreCard
                    label="AI score"
                    value={analysis.ai_score}
                    invert
                    hint="Lower reads more human."
                  />
                  <ScoreCard
                    label="Plagiarism risk"
                    value={analysis.plagiarism_score}
                    invert
                    hint="Lower means more original phrasing."
                  />
                  <ScoreCard
                    label="Project relevance"
                    value={analysis.relevance_score}
                    hint="Higher means closer to your project."
                  />
                </div>
                <p className="panel p-4 text-sm text-muted-foreground">{analysis.verdict}</p>
                {[
                  { title: "Why it reads as AI", items: analysis.ai_reasons },
                  { title: "Plagiarism risk factors", items: analysis.plagiarism_reasons },
                  { title: "How to improve", items: analysis.suggestions },
                ]
                  .filter((g) => (g.items ?? []).length > 0)
                  .map((group) => (
                    <div key={group.title} className="panel p-4">
                      <p className="text-sm font-medium">{group.title}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {group.items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                <p className="text-xs text-muted-foreground">
                  Checked {new Date(analysis.checked_at).toLocaleString()}. These scores are an AI
                  estimate, not an official integrity report.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Run the check when you're ready — it costs credits, so it only runs when you ask.
              </p>
            )}
          </TabsContent>
        </Tabs>

        {askOpen ? (
          <Dialog open onOpenChange={(v) => (v ? null : setAskOpen(false))}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Ask AI to edit</DialogTitle>
                <DialogDescription>
                  Describe the change — the AI rewrites the paper and the LaTeX for you.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-focus">Focus (optional)</Label>
                  <select
                    id="ai-focus"
                    value={focusSection}
                    onChange={(e) => setFocusSection(e.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="">Whole document</option>
                    {sections.map((s) => (
                      <option key={s.heading} value={s.heading}>
                        {s.heading}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-instructions">What should change?</Label>
                  <Textarea
                    id="ai-instructions"
                    rows={5}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. Expand the results section with the accuracy numbers and make the abstract shorter."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setAskOpen(false)}
                  disabled={askAi.isPending}
                >
                  Cancel
                </Button>
                <Button
                  disabled={askAi.isPending || instructions.trim().length < 3}
                  onClick={() => askAi.mutate()}
                >
                  {askAi.isPending ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Revising…
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-1 h-4 w-4" /> Apply change
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
