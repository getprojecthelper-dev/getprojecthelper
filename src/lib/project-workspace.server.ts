import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { collectWorkspace, type WorkspaceSection } from "@/lib/project-workspace";

export async function syncProjectWorkspace(supabase: SupabaseClient<Database>, projectId: string) {
  const { data, error } = await supabase.from("build_sections").select("position,structure,files,blocks,fix_notes").eq("project_id", projectId).order("position");
  if (error) throw new Error("Couldn't read generated project files.");
  const entries = collectWorkspace((data ?? []) as unknown as WorkspaceSection[]);
  if (entries.length) {
    const { error: saveError } = await supabase.rpc("merge_project_workspace", { _project_id: projectId, _entries: JSON.parse(JSON.stringify(entries)) as Json });
    if (saveError) throw new Error("Couldn't save the generated workspace. Please retry.");
    const { data: stored } = await supabase.from("project_workspace_entries").select("path,edited").eq("project_id", projectId);
    const paths = new Set(entries.map((entry) => entry.path));
    const obsolete = (stored ?? []).filter((entry) => !entry.edited && !paths.has(entry.path)).map((entry) => entry.path);
    if (obsolete.length) {
      const { error: cleanupError } = await supabase.from("project_workspace_entries").delete().eq("project_id", projectId).eq("edited", false).in("path", obsolete);
      if (cleanupError) throw new Error("Couldn't refresh the workspace file list.");
    }
  }
  return entries;
}