import { supabase } from "@/integrations/supabase/client";
import { getTemplate } from "@/lib/project-domain";

export interface NewProjectInput {
  name: string;
  description?: string | null;
  domain: string;
  project_type?: string | null;
  academic_level?: string | null;
  purpose: string;
  template: string;
  deadline?: string | null;
  code_complexity?: "easy" | "intermediate" | "advanced";
}

/**
 * Creates the project and seeds the lifecycle artefacts that come with the
 * chosen template: starter tasks and the report structure.
 */
export async function createProjectWithTemplate(input: NewProjectInput): Promise<string> {
  const template = getTemplate(input.template);

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name: input.name,
      description: input.description ?? null,
      domain: input.domain,
      project_type: input.project_type ?? null,
      academic_level: input.academic_level ?? null,
      purpose: input.purpose,
      template: input.template,
      deadline: input.deadline || null,
      current_stage: "planning",
      code_complexity: input.code_complexity ?? "intermediate",
    })
    .select("id")
    .single();

  if (error || !project) throw error ?? new Error("Project could not be created");

  const [tasks, docs] = await Promise.all([
    supabase.from("tasks").insert(
      template.starterTasks.map((t) => ({
        project_id: project.id,
        title: t.title,
        stage: t.stage,
        status: "not_started",
        priority: "medium",
      })),
    ),
    supabase.from("document_sections").insert(
      template.documentSections.map((title, index) => ({
        project_id: project.id,
        title,
        position: index,
        status: "not_started",
      })),
    ),
  ]);

  if (tasks.error) console.error(tasks.error);
  if (docs.error) console.error(docs.error);

  return project.id;
}
