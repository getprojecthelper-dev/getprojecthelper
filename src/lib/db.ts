import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
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
