import { createFileRoute } from "@tanstack/react-router";

import { getPremadeProject } from "@/lib/premade-projects";
import { EventName, verifyPaymentWebhook, type PaddleEnv } from "@/lib/paddle.server";
import { getTemplate } from "@/lib/project-domain";

type TransactionData = {
  id: string;
  customerId: string | null;
  customData: Record<string, unknown> | null;
  currencyCode: string;
  details: { totals: { total: string } | null } | null;
};

async function fulfilProjectPurchase(data: TransactionData, environment: PaddleEnv) {
  const userId = typeof data.customData?.["userId"] === "string" ? data.customData["userId"] : null;
  const catalogProjectId =
    typeof data.customData?.["catalogProjectId"] === "string"
      ? data.customData["catalogProjectId"]
      : null;
  if (!userId || !catalogProjectId) return;
  const entry = getPremadeProject(catalogProjectId);
  if (!entry) return;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin
    .from("project_purchases")
    .select("id,project_id")
    .eq("user_id", userId)
    .eq("catalog_project_id", catalogProjectId)
    .eq("environment", environment)
    .maybeSingle();
  if (existing) return;

  const template = getTemplate(entry.domain);
  const { data: project, error: projectError } = await supabaseAdmin
    .from("projects")
    .insert({
      user_id: userId,
      name: entry.title,
      description: entry.brief,
      domain: entry.domain,
      purpose: "academic",
      template: template.value,
      current_stage: "planning",
      code_complexity: "intermediate",
    })
    .select("id")
    .single();
  if (projectError || !project) throw projectError ?? new Error("Project could not be created");

  const [tasks, docs] = await Promise.all([
    supabaseAdmin.from("tasks").insert(
      template.starterTasks.map((task) => ({
        user_id: userId,
        project_id: project.id,
        title: task.title,
        stage: task.stage,
        status: "not_started",
        priority: "medium",
      })),
    ),
    supabaseAdmin.from("document_sections").insert(
      template.documentSections.map((title, position) => ({
        user_id: userId,
        project_id: project.id,
        title,
        position,
        status: "not_started",
      })),
    ),
  ]);
  if (tasks.error || docs.error) {
    await supabaseAdmin.from("projects").delete().eq("id", project.id);
    throw tasks.error ?? docs.error;
  }

  const { error: purchaseError } = await supabaseAdmin.from("project_purchases").insert({
    user_id: userId,
    catalog_project_id: catalogProjectId,
    payment_transaction_id: data.id,
    payment_customer_id: data.customerId,
    project_id: project.id,
    status: "completed",
    environment,
    amount_minor: Number(data.details?.totals?.total ?? 0),
    currency: data.currencyCode,
  });
  if (purchaseError) {
    await supabaseAdmin.from("projects").delete().eq("id", project.id);
    if (purchaseError.code !== "23505") throw purchaseError;
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const requestedEnv = new URL(request.url).searchParams.get("env");
        const environment: PaddleEnv = requestedEnv === "live" ? "live" : "sandbox";
        try {
          const event = await verifyPaymentWebhook(request, environment);
          if (event.eventType === EventName.TransactionCompleted) {
            await fulfilProjectPurchase(event.data as unknown as TransactionData, environment);
          }
          return Response.json({ received: true });
        } catch (error) {
          console.error("Payment webhook failed", error);
          return new Response("Invalid payment event", { status: 400 });
        }
      },
    },
  },
});