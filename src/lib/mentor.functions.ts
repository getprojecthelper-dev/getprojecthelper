import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface MentorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface MentorThread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const projectInput = (input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input);
const threadInput = (input: unknown) => z.object({ threadId: z.string().uuid() }).parse(input);

/** All saved mentor conversations for a project, newest first. */
export const listMentorThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(projectInput)
  .handler(async ({ data, context }): Promise<MentorThread[]> => {
    const { data: rows, error } = await context.supabase
      .from("mentor_threads")
      .select("id,title,created_at,updated_at")
      .eq("project_id", data.projectId)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("mentor threads failed", error);
      throw new Error("We couldn't load your saved conversations.");
    }
    return rows ?? [];
  });

/** Starts a new saved conversation and returns its id. */
export const createMentorThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(projectInput)
  .handler(async ({ data, context }): Promise<MentorThread> => {
    const { data: row, error } = await context.supabase
      .from("mentor_threads")
      .insert({ project_id: data.projectId, user_id: context.userId, title: "New conversation" })
      .select("id,title,created_at,updated_at")
      .single();
    if (error || !row) {
      console.error("mentor thread create failed", error);
      throw new Error("We couldn't start a new conversation.");
    }
    return row;
  });

/** Messages of one saved conversation. */
export const getMentorHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(threadInput)
  .handler(async ({ data, context }): Promise<MentorMessage[]> => {
    const { data: rows, error } = await context.supabase
      .from("ai_messages")
      .select("id,role,content,created_at")
      .eq("mentor_thread_id", data.threadId)
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

/** Deletes one saved conversation and its messages. */
export const deleteMentorThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(threadInput)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("mentor_threads")
      .delete()
      .eq("id", data.threadId);
    if (error) {
      console.error("mentor thread delete failed", error);
      throw new Error("We couldn't delete that conversation.");
    }
    return { ok: true };
  });

/** Clears the messages inside a conversation without deleting it. */
export const clearMentorChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(threadInput)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_messages")
      .delete()
      .eq("mentor_thread_id", data.threadId)
      .eq("thread", "mentor");
    if (error) throw new Error("We couldn't clear the conversation.");
    return { ok: true };
  });
