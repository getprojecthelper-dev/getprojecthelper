import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPremadeProject } from "@/lib/premade-projects";
import { getTemplate } from "@/lib/project-domain";

export type PurchaseResult =
  | { ok: true; projectId: string }
  | { ok: false; message: string };

/**
 * Unlocks a premade project: charges the fixed credit price, then creates a
 * real project (with its template tasks and document sections) so the student
 * can work on it like any other project. Any failure releases the charge.
 */
export const purchasePremadeProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }): Promise<PurchaseResult> => {
    const entry = getPremadeProject(data.id);
    if (!entry) return { ok: false, message: "That project is no longer available." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: holdId, error: holdError } = await supabaseAdmin.rpc("hold_credits", {
      _user_id: context.userId,
      _amount: entry.priceCredits,
      _feature: "premade_project",
    });
    if (holdError || !holdId) {
      return {
        ok: false,
        message: "Not enough AI credits for this project. Top up from the Credits page, then try again.",
      };
    }

    try {
      const template = getTemplate(entry.domain);
      const { data: project, error } = await context.supabase
        .from("projects")
        .insert({
          name: entry.title,
          description: entry.brief,
          domain: entry.domain,
          project_type: null,
          academic_level: null,
          purpose: "academic",
          template: template.value,
          current_stage: "planning",
          code_complexity: "intermediate",
        })
        .select("id")
        .single();
      if (error || !project) throw error ?? new Error("Project could not be created");

      const [tasks, docs] = await Promise.all([
        context.supabase.from("tasks").insert(
          template.starterTasks.map((t) => ({
            project_id: project.id,
            title: t.title,
            stage: t.stage,
            status: "not_started",
            priority: "medium",
          })),
        ),
        context.supabase.from("document_sections").insert(
          template.documentSections.map((title, index) => ({
            project_id: project.id,
            title,
            position: index,
            status: "not_started",
          })),
        ),
      ]);
      if (tasks.error || docs.error) throw tasks.error ?? docs.error;

      await supabaseAdmin.rpc("settle_credit_hold", {
        _hold_id: holdId,
        _actual: entry.priceCredits,
      });
      return { ok: true, projectId: project.id };
    } catch (error) {
      console.error("premade purchase failed", error);
      await supabaseAdmin.rpc("release_credit_hold", { _hold_id: holdId });
      return {
        ok: false,
        message: "Couldn't create the project, so your credits were not charged. Please try again.",
      };
    }
  });
