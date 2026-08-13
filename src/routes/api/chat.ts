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

        const body = (await request.json()) as { messages?: UIMessage[]; projectId?: string };
        const messages = body.messages;
        const projectId = body.projectId;
        if (!Array.isArray(messages) || !projectId) {
          return new Response("messages and projectId are required", { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured.", { status: 500 });

        const context = await buildProjectContext(auth.supabase, projectId);
        if (!context) return new Response("Project not found", { status: 404 });

        const { holdCredits, releaseCredits, settleCredits } = await import("@/lib/credits.server");
        let holdId: string | null = null;
        try {
          holdId = await holdCredits(auth.userId, "mentor_chat");
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "You are out of AI credits.";
          return new Response(message, { status: 402 });
        }

        // Persist the student's newest message before the model runs.
        const last = messages[messages.length - 1];
        if (last?.role === "user") {
          const { error } = await auth.supabase.from("ai_messages").insert({
            user_id: auth.userId,
            project_id: projectId,
            thread: "mentor",
            role: "user",
            content: textOf(last),
          });
          if (error) console.error("mentor: failed to save user message", error);
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
            system: `${MENTOR_SYSTEM}\n\nPROJECT CONTEXT (live data from the student's workspace):\n${context}`,
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
            onFinish: async ({ text, usage }) => {
              const total =
                usage?.totalTokens ??
                (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
              try {
                if (holdId) await settleCredits(holdId, total);
                const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
                await supabaseAdmin.from("ai_usage_events").insert({
                  user_id: auth.userId,
                  project_id: projectId,
                  feature: "mentor_chat",
                  model: MODEL,
                  input_tokens: usage?.inputTokens ?? 0,
                  output_tokens: usage?.outputTokens ?? 0,
                  total_tokens: total,
                  credits: Number((total / 1000).toFixed(4)),
                });
              } catch (error) {
                console.error("mentor: usage accounting failed", error);
              }

              if (text.trim()) {
                const { error } = await auth.supabase.from("ai_messages").insert({
                  user_id: auth.userId,
                  project_id: projectId,
                  thread: "mentor",
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
          if (holdId) await releaseCredits(holdId);
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
