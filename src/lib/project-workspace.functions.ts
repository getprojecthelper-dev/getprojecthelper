import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { syncProjectWorkspace } from "@/lib/project-workspace.server";
import { workspacePath } from "@/lib/project-workspace";

export const loadProjectWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: project } = await supabase.from("projects").select("user_id").eq("id", data.projectId).maybeSingle();
    if (!project) throw new Error("Project not found.");
    const canEdit = project.user_id === userId;
    if (canEdit) await syncProjectWorkspace(supabase, data.projectId);
    const { data: entries, error } = await supabase.from("project_workspace_entries").select("*").eq("project_id", data.projectId).order("path");
    if (error) throw new Error("Couldn't load your workspace.");
    return { entries: entries ?? [], canEdit };
  });

export const saveWorkspaceFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid(), path: z.string().max(500), content: z.string().max(2_000_000), revision: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    const path = workspacePath(data.path);
    const { data: project } = await context.supabase.from("projects").select("user_id").eq("id", data.projectId).eq("user_id", context.userId).maybeSingle();
    if (!project) throw new Error("Only the project owner can save files.");
    const { data: saved, error } = await context.supabase.from("project_workspace_entries").update({ content: data.content, edited: true, revision: data.revision + 1, updated_at: new Date().toISOString() }).eq("project_id", data.projectId).eq("path", path).eq("type", "file").eq("revision", data.revision).select().maybeSingle();
    if (error) throw new Error("Couldn't save this file. Your edits are still open.");
    if (!saved) throw new Error("This file changed elsewhere. Reopen the project before saving to avoid overwriting changes.");
    return saved;
  });