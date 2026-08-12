import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  Download,
  Loader2,
  Lock,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { fixSectionError, generateSection } from "@/lib/builder.functions";
import { useProjectId } from "@/lib/use-workspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projects/$projectId/build")({
  component: BuildPage,
});

interface BuildSection {
  id: string;
  position: number;
  title: string;
  question: string | null;
  objective: string | null;
  kind: string;
  code: string | null;
  language: string;
  explanation: string[];
  insights: string[];
  business_connection: string | null;
  structure: string | null;
  status: string;
}

const sectionsKey = (projectId: string) => ["build-sections", projectId] as const;

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
        explanation: Array.isArray(row.explanation) ? (row.explanation as string[]) : [],
        insights: Array.isArray(row.insights) ? (row.insights as string[]) : [],
      }));
    },
  });
}

function BuildPage() {
  const projectId = useProjectId();
  const qc = useQueryClient();
  const { data: sections = [], isPending } = useSections(projectId);
  const generate = useServerFn(generateSection);
  const fix = useServerFn(fixSectionError);

  const invalidate = () => qc.invalidateQueries({ queryKey: sectionsKey(projectId) });

  const generateMutation = useMutation({
    mutationFn: (sectionId: string) => generate({ data: { sectionId } }),
    onSuccess: () => {
      void invalidate();
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
    <div className="space-y-5">
      <PageHeader
        title="Project implementation sections"
        description="Generate each section only when you're ready. Every section builds on the code before it."
      />

      <div className="panel space-y-2 p-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          {completed} of {sections.length} sections completed
        </p>
      </div>

      {sections.map((section, index) => {
        const locked = activeIndex !== -1 && index > activeIndex;
        return (
          <SectionCard
            key={section.id}
            section={section}
            index={index}
            locked={locked}
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

function SectionCard({
  section,
  index,
  locked,
  generating,
  fixing,
  onGenerate,
  onFix,
  onConfirm,
}: {
  section: BuildSection;
  index: number;
  locked: boolean;
  generating: boolean;
  fixing: boolean;
  onGenerate: () => void;
  onFix: (errorText: string) => void;
  onConfirm: () => void;
}) {
  const [showFix, setShowFix] = useState(false);
  const [errorText, setErrorText] = useState("");
  const confirmed = section.status === "confirmed";
  const generated = Boolean(section.code);

  const download = () => {
    const content = section.structure ?? section.code ?? "";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project-structure.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className={cn(
        "panel space-y-4 p-5",
        confirmed ? "border-success/40 bg-success/5" : locked ? "opacity-70" : "",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold">
            {index + 1}. {section.title}
            {confirmed ? <CheckCircle2 className="h-4 w-4 text-success" /> : null}
            {locked ? <Lock className="h-4 w-4 text-muted-foreground" /> : null}
          </h2>
          {section.question ? (
            <p className="text-sm text-primary">Question: {section.question}</p>
          ) : null}
          {section.objective ? (
            <p className="text-sm text-muted-foreground">Objective: {section.objective}</p>
          ) : null}
        </div>
        {!locked && !generated ? (
          <Button size="sm" onClick={onGenerate} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Generating…" : "Generate"}
          </Button>
        ) : null}
      </div>

      {generated ? (
        <div className="space-y-4">
          {section.structure ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Project structure</p>
              <pre className="overflow-x-auto rounded-lg bg-foreground p-4 text-xs text-background">
                {section.structure}
              </pre>
              <Button size="sm" variant="outline" onClick={download}>
                <Download className="h-4 w-4" /> Download structure
              </Button>
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium">Code</p>
            <pre className="overflow-x-auto rounded-lg bg-foreground p-4 text-xs text-background">
              {section.code}
            </pre>
          </div>

          {section.explanation.length ? (
            <div>
              <p className="text-sm font-medium">What happens in this section</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {section.explanation.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {section.insights.length ? (
            <div className="rounded-lg bg-warning/10 p-3">
              <p className="text-sm font-medium">Key insights</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {section.insights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {section.business_connection ? (
            <div className="rounded-lg bg-primary/5 p-3 text-sm">
              <p className="font-medium">Business connection</p>
              <p className="text-muted-foreground">{section.business_connection}</p>
            </div>
          ) : null}

          <div className="rounded-lg border border-border p-3">
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium"
              onClick={() => setShowFix((v) => !v)}
            >
              <Wrench className="h-4 w-4" /> Fix error
            </button>
            {showFix ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  rows={4}
                  value={errorText}
                  onChange={(e) => setErrorText(e.target.value)}
                  placeholder="Paste the error you got when running this code…"
                />
                <Button
                  size="sm"
                  disabled={fixing || errorText.trim().length < 3}
                  onClick={() => onFix(errorText)}
                >
                  {fixing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                  {fixing ? "Fixing…" : "Fix my code"}
                </Button>
              </div>
            ) : null}
          </div>

          {!confirmed ? (
            <Button className="w-full" onClick={onConfirm}>
              <CheckCircle2 className="h-4 w-4" /> Confirm &amp; continue to next section
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
