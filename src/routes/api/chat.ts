/**
 * Streaming endpoint for the AI Mentor chat. One conversation per project:
 * history lives in `ai_messages` with thread = "mentor".
 */

import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { MENTOR_SYSTEM, authenticateRequest, buildProjectContext } from "@/lib/mentor.server";

const MODEL = "openai/gpt-5.6-sol";

function textOf(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let auth: Awaited<ReturnType<typeof authenticateRequest>>;
        try {
          auth = await authenticateRequest(request);
        } catch {
          return new Response("Unauthorized", { status: 401 });
        }

        const body = (await request.json()) as {
          messages?: UIMessage[];
          projectId?: string;
          importedProjectIds?: string[];
          threadId?: string;
        };
        const messages = body.messages;
        const projectId = body.projectId;
        const threadId = body.threadId;
        const importedProjectIds = Array.isArray(body.importedProjectIds)
          ? body.importedProjectIds.filter((id) => typeof id === "string" && id !== projectId).slice(0, 3)
          : [];
        if (!Array.isArray(messages) || !projectId || !threadId) {
          return new Response("messages, projectId and threadId are required", { status: 400 });
        }

        // The conversation must belong to the caller before anything is saved.
        const { data: thread } = await auth.supabase
          .from("mentor_threads")
          .select("id,title")
          .eq("id", threadId)
          .eq("user_id", auth.userId)
          .maybeSingle();
        if (!thread) return new Response("Conversation not found", { status: 404 });

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured.", { status: 500 });

        const context = await buildProjectContext(auth.supabase, projectId);
        if (!context) return new Response("Project not found", { status: 404 });

        // Extra projects the student explicitly imported into this conversation.
        const imported = (
          await Promise.all(
            importedProjectIds.map((id) => buildProjectContext(auth.supabase, id)),
          )
        ).filter((value): value is string => Boolean(value));

        const { holdCredits, releaseCredits, settleCredits } = await import("@/lib/credits.server");
        const hold: { id: string | null; settled: boolean } = { id: null, settled: false };
        try {
          hold.id = await holdCredits(auth.userId, "mentor_chat");
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "You are out of AI credits.";
          return new Response(message, { status: 402 });
        }

        // Persist the student's newest message before the model runs.
        const last = messages[messages.length - 1];
        if (last?.role === "user") {
          const text = textOf(last);
          const { error } = await auth.supabase.from("ai_messages").insert({
            user_id: auth.userId,
            project_id: projectId,
            thread: "mentor",
            mentor_thread_id: threadId,
            role: "user",
            content: text,
          });
          if (error) console.error("mentor: failed to save user message", error);

          // Name the conversation after the student's first question.
          const title =
            thread.title === "New conversation" && text
              ? text.length > 60
                ? `${text.slice(0, 60)}…`
                : text
              : thread.title;
          const { error: touchError } = await auth.supabase
            .from("mentor_threads")
            .update({ title, updated_at: new Date().toISOString() })
            .eq("id", threadId);
          if (touchError) console.error("mentor: failed to update thread", touchError);
        }

        const lovable = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: {
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
        });

        try {
          const result = streamText({
            model: lovable.responses(MODEL),
            system: `${MENTOR_SYSTEM}\n\nPROJECT CONTEXT (live data from the student's workspace):\n${context}${
              imported.length
                ? `\n\nIMPORTED PROJECTS the student asked you to also consider:\n${imported.join("\n\n---\n\n")}`
                : ""
            }`,
            messages: await convertToModelMessages(messages),
            abortSignal: request.signal,
            providerOptions: {
              openai: {
                forceReasoning: true,
                reasoningEffort: "low",
                reasoningSummary: "auto",
                store: false,
                include: ["reasoning.encrypted_content"],
              },
            },
            // The stream can end three ways; each must close out the hold
            // exactly once, or reserved credits stay locked forever.
            onError: async () => {
              if (!hold.id || hold.settled) return;
              hold.settled = true;
              await releaseCredits(hold.id);
            },
            onAbort: async () => {
              if (!hold.id || hold.settled) return;
              hold.settled = true;
              await releaseCredits(hold.id);
            },
            onFinish: async ({ text, usage }) => {
              const total =
                usage?.totalTokens ??
                (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
              try {
                let charged = 0;
                if (hold.id && !hold.settled) {
                  hold.settled = true;
                  charged = await settleCredits(hold.id, total);
                }
                const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
                await supabaseAdmin.from("ai_usage_events").insert({
                  user_id: auth.userId,
                  project_id: projectId,
                  feature: "mentor_chat",
                  model: MODEL,
                  input_tokens: usage?.inputTokens ?? 0,
                  output_tokens: usage?.outputTokens ?? 0,
                  total_tokens: total,
                  // Log exactly what the ledger charged, not a second estimate.
                  credits: charged,
                });
              } catch (error) {
                console.error("mentor: usage accounting failed", error);
              }

              if (text.trim()) {
                const { error } = await auth.supabase.from("ai_messages").insert({
                  user_id: auth.userId,
                  project_id: projectId,
                  thread: "mentor",
                  mentor_thread_id: threadId,
                  role: "assistant",
                  content: text,
                });
                if (error) console.error("mentor: failed to save reply", error);
              }
            },

          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages,
            sendReasoning: true,
          });
        } catch (error) {
          if (hold.id && !hold.settled) {
            hold.settled = true;
            await releaseCredits(hold.id);
          }
          if (error instanceof Error && error.name === "AbortError") {
            return new Response("Cancelled", { status: 499 });
          }
          console.error("mentor chat failed", error);
          return new Response("The mentor could not answer right now.", { status: 500 });
        }
      },
    },
  },
});
