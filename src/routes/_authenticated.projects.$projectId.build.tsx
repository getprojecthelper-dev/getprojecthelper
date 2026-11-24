import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  Download,
  Expand,
  ExternalLink,
  Code2,
  FileCode2,
  FileSpreadsheet,
  FileText,
  FileType,
  Loader2,
  Lightbulb,
  ListChecks,
  HelpCircle,
  SlidersHorizontal,
  Lock,
  MapPin,
  NotebookPen,
  Presentation,
  RefreshCw,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { withMeter } from "@/components/credit-meter";
import { CodeBlock } from "@/components/code-block";
import { LiveCodeEditor, workspaceKey } from "@/components/live-code-editor";
import { ProjectFolderSetup } from "@/components/project-folder-setup";
import { isTerminalBlock, workspaceFilePath } from "@/lib/project-workspace";
import { NotebookCell as NotebookCellView } from "@/components/notebook-cell";
import { DocSheet } from "@/components/doc-sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { fixSectionError, generateSection } from "@/lib/builder.functions";
import { asDataset, datasetFacts } from "@/lib/dataset";
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
  notebookCellIndex,
  notebookName,
  notebookPath,
  type NotebookCell,
} from "@/lib/notebook";
import { useProjectId } from "@/lib/use-workspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projects/$projectId/build")({
  head: () => ({
    meta: [
      { title: "Implementation builder — Project Helper" },
      {
        name: "description",
        content: "Build your private project step by step with guided implementation.",
      },
      { property: "og:title", content: "Implementation builder — Project Helper" },
      {
        property: "og:description",
        content: "Build your private project step by step with guided implementation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
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
  example?: string;
  analogy?: string;
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

// Code projects fill the rest of the screen: the editor column stays put while the
// roadmap scrolls inside its own column, so the editor never drifts.
function useFillRemainingHeight() {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    if (!node) return;
    const wide = window.matchMedia("(min-width: 768px)");
    const measure = () => {
      if (!wide.matches) {
        setHeight(null);
        return;
      }
      const top = node.getBoundingClientRect().top + window.scrollY;
      const below = document.documentElement.scrollHeight - (top + node.offsetHeight);
      setHeight(Math.max(320, Math.round(window.innerHeight - top - below)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    wide.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      wide.removeEventListener("change", measure);
    };
  }, [node]);
  return { ref: setNode, height };
}

function BuildPage() {
  const projectId = useProjectId();
  const qc = useQueryClient();
  const { ref: workspaceRef, height: workspaceHeight } = useFillRemainingHeight();
  const { data: sections = [], isPending } = useSections(projectId);

  const { data: meta } = useQuery({
    queryKey: ["project-domain", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("domain,name,pm_profile,dataset")
        .eq("id", projectId)
        .maybeSingle();
      return {
        domain: (data?.domain as string | null) ?? null,
        name: (data?.name as string | null) ?? null,
        pm:
          (data?.pm_profile as {
            industry?: string;
            methodology?: string;
            duration?: string;
          } | null) ?? null,
        dataset: asDataset((data as Record<string, unknown> | null)?.["dataset"]),
      };
    },
  });
  const domain = meta?.domain ?? null;
  const playbook = getPlaybook(domain);
  const generate = withMeter("generate_section", useServerFn(generateSection));
  const fix = withMeter("fix_section", useServerFn(fixSectionError));

  const [openId, setOpenId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ sectionId: string; path: string | null } | null>(null);

  const invalidate = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: sectionsKey(projectId) }),
      qc.invalidateQueries({ queryKey: workspaceKey(projectId) }),
    ]);

  const generateMutation = useMutation({
    mutationFn: (sectionId: string) => generate({ data: { sectionId } }),
    onMutate: (sectionId) => {
      setOpenId(sectionId);
      setEditor({ sectionId, path: null });
    },
    onSuccess: async (_r, sectionId) => {
      await invalidate();
      setOpenId(sectionId);
      setEditor({ sectionId, path: null });

      toast.success("Section generated and reviewed.");
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Generation failed."),
  });

  // The overview is the orientation page for a new project. Generate it once
  // automatically so students start with the problem, solution and tools in view.
  const autoOverviewRef = useRef<string | null>(null);
  useEffect(() => {
    const overview = sections.find(
      (section) =>
        section.status === "pending" &&
        (section.kind === "overview" || /problem\s*statement/i.test(section.title)),
    );
    if (!overview || generateMutation.isPending || autoOverviewRef.current === overview.id) return;
    autoOverviewRef.current = overview.id;
    generateMutation.mutate(overview.id);
  }, [sections, generateMutation]);

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

  const editorSection =
    sections.find((s) => s.id === editor?.sectionId) ??
    sections.find((s) => s.kind === "structure" && s.status !== "pending") ??
    null;

  if (isPending) {
    return (
      <div className="panel flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading implementation plan…
      </div>
    );
  }

  const content = (
    <div className="build-roadmap__content min-w-0">
      <header className="build-roadmap__header">
        <p className="build-roadmap__eyebrow">Project roadmap</p>
        <div className="build-roadmap__title-row">
          <h1>{playbook.headline}</h1>
          <span className="build-roadmap__completion">
            {completed}/{sections.length}
          </span>
        </div>
        <p className="build-roadmap__subhead">{playbook.subhead}</p>
        <div
          className="build-roadmap__progress-track"
          role="progressbar"
          aria-label="Project progress"
          aria-valuemin={0}
          aria-valuemax={sections.length}
          aria-valuenow={completed}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
        <div className="build-roadmap__progress-meta">
          <span>
            {completed} of {sections.length} {playbook.buildsCode ? "steps" : "deliverables"}{" "}
            complete
          </span>
          <span>{percent}%</span>
        </div>
      </header>

      {meta?.dataset ? (
        <section className="build-roadmap__dataset">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Database className="h-4 w-4 text-primary" />
              Dataset
            </div>
            <p className="mt-1.5 font-display text-lg">{meta.dataset.name}</p>
            {datasetFacts(meta.dataset) ? (
              <p className="mt-1 text-sm text-muted-foreground">{datasetFacts(meta.dataset)}</p>
            ) : null}
          </div>
          {meta.dataset.url ? (
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <a href={meta.dataset.url} target="_blank" rel="noreferrer">
                View dataset <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </section>
      ) : null}

      {meta?.pm ? (
        <section className="build-roadmap__profile">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Project profile
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">{meta.name}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Industry", value: meta.pm.industry },
              { label: "Methodology", value: meta.pm.methodology },
              { label: "Duration", value: meta.pm.duration },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{item.value ?? "—"}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {playbook.gettingStarted ? (
        <div className="build-roadmap__getting-started">
          <GettingStarted guide={playbook.gettingStarted} />
        </div>
      ) : null}

      <div className="build-roadmap__steps">
        {sections.map((section, index) => {
          const locked = false;
          return (
            <SectionCard
              key={section.id}
              section={section}
              playbook={playbook}
              projectName={meta?.name ?? "Project"}
              index={index}
              totalSteps={sections.length}
              locked={locked}
              open={openId === section.id}
              onToggle={() => {
                setOpenId((v) => (v === section.id ? null : section.id));
                if (openId !== section.id) setEditor({ sectionId: section.id, path: null });
              }}
              generating={generateMutation.isPending && generateMutation.variables === section.id}
              fixing={fixMutation.isPending && fixMutation.variables?.sectionId === section.id}
              onGenerate={() => generateMutation.mutate(section.id)}
              onFix={(errorText) => fixMutation.mutate({ sectionId: section.id, errorText })}
              fixToken={fixTokens[section.id] ?? 0}
              fileOrigins={fileOrigins}
              onConfirm={() => confirmMutation.mutate(section.id)}
              sections={sections}
              onProceedToNext={async (fromIndex) => {
                const currentSection = sections[fromIndex];
                const nextSection = sections[fromIndex + 1];
                if (currentSection && currentSection.status !== "confirmed") {
                  await confirmMutation.mutateAsync(currentSection.id);
                }
                if (nextSection) {
                  setOpenId(nextSection.id);
                  setEditor({ sectionId: nextSection.id, path: null });
                }
              }}
              onGenerateSection={(stepIndex) => {
                const targetSection = sections[stepIndex];
                return targetSection
                  ? generateMutation.mutateAsync(targetSection.id)
                  : Promise.resolve();
              }}
              onOpenEditor={(stepIndex, file) => {
                const targetSection = sections[stepIndex];
                if (!targetSection) return;
                setOpenId(targetSection.id);
                setEditor({
                  sectionId: targetSection.id,
                  path: file ? workspaceFilePath(file, sections) : null,
                });
              }}
              onOpenFile={
                playbook.buildsCode
                  ? (file) =>
                      setEditor({ sectionId: section.id, path: workspaceFilePath(file, sections) })
                  : undefined
              }
            />
          );
        })}
      </div>

      {sections.length === 0 ? (
        <div className="build-roadmap__empty text-sm text-muted-foreground">
          This project has no generated implementation plan yet.
        </div>
      ) : null}
    </div>
  );

  if (!playbook.buildsCode) return content;

  // code projects: roadmap on the left, live editor on the right
  return (
    <div
      ref={workspaceRef}
      className="build-screen workspace-home-surface grid min-w-0 gap-5 md:grid-cols-[minmax(20rem,0.72fr)_minmax(0,1.28fr)]"
      style={workspaceHeight ? { height: workspaceHeight } : undefined}
    >
      <div className="build-roadmap min-w-0 md:h-full md:min-h-0 md:overflow-y-auto md:pr-2">
        {content}
      </div>
      <aside className="build-editor-column min-w-0 h-[38rem] md:h-full md:min-h-0">
        <LiveCodeEditor
          key={projectId}
          projectId={projectId}
          projectName={meta?.name ?? "Project"}
          activeFile={editor}
          generating={generateMutation.isPending}
          terminal={
            editorSection?.structure
              ? ""
              : (editorSection?.blocks ?? [])
                  .filter(isTerminalBlock)
                  .map((b) => b.code)
                  .join("\n\n")
          }
        />
      </aside>
    </div>
  );
}

function GettingStarted({ guide }: { guide: NonNullable<DomainPlaybook["gettingStarted"]> }) {
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
                    className={cn("flex h-9 w-9 items-center justify-center rounded-lg", meta.tint)}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">{tool.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {tool.detail}
                  </p>
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

const APP_META: Record<OfficeApp, { icon: typeof FileText; tint: string; short: string }> = {
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
    return {
      icon: HelpCircle,
      ring: "border-warning/40",
      tint: "bg-warning/10",
      text: "text-warning",
    };
  if (/solution|approach|idea/.test(t))
    return {
      icon: Lightbulb,
      ring: "border-primary/40",
      tint: "bg-primary/10",
      text: "text-primary",
    };
  if (/tech|stack|tool|method/.test(t))
    return {
      icon: SlidersHorizontal,
      ring: "border-accent/40",
      tint: "bg-accent/10",
      text: "text-accent",
    };
  if (/objective|goal|outcome|scope/.test(t))
    return {
      icon: ListChecks,
      ring: "border-success/40",
      tint: "bg-success/10",
      text: "text-success",
    };
  return { icon: MapPin, ring: "border-border", tint: "bg-muted", text: "text-muted-foreground" };
}

/** The project brief (problem, solution, tools, objectives) as readable cards. */
function OverviewBrief({
  blocks,
  onViewFullScreen,
  stepNumber,
  totalSteps,
  hideFullScreenButton = false,
  showAllDetails = false,
}: {
  blocks: Block[];
  onViewFullScreen: () => void;
  stepNumber: number;
  totalSteps: number;
  hideFullScreenButton?: boolean;
  showAllDetails?: boolean;
}) {
  if (!blocks.length) return null;
  return (
    <div className="overview-brief grid gap-4">
      {blocks.map((block, i) => {
        return (
          <OverviewBriefCard
            key={`${block.title}-${i}`}
            block={block}
            onViewFullScreen={onViewFullScreen}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
            hideFullScreenButton={hideFullScreenButton}
            showAllDetails={showAllDetails}
          />
        );
      })}
    </div>
  );
}

function OverviewBriefCard({
  block,
  onViewFullScreen,
  stepNumber,
  totalSteps,
  hideFullScreenButton = false,
  showAllDetails = false,
}: {
  block: Block;
  onViewFullScreen: () => void;
  stepNumber: number;
  totalSteps: number;
  hideFullScreenButton?: boolean;
  showAllDetails?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const tone = briefTone(block.title);
  const Icon = tone.icon;
  const body = (block.code ?? "").trim();
  const bullets = (block.explanation ?? []).flatMap((line) =>
    line
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map((sentence) => sentence.trim())
      .filter(Boolean),
  );
  const hasExtraDetails = bullets.length > 3 || body.length > 260;
  const visibleBullets = showAllDetails || expanded ? bullets : bullets.slice(0, 3);
  const sectionLabel = /problem/i.test(block.title)
    ? "The challenge"
    : /solution|approach/i.test(block.title)
      ? "How it works"
      : /objective|criteria/i.test(block.title)
        ? "What success looks like"
        : "What you will use";

  return (
    <article
      className={cn(
        "overview-brief__card space-y-3 rounded-xl border bg-card p-4 shadow-sm",
        tone.ring,
      )}
    >
      {!hideFullScreenButton && /problem/i.test(block.title) ? (
        <div className="overview-brief__toolbar">
          <span>
            Step {stepNumber} of {totalSteps}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={onViewFullScreen}>
            <Expand className="h-4 w-4" /> View full screen
          </Button>
        </div>
      ) : null}
      {hideFullScreenButton && /problem/i.test(block.title) ? (
        <p className="overview-brief__step-label" aria-label={`Step ${stepNumber} of ${totalSteps}`}>
          Step {stepNumber} of {totalSteps}
        </p>
      ) : null}
      <div className="flex items-center gap-2.5">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tone.tint)}>
          <Icon className={cn("h-4 w-4", tone.text)} />
        </span>
        <div>
          <p className="overview-brief__eyebrow">{sectionLabel}</p>
          <h2 className="font-display text-lg font-bold tracking-tight">{block.title}</h2>
        </div>
      </div>

      <div className="overview-brief__copy space-y-2 text-sm leading-6 text-foreground/90">
        {body.split(/\n{2,}/).map((para, p) => (
          <p key={`p-${p}`}>{para.replace(/\*\*/g, "").trim()}</p>
        ))}
        {visibleBullets.length ? (
          <ul className="overview-brief__bullets text-sm leading-6 text-muted-foreground">
            {visibleBullets.map((line, li) => (
              <li key={`b-${li}-${line.slice(0, 10)}`}>
                <span className="overview-brief__bullet" aria-hidden="true" />
                <EmphasizedText text={line} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {hasExtraDetails && !showAllDetails ? (
        <button
          type="button"
          className="overview-brief__toggle text-sm font-medium text-primary"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </article>
  );
}

function EmphasizedText({ text }: { text: string }) {
  const markdownSegments = text.split(/(\*\*[^*]+\*\*)/g);
  if (markdownSegments.some((segment) => segment.startsWith("**") && segment.endsWith("**"))) {
    return (
      <span>
        {markdownSegments.map((segment, index) =>
          segment.startsWith("**") && segment.endsWith("**") ? (
            <strong key={index} className="font-semibold text-foreground">
              {segment.slice(2, -2)}
            </strong>
          ) : (
            segment
          ),
        )}
      </span>
    );
  }

  const lead = (
    text.match(/^(.{1,48}?)(?=\s+—)/)?.[1] ??
    text.match(
      /^(.{1,48}?)(?=\s+(?:need|needs|can|will|does|do|is|are|has|have|should|must)\b)/i,
    )?.[1] ??
    text.match(
      /^((?:use|compare|show|create|download|open|add|run|check|build|set up|find|review|load|clean|train|test)(?:\s+\S+){0,7}?)(?=\s+(?:to|with|for|from|in|and)\b)/i,
    )?.[1] ??
    text.match(/^(\S+(?:\s+\S+){0,2})/)?.[1]
  )?.trim();
  if (!lead) return <span>{text}</span>;

  return (
    <span>
      <strong className="font-semibold text-foreground">{lead}</strong>
      {text.slice(lead.length)}
    </span>
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
  const example = block.example?.trim();
  const analogy = block.analogy?.trim();
  if (what.length === 0 && why.length === 0 && params.length === 0 && !example && !analogy)
    return null;

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
                <li key={`w-${li}-${line.slice(0, 10)}`}>
                  <EmphasizedText text={line} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {why.length ? (
          <section className="space-y-2">
            <h4 className="font-display text-base font-semibold tracking-tight">
              Why we do it this way
            </h4>
            <ul className="list-disc space-y-1.5 pl-5 text-foreground/90 marker:text-muted-foreground">
              {why.map((line, li) => (
                <li key={`y-${li}-${line.slice(0, 10)}`}>
                  <EmphasizedText text={line} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {example || analogy ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {example ? (
              <section className="rounded-lg border border-border bg-muted/25 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Quick example
                </h4>
                <p className="mt-1.5 text-sm leading-6 text-foreground/90">
                  <EmphasizedText text={example} />
                </p>
              </section>
            ) : null}
            {analogy ? (
              <section className="rounded-lg border border-primary/25 bg-primary/5 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Think of it like
                </h4>
                <p className="mt-1.5 text-sm leading-6 text-foreground/90">
                  <EmphasizedText text={analogy} />
                </p>
              </section>
            ) : null}
          </div>
        ) : null}

        {params.length ? (
          <section className="space-y-2">
            <h4 className="font-display text-base font-semibold tracking-tight">
              The choices made
            </h4>
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
          The code below belongs in a Jupyter notebook — one cell per part. Download it ready to
          run, then open it in Jupyter, VS Code or Colab and run the cells in order.
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
function StepFiles({ specs, isNew }: { specs: FileSpec[]; isNew: (spec: FileSpec) => boolean }) {
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
        No terminal, no coding. Download the blank file once, then paste each part into the place
        named below.
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
              <span
                className={cn("flex h-8 w-8 items-center justify-center rounded-md", meta.tint)}
              >
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
                  size="lg"
                  onClick={() => void download(spec)}
                  disabled={busy === spec.fileName}
                  className="gap-2"
                >
                  {busy === spec.fileName ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5" />
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
      <span
        className={cn("flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold", meta.tint)}
      >
        <Icon className="h-3.5 w-3.5" /> {meta.short}
      </span>
      <span className="text-muted-foreground">{isNew ? "Open your new file" : "Open"}</span>
      <span className="rounded-md bg-muted px-2 py-1 font-medium text-foreground">
        {spec.fileName}
      </span>
      <span className="text-muted-foreground">
        {spec.part
          ? `→ paste into the ${spec.partLabel} “${spec.part}”`
          : "→ paste this at the end"}
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
        <span className="font-semibold text-foreground">No typing needed.</span> The table below is
        ready — download it as a spreadsheet with all {rows} row{rows === 1 ? "" : "s"} already
        filled in.
      </p>
      <Button size="lg" onClick={download} disabled={busy} className="gap-2">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
        Download filled spreadsheet
      </Button>
    </div>
  );
}

/** "Where does this go?" bar for coding projects — file path + what to do. */

function CodeFileBar({ file, action }: { file: string; action?: string | undefined }) {
  const name = file.trim();
  const isTerminal = /^(terminal|shell|bash|cmd|powershell)$/i.test(name);
  const isEnv = /(^|\/)\.env(\.\w+)?$/i.test(name);
  const isRequirements = /(^|\/)(requirements\.txt|package\.json)$/i.test(name);
  const verb = isTerminal
    ? "Run these commands in your terminal"
    : isEnv
      ? "Create this file in your project root and put your own keys in it"
      : action === "modify"
        ? "Open this existing file and update it"
        : action === "run"
          ? "Run this file"
          : "Create this file (if it doesn't exist yet) and paste the code in";
  const Icon = isTerminal ? Terminal : FileCode2;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-card px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5 rounded-md bg-info/15 px-2 py-1 font-semibold text-info">
          <Icon className="h-3.5 w-3.5" /> {isTerminal ? "Terminal" : "File"}
        </span>
        <span className="text-muted-foreground">{verb}</span>
        {isTerminal ? null : (
          <span className="rounded-md bg-muted px-2 py-1 font-mono font-medium text-foreground">
            {name}
          </span>
        )}
      </div>
      {isEnv ? (
        <div className="rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Set up your environment variables.</span>{" "}
          Replace every placeholder with your own value, keep the file in the project root, and add{" "}
          <span className="font-mono">.env</span> to <span className="font-mono">.gitignore</span>{" "}
          so your keys never get pushed online.
        </div>
      ) : null}
      {isRequirements ? (
        <div className="rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Install the dependencies.</span> After
          saving this file run{" "}
          <span className="font-mono">
            {/package\.json$/i.test(name) ? "npm install" : "pip install -r requirements.txt"}
          </span>{" "}
          in your terminal.
        </div>
      ) : null}
    </div>
  );
}

function SectionCard({
  section,
  playbook,
  projectName,
  index,
  totalSteps,
  sections,
  locked,
  open,
  onToggle,
  generating,
  fixing,
  fixToken,
  onGenerate,
  onFix,
  onConfirm,
  onProceedToNext,
  onGenerateSection,
  onOpenEditor,
  fileOrigins,
  onOpenFile,
}: {
  onOpenFile?: ((file: string) => void) | undefined;
  section: BuildSection;
  playbook: DomainPlaybook;
  projectName: string;
  index: number;
  totalSteps: number;
  sections: BuildSection[];
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
  onProceedToNext: (fromIndex: number) => Promise<void>;
  onGenerateSection: (sectionIndex: number) => Promise<unknown>;
  onOpenEditor: (sectionIndex: number, file?: string) => void;
}) {
  const [showFix, setShowFix] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(index);
  const [showNextGeneratePrompt, setShowNextGeneratePrompt] = useState(false);
  const [generatingPreviewStep, setGeneratingPreviewStep] = useState(false);
  const [errorText, setErrorText] = useState("");

  // A successful fix wipes the box so the next error starts from a clean slate.
  useEffect(() => {
    if (fixToken > 0) {
      setErrorText("");
      setShowFix(false);
    }
  }, [fixToken]);
  const [zipping, setZipping] = useState(false);
  const openFullScreen = () => {
    setPreviewIndex(index);
    setShowNextGeneratePrompt(false);
    setShowFullScreen(true);
  };

  const goToPreviousPreview = () => {
    setShowNextGeneratePrompt(false);
    setPreviewIndex((current) => Math.max(0, current - 1));
  };

  const advancePreview = async () => {
    if (!previewNextSection) return;
    if (!previewNextHasGeneratedContent) {
      setShowNextGeneratePrompt(true);
      return;
    }
    try {
      await onProceedToNext(previewIndex);
      setPreviewIndex((current) => Math.min(sections.length - 1, current + 1));
    } catch {
      // The mutation shows an error toast; keep the current preview open.
    }
  };

  const generateAndPreviewNext = async () => {
    if (!previewNextSection) return;
    setGeneratingPreviewStep(true);
    try {
      await onProceedToNext(previewIndex);
      await onGenerateSection(previewIndex + 1);
      setPreviewIndex((current) => Math.min(sections.length - 1, current + 1));
      setShowNextGeneratePrompt(false);
    } catch {
      // The mutation shows an error toast; keep the prompt open to retry.
    } finally {
      setGeneratingPreviewStep(false);
    }
  };

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

  const previewSection = sections[previewIndex] ?? section;
  const previewNextSection = sections[previewIndex + 1] ?? null;
  const previewNextHasGeneratedContent = previewNextSection
    ? Boolean(previewNextSection.code) ||
      previewNextSection.blocks.length > 0 ||
      Boolean(previewNextSection.structure && playbook.buildsCode)
    : false;
  const previewIsOverview =
    previewSection.kind === "overview" ||
    (previewSection.position === 0 && /problem\s*statement/i.test(previewSection.title));
  const previewBlocks: Block[] =
    previewSection.blocks.length > 0
      ? previewSection.blocks
      : previewSection.code
        ? [{ title: "Code", code: previewSection.code, explanation: previewSection.explanation }]
        : [];
  const previewIsSetupSection = Boolean(previewSection.structure && playbook.buildsCode);
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
  const isSetupSection = Boolean(section.structure && playbook.buildsCode);

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

  const downloadZip = async (targetSection: BuildSection = section) => {
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const files = targetSection.files.filter((f) => f.path && !f.path.endsWith("/"));
      if (files.length === 0) {
        zip.file("project-structure.txt", targetSection.structure ?? "");
      } else {
        for (const file of files) {
          const path = file.path.replace(/^\.?\//, "");
          // Files ship empty on purpose; a notebook still needs valid JSON so
          // Jupyter can open it.
          zip.file(path, isNotebookFile(path) ? JSON.stringify(buildNotebook([]), null, 1) : "");
        }
        if (targetSection.structure) zip.file("PROJECT_STRUCTURE.txt", targetSection.structure);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${targetSection.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project"}.zip`;
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
        "build-roadmap__step",
        open && "is-open",
        confirmed && "is-confirmed",
        locked && "is-locked",
      )}
    >
      {!isOverview ? (
        <div className="build-roadmap__step-header">
          <button
            type="button"
            onClick={onToggle}
            className="build-roadmap__step-title"
            aria-expanded={open}
          >
            <span
              className={cn(
                "build-roadmap__number",
                confirmed ? "is-confirmed" : locked ? "is-locked" : "",
              )}
            >
              {confirmed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </span>
            <span className="build-roadmap__step-copy">
              <span
                className="build-roadmap__step-position"
                aria-label={`Step ${index + 1} of ${totalSteps}`}
              >
                Step {index + 1} of {totalSteps}
              </span>
              <span className="build-roadmap__step-name">
                {`Step ${index + 1} of ${totalSteps}`}
                {locked ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : null}
              </span>
              <span className="build-roadmap__step-subtitle">{section.title}</span>
              {section.objective ? (
                <span className="build-roadmap__objective">{section.objective}</span>
              ) : null}
            </span>
          </button>

          <div className="build-roadmap__step-actions">
            {generated ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="build-roadmap__fullscreen-trigger"
                onClick={openFullScreen}
              >
                <Expand className="h-4 w-4" /> View full screen
              </Button>
            ) : null}
            {!locked && !generated ? (
              <Button size="sm" onClick={onGenerate} disabled={generating}>
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {generating ? "Generating…" : "Generate"}
              </Button>
            ) : null}
            {!locked && generated ? (
              <Button
                size="sm"
                variant="outline"
                onClick={onGenerate}
                disabled={generating}
                title="Generate this step again"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {generating ? "Simplifying…" : isOverview ? "Make simpler" : "Regenerate"}
              </Button>
            ) : null}
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggle}
              aria-label={open ? "Close section" : "Open section"}
            >
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={showFullScreen} onOpenChange={setShowFullScreen}>
        <DialogContent
          fullScreen
          className="build-section-fullscreen__viewport"
          overlayClassName="build-section-fullscreen__overlay"
        >
          <div className="build-section-fullscreen">
            <DialogHeader className="build-section-fullscreen__header">
              <DialogTitle className="sr-only">{previewSection.title}</DialogTitle>
              <p className="build-section-fullscreen__project-name">{projectName}</p>
              <Button
                type="button"
                variant="outline"
                className="build-section-fullscreen__close"
                onClick={() => setShowFullScreen(false)}
              >
                Close
              </Button>
            </DialogHeader>
            <div
              className="build-section-fullscreen__progress"
              role="progressbar"
              aria-label="Preview progress"
              aria-valuemin={0}
              aria-valuemax={totalSteps}
              aria-valuenow={previewIndex + 1}
            >
              <span
                style={{
                  width: `${Math.min(100, ((previewIndex + 1) / Math.max(totalSteps, 1)) * 100)}%`,
                }}
              />
            </div>
            <div className="build-section-fullscreen__content">
              {showNextGeneratePrompt && previewNextSection ? (
                generatingPreviewStep ? (
                  <section
                    className="build-section-fullscreen__generation-card"
                    role="status"
                    aria-live="polite"
                  >
                    <span aria-hidden="true">
                      <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" />
                    </span>
                    <div>
                      <p>
                        Generating step {previewIndex + 2} of {totalSteps}
                      </p>
                      <h2>{previewNextSection.title}</h2>
                      <p>
                        We’re preparing this implementation. It will appear here as soon as it’s
                        ready.
                      </p>
                    </div>
                  </section>
                ) : (
                  <section className="build-section-fullscreen__generate-prompt">
                    <p className="build-section-fullscreen__eyebrow">
                      Step {previewIndex + 2} of {totalSteps}
                    </p>
                    <h2>{previewNextSection.title}</h2>
                    <p>
                      This implementation hasn’t been generated yet. Would you like to generate it
                      now and continue to the next step?
                    </p>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNextGeneratePrompt(false)}
                      >
                        Go back
                      </Button>
                      <Button type="button" onClick={generateAndPreviewNext}>
                        <Sparkles className="h-4 w-4" /> Generate this step
                      </Button>
                    </div>
                  </section>
                )
              ) : (
                <>
                  {previewIndex > 0 ? (
                    <header className="build-section-fullscreen__step-intro">
                      <p>
                        Step {previewIndex + 1} of {totalSteps}
                      </p>
                      <h2>{previewSection.title}</h2>
                      {previewSection.objective || previewSection.question ? (
                        <div>{previewSection.objective || previewSection.question}</div>
                      ) : null}
                    </header>
                  ) : null}
                  {previewIsOverview ? (
                    <OverviewBrief
                      blocks={previewBlocks}
                      onViewFullScreen={() => setShowFullScreen(false)}
                      stepNumber={previewIndex + 1}
                      totalSteps={totalSteps}
                      hideFullScreenButton
                      showAllDetails
                    />
                  ) : null}
                  {previewSection.structure && playbook.buildsCode ? (
                    <ProjectFolderSetup
                      structure={previewSection.structure}
                      onDownload={() => downloadZip(previewSection)}
                      downloading={zipping}
                    />
                  ) : null}
                  {!previewIsOverview && !previewIsSetupSection
                    ? previewBlocks.map((block, i) => {
                        const hasCode = Boolean(block.code?.trim());
                        return (
                          <article
                            key={`fullscreen-${block.title}-${i}`}
                            className="build-section-fullscreen__block"
                          >
                            <div className="build-section-fullscreen__block-heading">
                              <span>
                                {previewBlocks.length > 1 ? `Part ${i + 1}` : "Generated section"}
                              </span>
                              <h3>{block.title}</h3>
                              {block.file ? <code>{block.file}</code> : null}
                            </div>
                            {hasCode ? (
                              isNotebookFile(block.file) ? (
                                <NotebookCellView
                                  code={block.code}
                                  notebook={notebookName(block.file ?? "")}
                                  index={notebookCellIndex(block.file) ?? i + 1}
                                />
                              ) : isTerminalBlock(block) ? (
                                <CodeBlock code={block.code} language="bash" filename="terminal" />
                              ) : (
                                <CodeBlock
                                  code={block.code}
                                  language={previewSection.language}
                                  filename={block.file}
                                />
                              )
                            ) : null}
                            <BlockExplanation block={block} hasCode={hasCode} />
                          </article>
                        );
                      })
                    : null}
                  {!previewIsSetupSection && previewSection.walkthrough ? (
                    <article className="build-section-fullscreen__recap">
                      <h3>Step recap</h3>
                      {previewSection.walkthrough.completed?.length ? (
                        <section>
                          <h4>What you finished</h4>
                          <ul>
                            {previewSection.walkthrough.completed.map((item, itemIndex) => (
                              <li key={`complete-${itemIndex}`}>
                                <EmphasizedText text={item} />
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : null}
                      {previewSection.walkthrough.whats_next?.length ? (
                        <section>
                          <h4>What’s next</h4>
                          <ul>
                            {previewSection.walkthrough.whats_next.map((item, itemIndex) => (
                              <li key={`up-next-${itemIndex}`}>
                                <EmphasizedText text={item} />
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : null}
                      {previewSection.walkthrough.analogy ? (
                        <p>
                          <strong>Think of it like: </strong>
                          {previewSection.walkthrough.analogy}
                        </p>
                      ) : null}
                    </article>
                  ) : null}
                  {fixRounds(previewSection.fix_notes).map((round, roundIndex) => (
                    <FixRoundCard
                      key={`fullscreen-fix-${round.at ?? roundIndex}`}
                      round={round}
                      index={roundIndex}
                      language={round.language || previewSection.language}
                      partLabel={playbook.buildsCode ? "Part" : "Deliverable"}
                      buildsCode={playbook.buildsCode}
                    />
                  ))}
                </>
              )}
            </div>
            {!showNextGeneratePrompt && (previewIndex > 0 || previewNextSection) ? (
              <footer className="build-section-fullscreen__footer">
                {previewIndex > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="build-section-fullscreen__previous"
                    onClick={goToPreviousPreview}
                  >
                    <ArrowLeft className="h-4 w-4" /> Previous step
                  </Button>
                ) : null}
                {playbook.buildsCode ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="build-section-fullscreen__previous"
                    onClick={() => {
                      const firstCodeFile = previewBlocks.find(
                        (block) => block.code?.trim() && block.file && !isTerminalBlock(block),
                      )?.file;
                      onOpenEditor(previewIndex, firstCodeFile);
                      setShowFullScreen(false);
                    }}
                  >
                    <Code2 className="h-4 w-4" /> Open code editor
                  </Button>
                ) : null}
                {previewNextSection ? (
                  <Button type="button" onClick={advancePreview}>
                    Proceed to next step <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : null}
              </footer>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {open || isOverview ? (
        <div className="build-roadmap__step-body">
          {section.question && !isSetupSection && !isOverview ? (
            <p className="rounded-lg bg-primary/5 p-3 text-sm text-primary">{section.question}</p>
          ) : null}

          {!generated ? (
            isOverview ? (
              <div
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground"
                role="status"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Creating your Problem Statement, Solution, and Technology Stack…
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing generated yet. Press Generate when you&apos;re ready to work on this step.
              </p>
            )
          ) : null}

          {section.structure && playbook.buildsCode ? (
            <ProjectFolderSetup
              structure={section.structure}
              onDownload={downloadZip}
              downloading={zipping}
            />
          ) : null}

          {!playbook.buildsCode && stepSpecs.length ? (
            <StepFiles specs={stepSpecs} isNew={specIsNew} />
          ) : null}

          {notebooks.length ? (
            <NotebookActions notebooks={notebooks} language={section.language} />
          ) : null}

          {isOverview && generated ? (
            <OverviewBrief
              blocks={blocks}
              onViewFullScreen={openFullScreen}
              stepNumber={index + 1}
              totalSteps={totalSteps}
            />
          ) : null}

          {isOverview || isSetupSection
            ? null
            : blocks.map((block, i) => {
                const hasCode = Boolean(block.code?.trim());
                const blockFile = block.file?.trim();
                const spec = playbook.buildsCode
                  ? null
                  : parseFileSpec(blockFile || block.title, block.code ?? "");
                // Document domains get one continuous deliverable per step, so the
                // "Part N" chrome is dropped — the document speaks for itself.
                const showPartHeader = playbook.buildsCode || blocks.length > 1;
                return (
                  <div
                    key={`${block.title}-${i}`}
                    className="overflow-hidden rounded-xl border border-border bg-card/60"
                  >
                    {showPartHeader ? (
                      <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                        <p className="min-w-0 flex-1 font-display text-[15px]">
                          {playbook.buildsCode && hasCode
                            ? `Part ${i + 1} — ${block.title}`
                            : block.title}
                        </p>
                      </div>
                    ) : null}

                    <div className="space-y-4 p-5">
                      {playbook.buildsCode ? (
                        blockFile && hasCode ? (
                          <CodeFileBar file={blockFile} action={block.action} />
                        ) : null
                      ) : spec && hasCode ? (
                        <>
                          <DocFileBar spec={spec} isNew={specIsNew(spec)} />
                          {spec.kind === "excel" ? (
                            <SpreadsheetActions spec={spec} content={block.code ?? ""} />
                          ) : null}
                        </>
                      ) : null}
                      {hasCode ? (
                        playbook.buildsCode ? (
                          isNotebookFile(blockFile) ? (
                            <NotebookCellView
                              code={block.code}
                              notebook={notebookName(blockFile ?? "")}
                              index={notebookCellIndex(blockFile) ?? i + 1}
                            />
                          ) : onOpenFile && blockFile && !isTerminalBlock(block) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => onOpenFile(blockFile)}
                            >
                              <Code2 className="h-4 w-4" /> Open in code editor
                            </Button>
                          ) : (
                            <CodeBlock
                              code={block.code}
                              language={section.language}
                              filename={blockFile}
                            />
                          )
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

          {!isSetupSection &&
          section.walkthrough &&
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
                        <li key={`done-${i}-${line.slice(0, 10)}`}>
                          <EmphasizedText text={line} />
                        </li>
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
                        <li key={`next-${i}-${line.slice(0, 10)}`}>
                          <EmphasizedText text={line} />
                        </li>
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
                "build-roadmap__repair overflow-hidden rounded-xl border transition-colors",
                showFix ? "is-open" : "",
              )}
            >
              <button
                type="button"
                className="build-roadmap__repair-toggle flex w-full items-center gap-3 px-4 py-3 text-left"
                onClick={() => setShowFix((v) => !v)}
              >
                <span className="build-roadmap__repair-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                  <Wrench className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {playbook.buildsCode ? "Fix a code error" : "Ask for a revision"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {playbook.buildsCode
                      ? "Paste the error message or broken code. We’ll find the issue, fix this step, and explain the change."
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
                <div className="build-roadmap__repair-body space-y-3 border-t p-4">
                  <Textarea
                    rows={4}
                    value={errorText}
                    onChange={(e) => setErrorText(e.target.value)}
                    disabled={fixing}
                    className="build-roadmap__repair-input resize-y bg-card font-mono text-[12.5px]"
                    placeholder={
                      playbook.buildsCode
                        ? "Paste the full error message or the code that is not working, e.g.\nTraceback (most recent call last):\n  File \"app.py\", line 12, in <module>\nNameError: name 'data' is not defined"
                        : "Tell us what's wrong or unrealistic in this deliverable…"
                    }
                  />

                  <div className="build-roadmap__repair-actions flex flex-wrap items-center gap-2">
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
                          ? "Analyze & fix"
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
                      staticView
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
                        <li key={`fx-${li}-${line.slice(0, 10)}`}>
                          <EmphasizedText text={line} />
                        </li>
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
