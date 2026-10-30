import { createFileRoute } from "@tanstack/react-router";

import { getPremadeProject } from "@/lib/premade-projects";
import { EventName, verifyPaymentWebhook, type PaddleEnv } from "@/lib/paddle.server";
import { getTemplate } from "@/lib/project-domain";
import { planForPriceId } from "@/lib/plans";

/* eslint-disable @typescript-eslint/no-explicit-any */
async function upsertSubscription(data: any, environment: PaddleEnv) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const priceExternal = data.items?.[0]?.price?.importMeta?.externalId as string | undefined;
  const plan = planForPriceId(priceExternal);
  let userId = typeof data.customData?.userId === "string" ? data.customData.userId : null;
  if (!userId) {
    const { data: row } = await supabaseAdmin
      .from("subscriptions").select("user_id").eq("paddle_subscription_id", data.id).maybeSingle();
    userId = row?.user_id ?? null;
  }
  if (!userId || !plan) return;
  const unit = data.items?.[0]?.price?.unitPrice;
  await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: data.id,
      paddle_customer_id: data.customerId,
      plan: plan.id,
      price_id: priceExternal ?? null,
      status: data.status,
      amount_cents: Number(unit?.amount ?? 0),
      currency: String(unit?.currencyCode ?? "INR").toLowerCase(),
      current_period_start: data.currentBillingPeriod?.startsAt ?? null,
      current_period_end: data.currentBillingPeriod?.endsAt ?? data.canceledAt ?? null,
      cancel_at_period_end: data.scheduledChange?.action === "cancel",
      environment,
    },
    { onConflict: "paddle_subscription_id" },
  );
}

/** Each paid plan bill (first, renewal, upgrade) resets credits to the plan amount. */
async function resetPlanCredits(data: any, environment: PaddleEnv) {
  if (!data.subscriptionId) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const plan = planForPriceId(data.items?.[0]?.price?.importMeta?.externalId);
  let userId = typeof data.customData?.userId === "string" ? data.customData.userId : null;
  if (!userId) {
    const { data: row } = await supabaseAdmin
      .from("subscriptions").select("user_id").eq("paddle_subscription_id", data.subscriptionId)
      .eq("environment", environment).maybeSingle();
    userId = row?.user_id ?? null;
  }
  if (!userId || !plan) return;
  await supabaseAdmin.rpc("reset_plan_credits", {
    _user_id: userId,
    _credits: plan.credits,
    _ref: `paddle:${data.id}`,
  });
}

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
            const tx = event.data as any;
            if (tx.subscriptionId) await resetPlanCredits(tx, environment);
            else await fulfilProjectPurchase(tx as TransactionData, environment);
          } else if (
            event.eventType === EventName.SubscriptionCreated ||
            event.eventType === EventName.SubscriptionUpdated ||
            event.eventType === EventName.SubscriptionCanceled
          ) {
            await upsertSubscription(event.data, environment);
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