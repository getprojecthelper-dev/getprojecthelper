import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileCode2,
  FileSpreadsheet,

  FileText,
  FileType,
  FolderTree,
  Loader2,
  Lightbulb,
  ListChecks,
  HelpCircle,
  SlidersHorizontal,

  Lock,
  MapPin,
  NotebookPen,
  Presentation,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { withMeter } from "@/components/credit-meter";
import { CodeBlock } from "@/components/code-block";
import { DocSheet } from "@/components/doc-sheet";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { fixSectionError, generateSection } from "@/lib/builder.functions";
import { getPlaybook, type DomainPlaybook } from "@/lib/domain-playbooks";
import { type OfficeApp } from "@/lib/file-guidance";
import {
  downloadEmptyOfficeFile,
  downloadFilledSpreadsheet,
  parseFileSpec,
  parseMarkdownTables,
  type FileSpec,
} from "@/lib/office-files";
import {
  buildNotebook,
  downloadNotebook,
  isNotebookFile,
  notebookName,
  notebookPath,
  type NotebookCell,
} from "@/lib/notebook";
import { useProjectId } from "@/lib/use-workspace";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_authenticated/projects/$projectId/build")({
  component: BuildPage,
});

interface Block {
  title: string;
  code: string;
  explanation: string[];
  why?: string[];
  parameters?: { name?: string; value?: string; why?: string }[];
  file?: string;
  action?: string;
}



interface StructureFile {
  path: string;
  content: string;
}

interface FixChange {
  file?: string;
  part: string;
  what_changed: string;
  why: string;
  removed?: string[];
  added?: string[];
}

interface FixedBlock {
  part_number?: number;
  title?: string;
  code?: string;
  explanation?: string[];
  file?: string;
  action?: string;
}

interface FixRound {
  round?: number;
  diagnosis?: string;
  error_explained?: string;
  changes?: FixChange[];
  fixed_blocks?: FixedBlock[];
  language?: string;
  reported?: string;
  at?: string;
}

interface FixNotes extends FixRound {
  rounds?: FixRound[];
}


interface Walkthrough {
  completed?: string[];
  whats_next?: string[];
  analogy?: string;
}

interface BuildSection {
  id: string;
  position: number;
  title: string;
  question: string | null;
  objective: string | null;
  kind: string;
  code: string | null;
  language: string;
  blocks: Block[];
  files: StructureFile[];
  explanation: string[];
  insights: string[];
  business_connection: string | null;
  structure: string | null;
  status: string;
  fix_notes: FixNotes | null;
  walkthrough: Walkthrough | null;
}


const sectionsKey = (projectId: string) => ["build-sections", projectId] as const;

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

function useSections(projectId: string) {
  return useQuery({
    queryKey: sectionsKey(projectId),
    queryFn: async (): Promise<BuildSection[]> => {
      const { data, error } = await supabase
        .from("build_sections")
        .select("*")
        .eq("project_id", projectId)
        .order("position");
      if (error) throw new Error("We couldn't load the implementation sections.");
      return (data ?? []).map((row) => ({
        ...(row as unknown as BuildSection),
        blocks: asArray<Block>((row as Record<string, unknown>)["blocks"]),
        files: asArray<StructureFile>((row as Record<string, unknown>)["files"]),
        explanation: asArray<string>(row.explanation),
        insights: asArray<string>(row.insights),
        fix_notes:
          row.fix_notes && typeof row.fix_notes === "object" && !Array.isArray(row.fix_notes)
            ? (row.fix_notes as FixNotes)
            : null,
        walkthrough: (() => {
          const value = (row as Record<string, unknown>)["walkthrough"];
          return value && typeof value === "object" && !Array.isArray(value)
            ? (value as Walkthrough)
            : null;
        })(),

      }));
    },
  });
}

function BuildPage() {
  const projectId = useProjectId();
  const qc = useQueryClient();
  const { setOpen } = useSidebar();
  // Implementation needs the width: collapse the workspace sidebar while here.
  useEffect(() => {
    setOpen(false);
    return () => setOpen(true);
  }, [setOpen]);
  const { data: sections = [], isPending } = useSections(projectId);

  const { data: meta } = useQuery({
    queryKey: ["project-domain", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("domain,name,pm_profile")
        .eq("id", projectId)
        .maybeSingle();
      return {
        domain: (data?.domain as string | null) ?? null,
        name: (data?.name as string | null) ?? null,
        pm: (data?.pm_profile as { industry?: string; methodology?: string; duration?: string } | null) ?? null,
      };
    },
  });
  const domain = meta?.domain ?? null;
  const playbook = getPlaybook(domain);
  const generate = withMeter("generate_section", useServerFn(generateSection));
  const fix = withMeter("fix_section", useServerFn(fixSectionError));

  const [openId, setOpenId] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: sectionsKey(projectId) });

  const generateMutation = useMutation({
    mutationFn: (sectionId: string) => generate({ data: { sectionId } }),
    onSuccess: (_r, sectionId) => {
      void invalidate();
      setOpenId(sectionId);
      toast.success("Section generated and reviewed.");
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Generation failed."),
  });

  // Bumped per section when a fix succeeds, so the card can clear its input.
  const [fixTokens, setFixTokens] = useState<Record<string, number>>({});

  const fixMutation = useMutation({
    mutationFn: (vars: { sectionId: string; errorText: string }) => fix({ data: vars }),
    onSuccess: (_r, vars) => {
      void invalidate();
      setOpenId(vars.sectionId);
      setFixTokens((prev) => ({ ...prev, [vars.sectionId]: (prev[vars.sectionId] ?? 0) + 1 }));
      toast.success("Fixed — see the fix report in this step.");
    },

    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Couldn't fix the code."),
  });

  const confirmMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase
        .from("build_sections")
        .update({ status: "confirmed" })
        .eq("id", sectionId);
      if (error) throw new Error("Couldn't confirm the section.");
    },
    onSuccess: () => void invalidate(),
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Couldn't confirm the section."),
  });

  const completed = sections.filter((s) => s.status === "confirmed").length;
  const percent = sections.length ? Math.round((completed / sections.length) * 100) : 0;

  // For document domains: which step first asks for each office file, so we
  // say "create" once and "open the file you already made" afterwards.
  const fileOrigins = useMemo(() => {
    const map = new Map<string, number>();
    if (playbook.buildsCode) return map;
    sections.forEach((section, i) => {
      section.blocks.forEach((block) => {
        const spec = parseFileSpec(block.file || block.title, block.code ?? "");
        const key = spec.fileName.toLowerCase();
        if (!map.has(key)) map.set(key, i);
      });
    });
    return map;
  }, [sections, playbook.buildsCode]);

  

  if (isPending) {
    return (
      <div className="panel flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading implementation plan…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={playbook.headline}
        description={playbook.subhead}
      />

      <div className="panel space-y-2 p-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          {completed} of {sections.length} {playbook.buildsCode ? "steps" : "deliverables"} completed
        </p>
      </div>

      {meta?.pm ? (
        <div className="panel p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project profile</p>
          <p className="mt-1 text-base font-semibold text-foreground">{meta.name}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Industry", value: meta.pm.industry },
              { label: "Methodology", value: meta.pm.methodology },
              { label: "Duration", value: meta.pm.duration },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{item.value ?? "—"}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {playbook.gettingStarted ? <GettingStarted guide={playbook.gettingStarted} /> : null}

      {sections.map((section, index) => {
        const locked = false;
        return (
          <SectionCard
            key={section.id}
            section={section}
            playbook={playbook}
            index={index}
            locked={locked}
            open={openId === section.id}
            onToggle={() => setOpenId((v) => (v === section.id ? null : section.id))}
            generating={generateMutation.isPending && generateMutation.variables === section.id}
            fixing={fixMutation.isPending && fixMutation.variables?.sectionId === section.id}
            onGenerate={() => generateMutation.mutate(section.id)}
            onFix={(errorText) => fixMutation.mutate({ sectionId: section.id, errorText })}
            fixToken={fixTokens[section.id] ?? 0}
            fileOrigins={fileOrigins}
            onConfirm={() => confirmMutation.mutate(section.id)}
          />
        );
      })}

      {sections.length === 0 ? (
        <div className="panel p-6 text-sm text-muted-foreground">
          This project has no generated implementation plan yet.
        </div>
      ) : null}
    </div>
  );
}

function GettingStarted({
  guide,
}: {
  guide: NonNullable<DomainPlaybook["gettingStarted"]>;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="flex items-center gap-2 font-display text-base">
          <FileText className="h-4 w-4 text-primary" /> {guide.title}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open ? (
        <div className="space-y-5 border-t border-border bg-muted/20 p-5">
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{guide.intro}</p>

          <div className="grid gap-3 sm:grid-cols-3">
            {guide.tools.map((tool) => {
              const app = toolApp(tool.label);
              const meta = metaOf(app);
              const Icon = meta.icon;
              return (
                <div
                  key={tool.label}
                  className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-panel"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      meta.tint,
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">{tool.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tool.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">How it works</p>
            <ol className="grid gap-2 sm:grid-cols-2">
              {guide.how.map((line, i) => (
                <li
                  key={line}
                  className="flex gap-3 rounded-lg border border-border/70 bg-card/60 p-3 text-sm text-muted-foreground"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ol>
          </div>

          {guide.note ? (
            <p className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-muted-foreground">
              {guide.note}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

const APP_META: Record<
  OfficeApp,
  { icon: typeof FileText; tint: string; short: string }
> = {
  word: {
    icon: FileType,
    tint: "bg-info/15 text-info",
    short: "Word",
  },
  excel: {
    icon: FileSpreadsheet,
    tint: "bg-success/15 text-success",
    short: "Excel",
  },
  powerpoint: {
    icon: Presentation,
    tint: "bg-warning/20 text-warning",
    short: "PowerPoint",
  },
};

const metaOf = (app: OfficeApp) => APP_META[app] ?? APP_META.word;

function toolApp(label: string): OfficeApp {
  const l = label.toLowerCase();
  if (l.includes("excel") || l.includes("sheet")) return "excel";
  if (l.includes("power") || l.includes("slide")) return "powerpoint";
  return "word";
}

/** Icon + accent for the four parts of a project brief. */
function briefTone(title: string) {
  const t = title.toLowerCase();
  if (/problem|challenge|pain/.test(t))
    return { icon: HelpCircle, ring: "border-warning/40", tint: "bg-warning/10", text: "text-warning" };
  if (/solution|approach|idea/.test(t))
    return { icon: Lightbulb, ring: "border-primary/40", tint: "bg-primary/10", text: "text-primary" };
  if (/tech|stack|tool|method/.test(t))
    return { icon: SlidersHorizontal, ring: "border-accent/40", tint: "bg-accent/10", text: "text-accent" };
  if (/objective|goal|outcome|scope/.test(t))
    return { icon: ListChecks, ring: "border-success/40", tint: "bg-success/10", text: "text-success" };
  return { icon: MapPin, ring: "border-border", tint: "bg-muted", text: "text-muted-foreground" };
}

/** The project brief (problem, solution, tools, objectives) as readable cards. */
function OverviewBrief({ blocks }: { blocks: Block[] }) {
  if (!blocks.length) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {blocks.map((block, i) => {
        const tone = briefTone(block.title);
        const Icon = tone.icon;
        const body = (block.code ?? "").trim();
        const bullets = block.explanation ?? [];
        return (
          <div
            key={`${block.title}-${i}`}
            className={cn(
              "space-y-3 rounded-xl border bg-card p-5 shadow-sm",
              tone.ring,
              blocks.length % 2 === 1 && i === blocks.length - 1 ? "md:col-span-2" : "",
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tone.tint)}>
                <Icon className={cn("h-4 w-4", tone.text)} />
              </span>
              <p className="font-display text-base font-semibold tracking-tight">{block.title}</p>
            </div>

            {body ? (
              <div className="space-y-2 text-[15px] leading-7 text-foreground/90">
                {body.split(/\n{2,}/).map((para, p) => (
                  <p key={`p-${p}`}>{para.replace(/\*\*/g, "").trim()}</p>
                ))}
              </div>
            ) : null}

            {bullets.length ? (
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                {bullets.map((line, li) => (
                  <li key={`b-${li}-${line.slice(0, 10)}`}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Notion-style explanation page shown under the code.
 *
 * One calm reading surface instead of three competing cards: a short
 * "what this does", the reasoning, and a small table of the choices made.
 */
function BlockExplanation({ block, hasCode }: { block: Block; hasCode: boolean }) {
  const what = block.explanation ?? [];
  const why = block.why ?? [];
  const params = (block.parameters ?? []).filter((p) => p?.name || p?.value || p?.why);
  if (what.length === 0 && why.length === 0 && params.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-5 sm:px-7 sm:py-6">
      <article className="mx-auto max-w-[46rem] space-y-5 text-[15px] leading-7 text-foreground">
        {what.length ? (
          <section className="space-y-2">
            <h4 className="font-display text-base font-semibold tracking-tight">
              {hasCode ? "What this code does" : "What this covers"}
            </h4>
            <ul className="list-disc space-y-1.5 pl-5 text-foreground/90 marker:text-muted-foreground">
              {what.map((line, li) => (
                <li key={`w-${li}-${line.slice(0, 10)}`}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {why.length ? (
          <section className="space-y-2">
            <h4 className="font-display text-base font-semibold tracking-tight">Why we do it this way</h4>
            <ul className="list-disc space-y-1.5 pl-5 text-foreground/90 marker:text-muted-foreground">
              {why.map((line, li) => (
                <li key={`y-${li}-${line.slice(0, 10)}`}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {params.length ? (
          <section className="space-y-2">
            <h4 className="font-display text-base font-semibold tracking-tight">The choices made</h4>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {params.map((p, pi) => (
                    <tr key={`p-${pi}-${p.name ?? ""}`} className="odd:bg-muted/25">
                      <td className="w-40 border-b border-border/60 px-3 py-2 align-top font-medium">
                        {p.name}
                      </td>
                      <td className="w-32 border-b border-border/60 px-3 py-2 align-top">
                        {p.value ? (
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                            {p.value}
                          </code>
                        ) : null}
                      </td>
                      <td className="border-b border-border/60 px-3 py-2 align-top text-muted-foreground">
                        {p.why}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </article>
    </div>
  );
}


/**
 * Notebook steps: hand the student a real .ipynb with this step's cells inside,
 * so the notebooks in the project structure actually get used.
 */
function NotebookActions({
  notebooks,
  language,
}: {
  notebooks: { path: string; cells: NotebookCell[] }[];
  language: string;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-info/30 bg-info/5 p-5">
      <div>
        <p className="flex items-center gap-2 font-display text-base">
          <NotebookPen className="h-4 w-4 text-info" /> Work in your notebook
        </p>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          The code below belongs in a Jupyter notebook — one cell per part. Download it
          ready to run, then open it in Jupyter, VS Code or Colab and run the cells in order.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {notebooks.map((nb) => (
          <Button
            key={nb.path}
            size="lg"
            className="gap-2"
            onClick={() => {
              downloadNotebook(notebookName(nb.path), nb.cells, language || "python");
              toast.success(`${notebookName(nb.path)} downloaded — open it and run the cells.`);
            }}
          >
            <Download className="h-5 w-5" />
            Download {notebookName(nb.path)} ({nb.cells.length}{" "}
            {nb.cells.length === 1 ? "cell" : "cells"})
          </Button>
        ))}
      </div>
    </div>
  );
}

const appOf = (kind: FileSpec["kind"]): OfficeApp => kind;

/** "Files you need for this step" — with a real empty file to download. */
function StepFiles({
  specs,
  isNew,
}: {
  specs: FileSpec[];
  isNew: (spec: FileSpec) => boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const download = async (spec: FileSpec) => {
    setBusy(spec.fileName);
    try {
      await downloadEmptyOfficeFile(spec);
      toast.success(`${spec.fileName} downloaded — it's empty and ready to fill.`);
    } catch {
      toast.error("Couldn't create that file.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">Files you need for this step</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        No terminal, no coding. Download the blank file once, then paste each part
        into the place named below.
      </p>
      <ul className="mt-3 space-y-2">
        {specs.map((spec) => {
          const meta = metaOf(appOf(spec.kind));
          const Icon = meta.icon;
          const fresh = isNew(spec);
          return (
            <li
              key={spec.fileName}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2"
            >
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-md", meta.tint)}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{spec.fileName}</span>
                <span className="block text-xs text-muted-foreground">
                  {fresh
                    ? `Create this ${meta.short} file once — you'll keep adding to it`
                    : `You already created this earlier — just open it and add to it`}
                </span>
              </span>
              {fresh ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void download(spec)}
                  disabled={busy === spec.fileName}
                >
                  {busy === spec.fileName ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download empty file
                </Button>
              ) : (
                <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                  Already created
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Per-part instruction: exactly where this text goes. */
function DocFileBar({ spec, isNew }: { spec: FileSpec; isNew: boolean }) {
  const meta = metaOf(appOf(spec.kind));
  const Icon = meta.icon;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-card px-3 py-2 text-xs">
      <span className={cn("flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold", meta.tint)}>
        <Icon className="h-3.5 w-3.5" /> {meta.short}
      </span>
      <span className="text-muted-foreground">{isNew ? "Open your new file" : "Open"}</span>
      <span className="rounded-md bg-muted px-2 py-1 font-medium text-foreground">
        {spec.fileName}
      </span>
      <span className="text-muted-foreground">
        {spec.part ? `→ paste into the ${spec.partLabel} “${spec.part}”` : "→ paste this at the end"}
      </span>
    </div>
  );
}

/**
 * Spreadsheet steps: no manual typing. We show the exact rows and hand the
 * student an .xlsx that already contains them.
 */
function SpreadsheetActions({ spec, content }: { spec: FileSpec; content: string }) {
  const tables = useMemo(() => parseMarkdownTables(content), [content]);
  const [busy, setBusy] = useState(false);
  if (!tables.length) return null;

  const rows = tables.reduce((n, t) => n + t.rows.length, 0);
  const download = async () => {
    setBusy(true);
    try {
      await downloadFilledSpreadsheet(spec, tables);
      toast.success(`${spec.baseName}.xlsx downloaded with the data already filled in`);
    } catch {
      toast.error("Could not build the spreadsheet");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2">
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">No typing needed.</span> The table
        below is ready — download it as a spreadsheet with all {rows} row{rows === 1 ? "" : "s"}{" "}
        already filled in.
      </p>
      <Button size="sm" variant="outline" onClick={download} disabled={busy} className="gap-1.5">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Download filled spreadsheet
      </Button>
    </div>
  );
}

/** "Where does this go?" bar for coding projects — file path + what to do. */

function CodeFileBar({ file, action }: { file: string; action?: string | undefined }) {
  const isTerminal = /^(terminal|shell|bash|cmd|powershell)$/i.test(file.trim());
  const verb = isTerminal
    ? "Run these commands in your terminal"
    : action === "modify"
      ? "Open this existing file and update it"
      : action === "run"
        ? "Run this file"
        : "Create this file (if it doesn't exist yet) and paste the code in";
  const Icon = isTerminal ? Terminal : FileCode2;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-card px-3 py-2 text-xs">
      <span className="flex items-center gap-1.5 rounded-md bg-info/15 px-2 py-1 font-semibold text-info">
        <Icon className="h-3.5 w-3.5" /> {isTerminal ? "Terminal" : "File"}
      </span>
      <span className="text-muted-foreground">{verb}</span>
      {isTerminal ? null : (
        <span className="rounded-md bg-muted px-2 py-1 font-mono font-medium text-foreground">
          {file}
        </span>
      )}
    </div>
  );
}






function SectionCard({
  section,
  playbook,
  index,
  locked,
  open,
  onToggle,
  generating,
  fixing,
  fixToken,
  onGenerate,
  onFix,
  onConfirm,
  fileOrigins,
}: {
  section: BuildSection;
  playbook: DomainPlaybook;
  index: number;
  fileOrigins: Map<string, number>;
  locked: boolean;
  open: boolean;
  onToggle: () => void;
  generating: boolean;
  fixing: boolean;
  fixToken: number;
  onGenerate: () => void;
  onFix: (errorText: string) => void;
  onConfirm: () => void;
}) {
  const [showFix, setShowFix] = useState(false);
  const [errorText, setErrorText] = useState("");

  // A successful fix wipes the box so the next error starts from a clean slate.
  useEffect(() => {
    if (fixToken > 0) {
      setErrorText("");
      setShowFix(false);
    }
  }, [fixToken]);
  const [zipping, setZipping] = useState(false);
  const confirmed = section.status === "confirmed";
  const isOverview =
    section.kind === "overview" ||
    (section.position === 0 && /problem\s*statement/i.test(section.title));
  const generated = Boolean(section.code) || section.blocks.length > 0;

  const blocks: Block[] =
    section.blocks.length > 0
      ? section.blocks
      : section.code
        ? [{ title: "Code", code: section.code, explanation: section.explanation }]
        : [];

  // Which office files this step touches (de-duplicated) and whether the
  // student has to create them here or already has them from an earlier step.
  const specIsNew = (spec: FileSpec) =>
    (fileOrigins.get(spec.fileName.toLowerCase()) ?? index) >= index;

  const stepSpecs: FileSpec[] = playbook.buildsCode
    ? []
    : Array.from(
        blocks
          .filter((b) => b.code?.trim())
          .reduce((map, b) => {
            const spec = parseFileSpec(b.file || b.title, b.code ?? "");
            if (!map.has(spec.fileName.toLowerCase())) map.set(spec.fileName.toLowerCase(), spec);
            return map;
          }, new Map<string, FileSpec>())
          .values(),
      );

  // Data projects work inside notebooks: group this step's cells per notebook
  // so the student can download a ready-to-run .ipynb instead of copying cells.
  const notebooks = playbook.buildsCode
    ? Array.from(
        blocks
          .filter((b) => isNotebookFile(b.file) && b.code?.trim())
          .reduce((map, b) => {
            const path = notebookPath(b.file ?? "");
            const list = map.get(path) ?? [];
            list.push({ title: b.title, code: b.code });
            map.set(path, list);
            return map;
          }, new Map<string, NotebookCell[]>())
          .entries(),
      ).map(([path, cells]) => ({ path, cells }))
    : [];


  const downloadZip = async () => {
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const files = section.files.filter((f) => f.path && !f.path.endsWith("/"));
      if (files.length === 0) {
        zip.file("project-structure.txt", section.structure ?? "");
      } else {
        for (const file of files) {
          const path = file.path.replace(/^\.?\//, "");
          // Files ship empty on purpose; a notebook still needs valid JSON so
          // Jupyter can open it.
          zip.file(
            path,
            isNotebookFile(path)
              ? JSON.stringify(buildNotebook([]), null, 1)
              : (file.content ?? ""),
          );
        }
        if (section.structure) zip.file("PROJECT_STRUCTURE.txt", section.structure);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "project-structure.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't build the zip file.");
    } finally {
      setZipping(false);
    }
  };

  return (
    <section
      className={cn(
        "panel overflow-hidden transition-colors",
        confirmed ? "border-success/40" : locked ? "opacity-70" : "",
      )}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-start gap-3 text-left"
          aria-expanded={open}
        >
          <span
            className={cn(
              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              confirmed
                ? "bg-success text-success-foreground"
                : locked
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground",
            )}
          >
            {confirmed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
          </span>
          <span className="space-y-1">
            <span className="flex items-center gap-2 font-display text-base">
              {section.title}
              {locked ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : null}
            </span>
            {section.objective ? (
              <span className="block text-sm text-muted-foreground">{section.objective}</span>
            ) : null}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {!locked && !generated ? (
            <Button size="sm" onClick={onGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Generating…" : "Generate"}
            </Button>
          ) : null}
          <Button size="icon" variant="ghost" onClick={onToggle} aria-label={open ? "Close section" : "Open section"}>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="space-y-5 border-t border-border bg-muted/20 p-5">
          {section.question ? (
            <p className="rounded-lg bg-primary/5 p-3 text-sm text-primary">{section.question}</p>
          ) : null}

          {!generated ? (
            <p className="text-sm text-muted-foreground">
              Nothing generated yet. Press Generate when you're ready to work on this step.
            </p>
          ) : null}

          {section.structure && playbook.buildsCode ? (
            <div className="space-y-3 rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-display text-base">
                    <FolderTree className="h-4 w-4 text-primary" /> Project structure
                  </p>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                    Only the files this project actually needs. Every file comes down
                    empty — you fill them in as you work through the steps below.
                  </p>
                </div>
                <Button size="lg" onClick={downloadZip} disabled={zipping} className="gap-2">
                  {zipping ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                  {zipping ? "Preparing…" : "Download project folder (.zip)"}
                </Button>
              </div>
              <CodeBlock code={section.structure} filename="project structure" />
            </div>
          ) : null}

          {!playbook.buildsCode && stepSpecs.length ? (
            <StepFiles specs={stepSpecs} isNew={specIsNew} />
          ) : null}

          {notebooks.length ? <NotebookActions notebooks={notebooks} language={section.language} /> : null}

          {isOverview && generated ? <OverviewBrief blocks={blocks} /> : null}

          {isOverview ? null : blocks.map((block, i) => {

            const hasCode = Boolean(block.code?.trim());
            const partLabel = playbook.buildsCode ? "Part" : "Step";
            const blockFile = block.file?.trim();
            const spec = playbook.buildsCode
              ? null
              : parseFileSpec(blockFile || block.title, block.code ?? "");
            return (
              <div
                key={`${block.title}-${i}`}
                className="overflow-hidden rounded-xl border border-border bg-card/60"
              >
                <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <p className="min-w-0 flex-1 font-display text-[15px]">
                    {hasCode ? `${partLabel} ${i + 1} — ${block.title}` : block.title}
                  </p>
                </div>

                <div className="space-y-4 p-5">
                  {playbook.buildsCode
                    ? blockFile && hasCode
                      ? <CodeFileBar file={blockFile} action={block.action} />
                      : null
                    : spec && hasCode
                      ? (
                        <>
                          <DocFileBar spec={spec} isNew={specIsNew(spec)} />
                          {spec.kind === "excel" ? (
                            <SpreadsheetActions spec={spec} content={block.code ?? ""} />
                          ) : null}
                        </>
                      )
                      : null}
                  {hasCode ? (
                    playbook.buildsCode ? (
                      <CodeBlock
                        code={block.code}
                        language={section.language}
                        filename={blockFile}
                      />
                    ) : (
                      <DocSheet
                        content={block.code}
                        label={
                          spec
                            ? spec.part
                              ? `${spec.fileName} · ${spec.partLabel}: ${spec.part}`
                              : spec.fileName
                            : undefined
                        }
                      />
                    )
                  ) : null}


                  <BlockExplanation block={block} hasCode={hasCode} />
                </div>
              </div>
            );
          })}




          {section.walkthrough &&
          (section.walkthrough.completed?.length ||
            section.walkthrough.whats_next?.length ||
            section.walkthrough.analogy) ? (
            <div className="space-y-3 rounded-xl border border-accent/30 bg-accent/5 p-5">
              <p className="font-display text-base">Step recap, in simple words</p>

              <div className="grid gap-3 sm:grid-cols-2">
                {section.walkthrough.completed?.length ? (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      What you finished
                    </p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                      {section.walkthrough.completed.map((line, i) => (
                        <li key={`done-${i}-${line.slice(0, 10)}`}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {section.walkthrough.whats_next?.length ? (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-accent" />
                      What&apos;s next
                    </p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                      {section.walkthrough.whats_next.map((line, i) => (
                        <li key={`next-${i}-${line.slice(0, 10)}`}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              {section.walkthrough.analogy ? (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <p>
                    <span className="font-medium">Think of it like: </span>
                    <span className="text-muted-foreground">{section.walkthrough.analogy}</span>
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}





          {fixRounds(section.fix_notes).map((round, ri) => (
            <FixRoundCard
              key={`round-${round.at ?? ri}`}
              round={round}
              index={ri}
              language={round.language || section.language}
              partLabel={playbook.buildsCode ? "Part" : "Deliverable"}
              buildsCode={playbook.buildsCode}
            />
          ))}


          {generated && !isOverview ? (
            <div
              className={cn(
                "overflow-hidden rounded-xl border transition-colors",
                showFix ? "border-warning/50 bg-warning/5" : "border-border bg-card",
              )}
            >
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
                onClick={() => setShowFix((v) => !v)}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/15">
                  <Wrench className="h-4 w-4 text-warning" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {playbook.buildsCode ? "Something not working?" : "Ask for a revision"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {playbook.buildsCode
                      ? "Paste the error and we'll fix this step and show you exactly what changed."
                      : "Tell us what's off and we'll rewrite this deliverable."}
                  </span>
                </span>
                {showFix ? (
                  <ChevronUp className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {showFix ? (
                <div className="space-y-3 border-t border-warning/30 p-4">
                  <Textarea
                    rows={5}
                    value={errorText}
                    onChange={(e) => setErrorText(e.target.value)}
                    disabled={fixing}
                    className="resize-y bg-card font-mono text-[12.5px]"
                    placeholder={
                      playbook.buildsCode
                        ? "Paste the full error message here, e.g.\nTraceback (most recent call last):\n  File \"app.py\", line 12, in <module>\nNameError: name 'data' is not defined"
                        : "Tell us what's wrong or unrealistic in this deliverable…"
                    }
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      disabled={fixing || errorText.trim().length < 3}
                      onClick={() => onFix(errorText)}
                    >
                      {fixing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wrench className="h-4 w-4" />
                      )}
                      {fixing
                        ? "Fixing…"
                        : playbook.buildsCode
                          ? "Fix my code"
                          : "Revise this deliverable"}
                    </Button>
                    {errorText.trim().length && !fixing ? (
                      <Button size="sm" variant="ghost" onClick={() => setErrorText("")}>
                        Clear
                      </Button>
                    ) : null}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {fixing
                        ? "Reading your error and rewriting this step…"
                        : errorText.trim().length < 3
                          ? "Paste the whole message — more detail means a better fix."
                          : `${errorText.trim().length} characters`}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {generated && !confirmed ? (
            <Button className="w-full" onClick={onConfirm}>
              <CheckCircle2 className="h-4 w-4" /> Confirm &amp; continue to next step
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** Older sections stored a single fix object; newer ones store a list of rounds. */
function fixRounds(notes: FixNotes | null): FixRound[] {
  if (!notes) return [];
  if (Array.isArray(notes.rounds)) return notes.rounds;
  if (notes.diagnosis || notes.error_explained || (notes.changes?.length ?? 0) > 0) {
    return [notes];
  }
  return [];
}

function FixRoundCard({
  round,
  index,
  language,
  partLabel,
  buildsCode,
}: {
  round: FixRound;
  index: number;
  language: string;
  partLabel: string;
  buildsCode: boolean;
}) {
  const changes = round.changes ?? [];
  const fixedBlocks = round.fixed_blocks ?? [];
  const touchedFiles = Array.from(
    new Set(changes.map((c) => (c.file ?? "").trim()).filter(Boolean)),
  );
  const addedCount = changes.reduce((n, c) => n + (c.added?.length ?? 0), 0);
  const removedCount = changes.reduce((n, c) => n + (c.removed?.length ?? 0), 0);

  return (
    <div className="overflow-hidden rounded-xl border border-info/40 bg-gradient-to-b from-info/10 to-transparent">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-info/25 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/15">
            <Wrench className="h-4 w-4 text-info" />
          </span>
          Fix #{round.round ?? index + 1}
          {fixedBlocks.length ? (
            <span className="text-xs font-normal text-muted-foreground">
              — {fixedBlocks.length} {fixedBlocks.length === 1 ? "part" : "parts"} rewritten
            </span>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-muted-foreground">
            {changes.length} {changes.length === 1 ? "change" : "changes"}
          </span>
          {addedCount ? (
            <span className="rounded-full border border-success/40 bg-success/10 px-2.5 py-0.5 font-mono text-success">
              +{addedCount}
            </span>
          ) : null}
          {removedCount ? (
            <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 font-mono text-destructive">
              −{removedCount}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 p-4">
        {round.error_explained || round.reported ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" /> The problem
            </p>
            {round.reported ? (
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-card/70 p-2 font-mono text-[11.5px] text-muted-foreground">
                {round.reported}
              </pre>
            ) : null}
            {round.error_explained ? (
              <p className="mt-2 text-sm leading-relaxed">{round.error_explained}</p>
            ) : null}
          </div>
        ) : null}

        {round.diagnosis ? (
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Why it happened
            </p>
            <p className="mt-1 text-sm leading-relaxed">{round.diagnosis}</p>
          </div>
        ) : null}

        {touchedFiles.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Files updated:</span>
            {touchedFiles.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-0.5 font-mono text-xs"
              >
                <FileCode2 className="h-3.5 w-3.5 text-info" />
                {f}
              </span>
            ))}
          </div>
        ) : null}

        {fixedBlocks.length ? (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {buildsCode ? "Fixed code" : "Corrected content"} — use this instead of the parts
              above (the original stays untouched)
            </p>
            {fixedBlocks.map((block, bi) => (
              <div key={`fixed-${bi}-${block.title ?? ""}`} className="space-y-2">
                <p className="text-sm font-semibold">
                  {partLabel} {block.part_number ?? bi + 1} fixed
                  {block.title ? ` — ${block.title}` : ""}
                </p>
                {buildsCode && block.file ? (
                  <CodeFileBar file={block.file} action={block.action ?? "modify"} />
                ) : null}
                {block.code?.trim() ? (
                  buildsCode ? (
                    <CodeBlock
                      code={block.code}
                      language={language}
                      filename={block.file}
                    />
                  ) : (
                    <DocSheet content={block.code} label={block.file ?? undefined} />
                  )
                ) : null}
                {block.explanation?.length ? (
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      What changed here
                    </p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {block.explanation.map((line, li) => (
                        <li key={`fx-${li}-${line.slice(0, 10)}`}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {changes.length ? (
          <ul className="space-y-2.5">
            {changes.map((change, i) => {
              const removed = (change.removed ?? []).filter((l) => l.trim().length);
              const added = (change.added ?? []).filter((l) => l.trim().length);
              return (
                <li
                  key={`${i}-${change.part}`}
                  className="overflow-hidden rounded-lg border border-border bg-card text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/50 px-3 py-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-info/15 font-mono text-[11px] text-info">
                      {i + 1}
                    </span>
                    {change.file ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-info">
                        <FileCode2 className="h-3.5 w-3.5" />
                        {change.file}
                      </span>
                    ) : null}
                    {change.part ? (
                      <span className="text-xs font-medium text-muted-foreground">
                        {change.part}
                      </span>
                    ) : null}
                    <span className="ml-auto flex items-center gap-1 font-mono text-[11px]">
                      {added.length ? <span className="text-success">+{added.length}</span> : null}
                      {removed.length ? (
                        <span className="text-destructive">−{removed.length}</span>
                      ) : null}
                    </span>
                  </div>

                  <div className="p-3">
                    <p className="text-muted-foreground">{change.what_changed}</p>
                    {change.why ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Why:</span> {change.why}
                      </p>
                    ) : null}

                    {removed.length || added.length ? (
                      <div className="mt-2.5 overflow-hidden rounded-md border border-border font-mono text-[12px] leading-relaxed">
                        {removed.map((line, li) => (
                          <div
                            key={`r-${li}`}
                            className="flex gap-2 bg-destructive/10 px-2 py-0.5 text-destructive"
                          >
                            <span className="select-none opacity-70">−</span>
                            <span className="whitespace-pre-wrap break-all">{line}</span>
                          </div>
                        ))}
                        {added.map((line, li) => (
                          <div
                            key={`a-${li}`}
                            className="flex gap-2 bg-success/10 px-2 py-0.5 text-success"
                          >
                            <span className="select-none opacity-70">+</span>
                            <span className="whitespace-pre-wrap break-all">{line}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
