# Project Management domain expansion

## Goal
Turn the existing `project_management` domain from a prompt-only wrapper into a full, structured student workspace. Add interactive PM deliverables (schedule, RACI, risk heatmap, budget), PM-specific document templates with PDF export, and a PM-coach AI Mentor persona.

## What we are building

### 1. Structured PM data layer
New tables in a single migration (with GRANTs, RLS, and policies):
- `stakeholders` — name, role, influence, interest, contact, notes.
- `raci_assignments` — task/deliverable × stakeholder × responsibility (R/A/C/I).
- `wbs_items` — WBS code, name, parent, description, owner, status.
- `schedule_tasks` — name, start/end dates, duration, dependencies, milestone flag, status, owner.
- `budget_lines` — category, planned, actual, variance, notes.
- `status_reports` — period, overall_status, accomplishments, blockers, next_steps, risks_snapshot.

These tables are scoped to `project_id` and follow the same RLS pattern as `tasks`/`risks`.

### 2. Interactive PM workspace routes
New routes under `/projects/$projectId/`:
- `schedule.tsx` — Gantt-style timeline built from `schedule_tasks` (custom SVG or Recharts bar chart), with AI "Generate schedule" button.
- `stakeholders.tsx` — Editable RACI matrix + stakeholder list. AI "Suggest stakeholders & RACI" button.
- `budget.tsx` — Budget table, burn-down chart, variance alerts. AI "Generate budget" button.
- `risks.tsx` — Existing `risks` table enhanced with a likelihood × impact heatmap and mitigation status.

Each route reuses the existing `PageHeader`, `CreditMeter`/`withMeter`, and AI server functions.

### 3. PM-aware AI generation server functions
Add to `src/lib/builder.functions.ts` (or a new `src/lib/pm.functions.ts`):
- `generateSchedule(projectId)` — drafts `schedule_tasks` rows from project plan.
- `generateRaci(projectId)` — drafts `stakeholders` + `raci_assignments` from WBS/tasks.
- `generateBudget(projectId)` — drafts `budget_lines` from schedule/resources.
- `generateRiskHeatmap(projectId)` — drafts/enriches `risks` with likelihood/impact/mitigation.
- `generateStatusReport(projectId)` — creates a `status_reports` row + prose summary.

All functions use the PM playbook context, run through the credit meter, and settle token-based usage.

### 4. Health & progress updates for PM
Update `src/lib/project-domain.ts`:
- Extend `ProjectSignals` with `scheduleTasks`, `budgetLines`, `statusReports`.
- Add PM-specific health factors: schedule variance (late tasks vs baseline), budget variance (actual > planned), and missing status report.
- Add progress weighting for schedule completion and budget review.

### 5. PM document templates & PDF export
Update `src/lib/doc-templates.ts`:
- Add DocTypes: `project_charter`, `status_report`, `closure_report`.
- Each has formats like "University report", "Concise memo", "PMI-style".

Update `src/routes/_authenticated.projects.$projectId.documents.tsx`:
- Show PM templates when project domain is `project_management`.
- Pre-fill authors, title, and structured data from `stakeholders`/`schedule_tasks`/`budget_lines`/`risks`.

Add PDF export:
- New server function `exportDocumentPdf(documentId)` using `pdfmake` (pure JS, edge-safe) to render the generated document as a polished PDF.
- Add a "Download PDF" button in the document viewer.
- Add `pdf_export` credit hold.

### 6. PM-coach AI Mentor
Update `src/routes/_authenticated.projects.$projectId.mentor.tsx` and `src/components/mentor-chat.tsx`:
- When the active project domain is `project_management`, append a PM coach system prompt to the streaming API call.
- The persona answers as a project manager, references scope/schedule/budget/risk/communication, and helps defend deliverables in a viva.
- No separate route; it is a mode inside the existing mentor thread.

### 7. Credit pricing
Update `src/lib/credit-costs.ts`:
- `pm_schedule: 5`
- `pm_raci: 5`
- `pm_budget: 5`
- `pm_risk_heatmap: 4`
- `pm_status_report: 6`
- `pdf_export: 3`

## Out of scope (per your answers)
- Team collaboration / multi-user assignees.
- PowerPoint, Word, or public share links (only PDF export).

## Technical notes
- Keep using `createServerFn` from `@tanstack/react-start` for all AI and data mutations.
- Keep using the existing `withMeter` wrapper so every AI action respects credit holds and settlement.
- Use Shadcn/UI components for tables, forms, and dialogs; use Recharts or custom SVG for Gantt/burn-down visuals.
- PDF generation must use a pure-JS library (`pdfmake`) because the backend runs in a Cloudflare Worker-compatible runtime.
- All new tables get GRANTs and RLS policies exactly like the existing `tasks`/`risks` tables.

## Success criteria
- A PM student can generate a schedule, RACI matrix, budget, and risk heatmap from the project plan.
- Those deliverables are editable, persisted, and feed into project health/progress.
- The student can create a PM-specific document (charter/status/closure) and export it as PDF.
- The AI Mentor gives PM-specific coaching when the project domain is Project Management.
