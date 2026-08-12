import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { computeHealth, computeProgress, type ProjectSignals } from "@/lib/project-domain";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export type Project = Tables["projects"]["Row"];
export type Task = Tables["tasks"]["Row"];
export type Requirement = Tables["requirements"]["Row"];
export type TestCase = Tables["test_cases"]["Row"];
export type ResearchSource = Tables["research_sources"]["Row"];
export type ResearchNote = Tables["research_notes"]["Row"];
export type DocumentSection = Tables["document_sections"]["Row"];
export type Experiment = Tables["experiments"]["Row"];
export type Risk = Tables["risks"]["Row"];
export type AiMessage = Tables["ai_messages"]["Row"];

export type ProjectChildTable =
  | "tasks"
  | "requirements"
  | "test_cases"
  | "research_sources"
  | "research_notes"
  | "document_sections"
  | "experiments"
  | "risks";

export const bundleKey = (projectId: string) => ["project-bundle", projectId] as const;
export const projectsKey = ["projects"] as const;

function fail(message: string, error: unknown): never {
  console.error(message, error);
  throw new Error(message);
}

export function useProjects() {
  return useQuery({
    queryKey: projectsKey,
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) fail("We couldn't load your projects.", error);
      return data ?? [];
    },
  });
}

export interface ProjectOverview {
  project: Project;
  progress: number;
  health: number;
  buildTotal: number;
  buildConfirmed: number;
  /** Section the student should resume from, if any. */
  resumeSection: { id: string; title: string; position: number } | null;
}

/** Lightweight cross-project metrics used by the dashboard KPI cards. */
export function useProjectsOverview() {
  return useQuery({
    queryKey: ["projects-overview"],
    queryFn: async (): Promise<ProjectOverview[]> => {
      const [projects, tasks, requirements, tests, docs, risks, build] = await Promise.all([
        supabase.from("projects").select("*").order("updated_at", { ascending: false }),
        supabase.from("tasks").select("project_id,title,status,due_date,priority"),
        supabase.from("requirements").select("project_id,status"),
        supabase.from("test_cases").select("project_id,status"),
        supabase.from("document_sections").select("project_id,status"),
        supabase.from("risks").select("project_id,status,severity"),
        supabase
          .from("build_sections")
          .select("id,project_id,title,status,position")
          .order("position"),
      ]);

      if (projects.error) fail("We couldn't load your projects.", projects.error);

      const by = <T extends { project_id: string }>(rows: T[] | null, id: string) =>
        (rows ?? []).filter((r) => r.project_id === id);

      return (projects.data ?? []).map((project) => {
        const sections = by(build.data, project.id);
        const confirmed = sections.filter((s) => s.status === "confirmed").length;
        const signals: ProjectSignals = {
          tasks: by(tasks.data, project.id).map((t) => ({
            title: t.title,
            status: t.status,
            due_date: t.due_date,
            priority: t.priority,
          })),
          requirements: by(requirements.data, project.id).map((r) => ({ status: r.status })),
          tests: by(tests.data, project.id).map((t) => ({ status: t.status })),
          docSections: by(docs.data, project.id).map((d) => ({ status: d.status })),
          risks: by(risks.data, project.id).map((r) => ({
            status: r.status,
            severity: r.severity,
          })),
          deadline: project.deadline,
        };
        const taskProgress = computeProgress(signals);
        const progress = sections.length
          ? Math.round((confirmed / sections.length) * 100)
          : taskProgress;
        const next = sections.find((s) => s.status !== "confirmed") ?? null;
        return {
          project,
          progress,
          health: computeHealth(signals, progress).score,
          buildTotal: sections.length,
          buildConfirmed: confirmed,
          resumeSection: next
            ? { id: next.id, title: next.title, position: next.position }
            : null,
        };
      });
    },
  });
}


export interface ProjectBundle {
  project: Project;
  tasks: Task[];
  requirements: Requirement[];
  tests: TestCase[];
  sources: ResearchSource[];
  notes: ResearchNote[];
  docSections: DocumentSection[];
  experiments: Experiment[];
  risks: Risk[];
}

export function useProjectBundle(projectId: string) {
  return useQuery({
    queryKey: bundleKey(projectId),
    queryFn: async (): Promise<ProjectBundle> => {
      const [project, tasks, requirements, tests, sources, notes, docSections, experiments, risks] =
        await Promise.all([
          supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
          supabase.from("tasks").select("*").eq("project_id", projectId).order("created_at"),
          supabase.from("requirements").select("*").eq("project_id", projectId).order("code"),
          supabase.from("test_cases").select("*").eq("project_id", projectId).order("created_at"),
          supabase.from("research_sources").select("*").eq("project_id", projectId).order("created_at"),
          supabase.from("research_notes").select("*").eq("project_id", projectId).order("created_at"),
          supabase.from("document_sections").select("*").eq("project_id", projectId).order("position"),
          supabase.from("experiments").select("*").eq("project_id", projectId).order("created_at"),
          supabase.from("risks").select("*").eq("project_id", projectId).order("created_at"),
        ]);

      if (project.error) fail("We couldn't load this project.", project.error);
      if (!project.data) throw new Error("Project not found, or you don't have access to it.");

      return {
        project: project.data,
        tasks: tasks.data ?? [],
        requirements: requirements.data ?? [],
        tests: tests.data ?? [],
        sources: sources.data ?? [],
        notes: notes.data ?? [],
        docSections: docSections.data ?? [],
        experiments: experiments.data ?? [],
        risks: risks.data ?? [],
      };
    },
    retry: false,
  });
}

/**
 * Loosely typed view of the query builder. The generated types can't narrow a
 * generic table name, so writes go through this shape while the public API of
 * `useRecordMutations` stays fully typed per table.
 */
interface LooseBuilder {
  insert: (values: unknown) => {
    select: () => { single: () => Promise<{ data: unknown; error: unknown }> };
  };
  update: (values: unknown) => {
    eq: (column: string, value: string) => Promise<{ error: unknown }>;
  };
  delete: () => { eq: (column: string, value: string) => Promise<{ error: unknown }> };
}

/** Generic create / update / delete for any project-owned table. */
export function useRecordMutations<T extends ProjectChildTable>(table: T, projectId: string) {
  const qc = useQueryClient();
  const from = () => supabase.from(table) as unknown as LooseBuilder;
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: bundleKey(projectId) });
  };
  const onError = (error: unknown) => {
    console.error(error);
    toast.error("That change couldn't be saved. Please try again.");
  };

  const create = useMutation({
    mutationFn: async (values: Omit<Tables[T]["Insert"], "project_id">) => {
      const { data, error } = await from()
        .insert({ ...values, project_id: projectId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
    onError,
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Tables[T]["Update"] }) => {
      const { error } = await from().update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await from().delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError,
  });

  return { create, update, remove };
}


export function useProjectMutations() {
  const qc = useQueryClient();
  const invalidate = (id?: string) => {
    void qc.invalidateQueries({ queryKey: projectsKey });
    void qc.invalidateQueries({ queryKey: ["projects-overview"] });
    if (id) void qc.invalidateQueries({ queryKey: bundleKey(id) });
  };

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Tables["projects"]["Update"] }) => {
      const { error } = await supabase.from("projects").update(values).eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => invalidate(id),
    onError: (error) => {
      console.error(error);
      toast.error("We couldn't update the project.");
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (error) => {
      console.error(error);
      toast.error("We couldn't delete the project.");
    },
  });

  return { update, remove };
}
