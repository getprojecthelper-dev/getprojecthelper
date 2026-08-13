/**
 * Project Management domain server functions.
 * Generates structured PM deliverables (schedule, RACI, WBS, budget, risks,
 * status reports) and exports a compiled PDF report.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateJson, obj, str } from "@/lib/ai.server";

const MODEL = "openai/gpt-5.6-sol";

type AnySupabase = {
  from: (t: string) => any;
  auth: { getUser: () => Promise<{ data: { user?: { id: string } | null }; error: unknown }> };
};

const projectSource = async (supabase: AnySupabase, projectId: string) => {
  const [project, sections, tasks, requirements, risks] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
    supabase.from("build_sections").select("title,question,objective,business_connection,insights,status").eq("project_id", projectId).order("position"),
    supabase.from("tasks").select("title,status,priority,due_date").eq("project_id", projectId).order("created_at"),
    supabase.from("requirements").select("code,title,description,status").eq("project_id", projectId).order("code"),
    supabase.from("risks").select("title,severity,status,mitigation").eq("project_id", projectId).order("created_at"),
  ]);
  const p = project.data as { name?: string; description?: string; idea?: string; domain?: string; deadline?: string | null } | null;
  if (!p) return null;
  const lines = [
    `PROJECT: ${p.name ?? ""}`,
    `Domain: ${p.domain ?? "n/a"}`,
    `Description: ${p.description ?? "n/a"}`,
    `Idea: ${p.idea ?? "n/a"}`,
    `Deadline: ${p.deadline ?? "none"}`,
    "",
    "BUILD SECTIONS:",
    ...(sections.data ?? []).map((s: any, i: number) => `${i + 1}. ${s.title} — ${s.objective ?? s.question ?? ""} [${s.status}]`),
    "",
    "TASKS:",
    ...(tasks.data ?? []).map((t: any) => `- [${t.status}] ${t.title}${t.due_date ? ` (due ${t.due_date})` : ""}`),
    "",
    "REQUIREMENTS:",
    ...(requirements.data ?? []).map((r: any) => `- [${r.status}] ${r.code ?? ""} ${r.title}: ${r.description ?? ""}`),
    "",
    "RISKS:",
    ...(risks.data ?? []).map((r: any) => `- [${r.severity}/${r.status}] ${r.title}: ${r.mitigation ?? ""}`),
  ];
  return lines.filter(Boolean).join("\n").slice(0, 12000);
};

const insertPmRows = async (supabase: AnySupabase, table: string, rows: Record<string, unknown>[]) => {
  if (!rows.length) return [];
  const { data, error } = await (supabase.from(table) as any).insert(rows).select("*");
  if (error) throw new Error(`Failed to save ${table}: ${error.message}`);
  return (data ?? []) as Record<string, unknown>[];
};

/* ------------------------------------------------------------------ */
/* Generate schedule / Gantt tasks                                    */
/* ------------------------------------------------------------------ */

export const generateSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as unknown as AnySupabase;
    const source = await projectSource(supabase, data.projectId);
    if (!source) throw new Error("Project not found.");

    const result = await generateJson<{
      tasks: {
        name: string;
        start_date: string;
        end_date: string;
        duration_days: number;
        dependencies: string;
        milestone: boolean;
        owner: string;
        status: string;
      }[];
    }>({
      usage: { userId: context.userId, projectId: data.projectId, feature: "pm_schedule" },
      name: "pm_schedule",
      instructions:
        "You are a project-management assistant. Build a realistic project schedule with concrete tasks, owners, start/end dates (YYYY-MM-DD), durations, dependencies and milestone flags. Tasks must be specific to the student's project. Status is one of: not_started, in_progress, completed.",
      input: source,
      schema: obj({
        tasks: {
          type: "array",
          items: obj({
            name: str,
            start_date: str,
            end_date: str,
            duration_days: { type: "number" },
            dependencies: str,
            milestone: { type: "boolean" },
            owner: str,
            status: str,
          }),
        },
      }),
    });

    const rows = (result.tasks ?? []).map((t, i) => ({
      user_id: context.userId,
      project_id: data.projectId,
      name: t.name,
      start_date: t.start_date,
      end_date: t.end_date,
      duration_days: t.duration_days,
      dependencies: t.dependencies,
      milestone: t.milestone,
      owner: t.owner,
      status: t.status,
      position: i,
    }));

    await insertPmRows(supabase, "schedule_tasks", rows);
    return { count: rows.length };
  });

/* ------------------------------------------------------------------ */
/* Generate stakeholders + RACI matrix                                */
/* ------------------------------------------------------------------ */

export const generateRaci = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as unknown as AnySupabase;
    const source = await projectSource(supabase, data.projectId);
    if (!source) throw new Error("Project not found.");

    const result = await generateJson<{
      stakeholders: { name: string; role: string; influence: string; interest: string; contact: string; notes: string }[];
      raci: { task_name: string; assignments: { stakeholder_name: string; responsibility: string }[] }[];
    }>({
      usage: { userId: context.userId, projectId: data.projectId, feature: "pm_raci" },
      name: "pm_raci",
      instructions:
        "You are a project-management assistant. Identify realistic stakeholders for this student project and produce a RACI matrix for key tasks. responsibility must be exactly R, A, C or I. Every task must have exactly one A (Accountable) and at least one R (Responsible).",
      input: source,
      schema: obj({
        stakeholders: {
          type: "array",
          items: obj({
            name: str,
            role: str,
            influence: str,
            interest: str,
            contact: str,
            notes: str,
          }),
        },
        raci: {
          type: "array",
          items: obj({
            task_name: str,
            assignments: {
              type: "array",
              items: obj({ stakeholder_name: str, responsibility: str }),
            },
          }),
        },
      }),
    });

    const stakeholderRows = (result.stakeholders ?? []).map((s) => ({
      user_id: context.userId,
      project_id: data.projectId,
      name: s.name,
      role: s.role,
      influence: s.influence,
      interest: s.interest,
      contact: s.contact,
      notes: s.notes,
    }));

    const savedStakeholders = await insertPmRows(supabase, "stakeholders", stakeholderRows);
    const byName = new Map((savedStakeholders as any[]).map((s) => [s.name, s.id]));

    const raciRows: Record<string, unknown>[] = [];
    for (const row of result.raci ?? []) {
      for (const a of row.assignments) {
        const stakeholderId = byName.get(a.stakeholder_name);
        if (!stakeholderId) continue;
        const r = a.responsibility.trim().toUpperCase();
        if (!["R", "A", "C", "I"].includes(r)) continue;
        raciRows.push({
          user_id: context.userId,
          project_id: data.projectId,
          stakeholder_id: stakeholderId,
          task_name: row.task_name,
          responsibility: r,
        });
      }
    }
    await insertPmRows(supabase, "raci_assignments", raciRows);
    return { stakeholders: stakeholderRows.length, raci: raciRows.length };
  });

/* ------------------------------------------------------------------ */
/* Generate WBS                                                       */
/* ------------------------------------------------------------------ */

export const generateWbs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as unknown as AnySupabase;
    const source = await projectSource(supabase, data.projectId);
    if (!source) throw new Error("Project not found.");

    const result = await generateJson<{
      items: { code: string; name: string; description: string; owner: string; status: string }[];
    }>({
      usage: { userId: context.userId, projectId: data.projectId, feature: "pm_raci" },
      name: "pm_wbs",
      instructions:
        "You are a project-management assistant. Build a work breakdown structure for this student project. Each item has a hierarchical code like 1, 1.1, 1.1.1, a clear deliverable name, owner and status (not_started, in_progress, completed).",
      input: source,
      schema: obj({
        items: {
          type: "array",
          items: obj({ code: str, name: str, description: str, owner: str, status: str }),
        },
      }),
    });

    const rows = (result.items ?? []).map((item, i) => ({
      user_id: context.userId,
      project_id: data.projectId,
      code: item.code,
      name: item.name,
      description: item.description,
      owner: item.owner,
      status: item.status,
      position: i,
    }));
    await insertPmRows(supabase, "wbs_items", rows);
    return { count: rows.length };
  });

/* ------------------------------------------------------------------ */
/* Generate budget lines                                              */
/* ------------------------------------------------------------------ */

export const generateBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as unknown as AnySupabase;
    const source = await projectSource(supabase, data.projectId);
    if (!source) throw new Error("Project not found.");

    const result = await generateJson<{
      lines: { category: string; item_name: string; planned: number; actual: number; notes: string }[];
    }>({
      usage: { userId: context.userId, projectId: data.projectId, feature: "pm_budget" },
      name: "pm_budget",
      instructions:
        "You are a project-management assistant. Estimate a realistic budget for this student project. Categories could include hardware, software, travel, materials, labour, contingency. Provide planned and actual spend (actual can be 0 if not spent yet).",
      input: source,
      schema: obj({
        lines: {
          type: "array",
          items: obj({
            category: str,
            item_name: str,
            planned: { type: "number" },
            actual: { type: "number" },
            notes: str,
          }),
        },
      }),
    });

    const rows = (result.lines ?? []).map((line) => ({
      user_id: context.userId,
      project_id: data.projectId,
      category: line.category,
      item_name: line.item_name,
      planned: line.planned,
      actual: line.actual,
      notes: line.notes,
    }));
    await insertPmRows(supabase, "budget_lines", rows);
    return { count: rows.length };
  });

/* ------------------------------------------------------------------ */
/* Generate / refresh risk register with heatmap data                 */
/* ------------------------------------------------------------------ */

export const generateRisks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as unknown as AnySupabase;
    const source = await projectSource(supabase, data.projectId);
    if (!source) throw new Error("Project not found.");

    const result = await generateJson<{
      risks: { title: string; description: string; likelihood: string; impact: string; severity: string; mitigation: string }[];
    }>({
      usage: { userId: context.userId, projectId: data.projectId, feature: "pm_risks" },
      name: "pm_risks",
      instructions:
        "You are a project-management assistant. Identify realistic risks for this student project. likelihood and impact are one of: low, medium, high. severity is one of: low, medium, high. Provide a concrete mitigation for each risk.",
      input: source,
      schema: obj({
        risks: {
          type: "array",
          items: obj({
            title: str,
            description: str,
            likelihood: str,
            impact: str,
            severity: str,
            mitigation: str,
          }),
        },
      }),
    });

    const rows = (result.risks ?? []).map((r) => ({
      user_id: context.userId,
      project_id: data.projectId,
      title: r.title,
      description: r.description,
      likelihood: r.likelihood,
      impact: r.impact,
      severity: r.severity,
      status: "open",
      mitigation: r.mitigation,
    }));
    await insertPmRows(supabase, "risks", rows);
    return { count: rows.length };
  });

/* ------------------------------------------------------------------ */
/* Generate status report                                             */
/* ------------------------------------------------------------------ */

export interface StatusReportResult {
  id: string;
  project_id: string;
  user_id: string;
  period: string;
  overall_status: string;
  accomplishments: string;
  blockers: string;
  next_steps: string;
  risks_snapshot: string;
  schedule_snapshot: string;
  budget_snapshot: string;
  created_at: string;
  updated_at: string;
}

export const generateStatusReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid(), period: z.string().trim().min(1) }).parse(input))
  .handler(async ({ data, context }): Promise<StatusReportResult> => {
    const supabase = context.supabase as unknown as AnySupabase;
    const source = await projectSource(supabase, data.projectId);
    if (!source) throw new Error("Project not found.");

    const [schedule, budget, risks] = await Promise.all([
      supabase.from("schedule_tasks").select("name,status,start_date,end_date").eq("project_id", data.projectId).order("position"),
      supabase.from("budget_lines").select("category,planned,actual").eq("project_id", data.projectId),
      supabase.from("risks").select("title,severity,status,mitigation").eq("project_id", data.projectId),
    ]);

    const snapshot = [
      "SCHEDULE:",
      ...(schedule.data ?? []).map((t: any) => `- ${t.name} [${t.status}] ${t.start_date ?? ""} → ${t.end_date ?? ""}`),
      "",
      "BUDGET:",
      ...(budget.data ?? []).map((b: any) => `- ${b.category}: planned ${b.planned}, actual ${b.actual}`),
      "",
      "RISKS:",
      ...(risks.data ?? []).map((r: any) => `- [${r.severity}/${r.status}] ${r.title}: ${r.mitigation ?? ""}`),
    ].join("\n");

    const result = await generateJson<{
      overall_status: string;
      accomplishments: string;
      blockers: string;
      next_steps: string;
      risks_snapshot: string;
      schedule_snapshot: string;
      budget_snapshot: string;
    }>({
      usage: { userId: context.userId, projectId: data.projectId, feature: "pm_status_report" },
      name: "pm_status_report",
      instructions:
        "You are a project-management assistant. Write a concise status report for the period given. overall_status is one of: green, amber, red. Provide plain-text summaries for accomplishments, blockers, next steps, and snapshot summaries of risks, schedule and budget.",
      input: `Period: ${data.period}\n\n${source}\n\nCURRENT DATA:\n${snapshot}`,
      schema: obj({
        overall_status: str,
        accomplishments: str,
        blockers: str,
        next_steps: str,
        risks_snapshot: str,
        schedule_snapshot: str,
        budget_snapshot: str,
      }),
    });

    const row = {
      user_id: context.userId,
      project_id: data.projectId,
      period: data.period,
      overall_status: result.overall_status,
      accomplishments: result.accomplishments,
      blockers: result.blockers,
      next_steps: result.next_steps,
      risks_snapshot: result.risks_snapshot,
      schedule_snapshot: result.schedule_snapshot,
      budget_snapshot: result.budget_snapshot,
    };
    const saved = await insertPmRows(supabase, "status_reports", [row]);
    return (saved[0] ?? row) as StatusReportResult;
  });

/* ------------------------------------------------------------------ */
/* Delete generated PM data                                           */
/* ------------------------------------------------------------------ */

export const clearPmData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as unknown as AnySupabase;
    const tables = ["status_reports", "budget_lines", "schedule_tasks", "wbs_items", "raci_assignments", "stakeholders"];
    for (const table of tables) {
      const { error } = await (supabase.from(table) as any).delete().eq("project_id", data.projectId);
      if (error) console.error(`clear ${table} failed`, error);
    }
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Export project report as PDF                                       */
/* ------------------------------------------------------------------ */

export const exportProjectReportPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as unknown as AnySupabase;
    const { projectId } = data;
    const [
      project,
      sections,
      tasks,
      requirements,
      schedule,
      budget,
      risks,
      stakeholders,
      statusReports,
    ] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
      supabase.from("build_sections").select("title,objective,status").eq("project_id", projectId).order("position"),
      supabase.from("tasks").select("title,status,due_date").eq("project_id", projectId).order("created_at"),
      supabase.from("requirements").select("code,title,status").eq("project_id", projectId).order("code"),
      supabase.from("schedule_tasks").select("name,start_date,end_date,status").eq("project_id", projectId).order("position"),
      supabase.from("budget_lines").select("category,item_name,planned,actual").eq("project_id", projectId),
      supabase.from("risks").select("title,severity,status,mitigation").eq("project_id", projectId),
      supabase.from("stakeholders").select("name,role,influence,interest").eq("project_id", projectId),
      supabase.from("status_reports").select("period,overall_status,accomplishments,blockers,next_steps").eq("project_id", projectId).order("created_at", { ascending: false }),
    ]);

    const p = project.data as { name?: string; description?: string; idea?: string; domain?: string; deadline?: string | null } | null;
    if (!p) throw new Error("Project not found.");

    const pdfMake = (await import("pdfmake/build/pdfmake")).default;
    const vfs = await import("pdfmake/build/vfs_fonts");
    (pdfMake as any).vfs = (vfs as any).pdfMake?.vfs ?? (vfs as any).default?.vfs ?? (vfs as any);

    const rows = (data: unknown[] | null, map: (row: any) => any[]) => (data ?? []).map(map);

    const dd = {
      content: [
        { text: p.name ?? "Project Report", style: "header" },
        { text: `${p.domain ?? "Project"} · ${p.deadline ? `Deadline: ${p.deadline}` : "No deadline"}`, style: "subheader" },
        { text: p.description ?? p.idea ?? "", margin: [0, 0, 0, 12] },
        { text: "Implementation Steps", style: "sectionHeader" },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*", "auto"],
            body: [
              ["Step", "Objective", "Status"],
              ...rows(sections.data, (s: any) => [s.title, s.objective ?? "", s.status]),
            ],
          },
          margin: [0, 0, 0, 12],
        },
        { text: "Schedule", style: "sectionHeader" },
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto", "auto"],
            body: [
              ["Task", "Start", "End", "Status"],
              ...rows(schedule.data, (t: any) => [t.name, t.start_date ?? "", t.end_date ?? "", t.status]),
            ],
          },
          margin: [0, 0, 0, 12],
        },
        { text: "Budget", style: "sectionHeader" },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*", "auto", "auto"],
            body: [
              ["Category", "Item", "Planned", "Actual"],
              ...rows(budget.data, (b: any) => [b.category, b.item_name ?? "", String(b.planned), String(b.actual)]),
            ],
          },
          margin: [0, 0, 0, 12],
        },
        { text: "Risk Register", style: "sectionHeader" },
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto", "*"],
            body: [
              ["Risk", "Severity", "Status", "Mitigation"],
              ...rows(risks.data, (r: any) => [r.title, r.severity, r.status, r.mitigation ?? ""]),
            ],
          },
          margin: [0, 0, 0, 12],
        },
        { text: "Stakeholders", style: "sectionHeader" },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*", "auto", "auto"],
            body: [
              ["Name", "Role", "Influence", "Interest"],
              ...rows(stakeholders.data, (s: any) => [s.name, s.role ?? "", s.influence ?? "", s.interest ?? ""]),
            ],
          },
          margin: [0, 0, 0, 12],
        },
        { text: "Latest Status Report", style: "sectionHeader" },
        ...(statusReports.data ?? []).slice(0, 1).map((r: any) => ({
          stack: [
            { text: `Period: ${r.period} · Status: ${r.overall_status}`, style: "subheader" },
            { text: `Accomplishments: ${r.accomplishments ?? ""}` },
            { text: `Blockers: ${r.blockers ?? ""}` },
            { text: `Next steps: ${r.next_steps ?? ""}`, margin: [0, 0, 0, 12] },
          ],
        })),
      ],
      styles: {
        header: { fontSize: 22, bold: true, margin: [0, 0, 0, 6] },
        subheader: { fontSize: 12, italics: true, margin: [0, 0, 0, 8] },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 6] },
      },
      defaultStyle: { font: "Roboto" },
    };

    const pdf = pdfMake.createPdf(dd as any);
    const base64 = await new Promise<string>((resolve, reject) => {
      (pdf as any).getBase64((data: string) => {
        if (data) resolve(data);
        else reject(new Error("PDF generation failed"));
      });
    });

    await (
      await import("@/integrations/supabase/client.server")
    ).supabaseAdmin.from("ai_usage_events").insert({
      user_id: context.userId,
      project_id: projectId,
      feature: "pm_report_pdf",
      model: MODEL,
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      credits: 0,
    });

    return { pdfBase64: base64, filename: `${(p.name ?? "project").replace(/\s+/g, "_").toLowerCase()}_report.pdf` };
  });
