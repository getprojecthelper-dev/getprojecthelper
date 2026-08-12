/**
 * Thin wrapper around the Lovable AI Gateway Responses API.
 * Streaming is required (reasoning runs are long); we accumulate the deltas
 * server-side and return parsed JSON.
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-5.6-sol";

export interface UsageMeta {
  userId: string;
  projectId?: string | null;
  feature: string;
}

export interface JsonRequest {
  instructions: string;
  input: string;
  name: string;
  schema: Record<string, unknown>;
  usage?: UsageMeta;
}

/** Best-effort AI credit accounting — never breaks the user-facing call. */
async function recordUsage(
  meta: UsageMeta | undefined,
  tokens: { input: number; output: number; total: number },
) {
  if (!meta) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ai_usage_events").insert({
      user_id: meta.userId,
      project_id: meta.projectId ?? null,
      feature: meta.feature,
      model: MODEL,
      input_tokens: tokens.input,
      output_tokens: tokens.output,
      total_tokens: tokens.total,
      // 1 credit per 1k tokens
      credits: Number((tokens.total / 1000).toFixed(4)),
    });
  } catch (error) {
    console.error("ai usage logging failed", error);
  }
}


export async function generateJson<T>(req: JsonRequest): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      instructions: req.instructions,
      input: req.input,
      stream: true,
      reasoning: { effort: "low", summary: "auto" },
      text: {
        format: {
          type: "json_schema",
          name: req.name,
          strict: true,
          schema: req.schema,
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("The AI is busy right now. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    throw new Error(`AI request failed [${res.status}]: ${body.slice(0, 400)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          text += event.delta;
        } else if (event.type === "response.completed" && event.response?.output_text) {
          text = event.response.output_text;
        }
      } catch {
        // ignore keep-alive / partial frames
      }
    }
  }

  if (!text.trim()) throw new Error("The AI returned an empty response. Please try again.");
  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1)) as T;
    throw new Error("The AI response could not be read. Please try again.");
  }
}

export const str = { type: "string" } as const;
export const nullableStr = { type: ["string", "null"] } as const;
export const strArray = { type: "array", items: { type: "string" } } as const;

export function obj(properties: Record<string, unknown>) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  };
}
