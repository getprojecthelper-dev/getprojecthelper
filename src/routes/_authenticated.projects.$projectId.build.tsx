import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  FolderTree,
  Loader2,
  Lock,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { withMeter } from "@/components/credit-meter";
import { CodeBlock } from "@/components/code-block";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { fixSectionError, generateSection } from "@/lib/builder.functions";
import { getPlaybook, type DomainPlaybook } from "@/lib/domain-playbooks";
import { useProjectId } from "@/lib/use-workspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projects/$projectId/build")({
  component: BuildPage,
});

interface Block {
  title: string;
  code: string;
  explanation: string[];
}

interface StructureFile {
  path: string;
  content: string;
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
      }));
    },
  });
}

function BuildPage() {
  const projectId = useProjectId();
  const qc = useQueryClient();
  const { data: sections = [], isPending } = useSections(projectId);
  const { data: domain } = useQuery({
    queryKey: ["project-domain", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("domain").eq("id", projectId).maybeSingle();
      return (data?.domain as string | null) ?? null;
    },
  });
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

  const fixMutation = useMutation({
    mutationFn: (vars: { sectionId: string; errorText: string }) => fix({ data: vars }),
    onSuccess: () => {
      void invalidate();
      toast.success("Code updated with a fix.");
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
  const activeIndex = sections.findIndex((s) => s.status !== "confirmed");

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

      {playbook.gettingStarted ? <GettingStarted guide={playbook.gettingStarted} /> : null}

      {sections.map((section, index) => {
        const locked = activeIndex !== -1 && index > activeIndex;
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
        <div className="space-y-4 border-t border-border bg-muted/20 p-5">
          <p className="text-sm text-muted-foreground">{guide.intro}</p>

          <div className="grid gap-3 sm:grid-cols-3">
            {guide.tools.map((tool) => (
              <div key={tool.label} className="rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-semibold">{tool.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tool.detail}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">How it works</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              {guide.how.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </div>

          {guide.note ? (
            <p className="rounded-lg bg-accent/10 p-3 text-sm text-muted-foreground">{guide.note}</p>
          ) : null}
        </div>
      ) : null}
    </section>
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
  onGenerate,
  onFix,
  onConfirm,
}: {
  section: BuildSection;
  playbook: DomainPlaybook;
  index: number;
  locked: boolean;
  open: boolean;
  onToggle: () => void;
  generating: boolean;
  fixing: boolean;
  onGenerate: () => void;
  onFix: (errorText: string) => void;
  onConfirm: () => void;
}) {
  const [showFix, setShowFix] = useState(false);
  const [errorText, setErrorText] = useState("");
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
          zip.file(file.path.replace(/^\.?\//, ""), file.content ?? "");
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
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium">
                <FolderTree className="h-4 w-4" /> Project structure
              </p>
              <CodeBlock code={section.structure} filename="project structure" />
              <Button size="sm" variant="outline" onClick={downloadZip} disabled={zipping}>
                {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {zipping ? "Preparing…" : "Download as .zip"}
              </Button>
            </div>
          ) : null}

          {blocks.map((block, i) => {
            const hasCode = Boolean(block.code?.trim());
            const partLabel = playbook.buildsCode ? "Part" : "Deliverable";
            const guidance = playbook.buildsCode
              ? null
              : getFileGuidance(block.title, section.title, block.code ?? "");
            return (
              <div key={`${block.title}-${i}`} className="space-y-2">
                <p className="text-sm font-semibold">
                  {hasCode ? `${partLabel} ${i + 1} — ${block.title}` : block.title}
                </p>
                {guidance ? <FileGuidanceBar guidance={guidance} /> : null}
                {hasCode ? <CodeBlock code={block.code} language={section.language} /> : null}
                {block.explanation?.length ? (
                  hasCode ? (
                    <ul className="list-disc space-y-1 rounded-lg border border-border bg-card p-3 pl-7 text-sm text-muted-foreground">
                      {block.explanation.map((line, li) => (
                        <li key={`${li}-${line.slice(0, 10)}`}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-2 rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
                      {block.explanation.length === 1 ? (
                        <p>{block.explanation[0]}</p>
                      ) : (
                        <ul className="list-disc space-y-1 pl-5">
                          {block.explanation.map((line, li) => (
                            <li key={`${li}-${line.slice(0, 10)}`}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                ) : null}
              </div>
            );
          })}


          {section.insights.length ? (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
              <p className="text-sm font-medium">Watch out for</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {section.insights.map((line, i) => (
                  <li key={`${i}-${line.slice(0, 10)}`}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {section.business_connection ? (
            <div className="rounded-lg bg-accent/10 p-3 text-sm">
              <p className="font-medium">Why this matters</p>
              <p className="text-muted-foreground">{section.business_connection}</p>
            </div>
          ) : null}

          {generated && !isOverview ? (
            <div className="rounded-lg border border-border bg-card p-3">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium"
                onClick={() => setShowFix((v) => !v)}
              >
                <Wrench className="h-4 w-4" /> {playbook.buildsCode ? "Fix error" : "Ask for a revision"}
                {showFix ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {showFix ? (
                <div className="mt-3 space-y-2">
                  <Textarea
                    rows={4}
                    value={errorText}
                    onChange={(e) => setErrorText(e.target.value)}
                    placeholder={
                      playbook.buildsCode
                        ? "Paste the error you got when running this code…"
                        : "Tell us what's wrong or unrealistic in this deliverable…"
                    }
                  />
                  <Button
                    size="sm"
                    disabled={fixing || errorText.trim().length < 3}
                    onClick={() => onFix(errorText)}
                  >
                    {fixing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                    {fixing ? "Fixing…" : playbook.buildsCode ? "Fix my code" : "Revise this deliverable"}
                  </Button>
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
