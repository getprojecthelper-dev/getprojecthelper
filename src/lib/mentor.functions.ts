import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface MentorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

const projectInput = (input: unknown) =>
  z.object({ projectId: z.string().uuid() }).parse(input);

export const getMentorHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(projectInput)
  .handler(async ({ data, context }): Promise<MentorMessage[]> => {
    const { data: rows, error } = await context.supabase
      .from("ai_messages")
      .select("id,role,content,created_at")
      .eq("project_id", data.projectId)
      .eq("thread", "mentor")
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) {
      console.error("mentor history failed", error);
      throw new Error("We couldn't load your mentor conversation.");
    }
    return (rows ?? []).map((row) => ({
      id: row.id,
      role: row.role === "assistant" ? "assistant" : "user",
      content: row.content,
      created_at: row.created_at,
    }));
  });

export const clearMentorChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(projectInput)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_messages")
      .delete()
      .eq("project_id", data.projectId)
      .eq("thread", "mentor");
    if (error) throw new Error("We couldn't clear the conversation.");
    return { ok: true };
  });
