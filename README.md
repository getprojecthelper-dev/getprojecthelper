# Project Helper

Project Helper is an AI-assisted, project-centred workspace for students. It guides a project from an initial idea through planning, research, build, testing, documentation, review, and showcase.

The product is intentionally not a generic task manager with a chatbot. Every workspace feature should help answer three questions:

1. Where am I in my project?
2. How am I doing?
3. What should I do next?

Live site: <https://www.getprojecthelper.com>

## Product scope

Students can create and manage projects across domains such as software development, data science, research, business, cybersecurity, cloud, engineering, and custom projects. The product includes:

- A guided project lifecycle and project workspace
- Plans, requirements, tasks, research, build support, testing, documents, review, presentation, and showcase areas
- A project-aware AI mentor
- Documentation and portfolio-oriented project outputs
- Credits and subscription plans for AI usage
- An admin area for operational and availability controls

When adding a feature, keep it connected to a specific project and its lifecycle. Do not add placeholder interactions or make unsupported claims about generated results, citations, metrics, or progress.

## Tech stack

- React 19 with TanStack Start and TanStack Router
- TypeScript
- Tailwind CSS v4 and Radix-based UI primitives
- Drizzle ORM and Postgres-backed Lovable Cloud services
- OpenAI-powered server-side AI features
- Paddle subscriptions
- Bun for package management and scripts

## Quick start

### Prerequisites

- [Bun](https://bun.sh/) installed
- Environment variables configured locally (copy an existing development environment file only through the team’s approved secret-sharing process)

### Run locally

```sh
bun install
bun run dev
```

Useful commands:

```sh
bun run lint
bun run build
bun run format
```

Use `bun.lock` as the only dependency lockfile. Do not introduce `package-lock.json`, `npm install`, or another package manager lockfile.

## Repository map

```text
src/
  routes/           File-based application routes
  components/       Product and shared interface components
  components/ui/    Reusable UI primitives
  lib/              Domain logic, server functions, data access, and utilities
  hooks/            Shared React hooks
  styles.css        Design tokens and global styling
drizzle/
  schema.ts         Application database schema
  migrations/       Drizzle migrations
supabase/
  migrations/       Cloud database migrations and policies
```

Route files describe product surfaces; keep durable business logic in `src/lib` and reusable presentation in `src/components`. Prefer extending existing components and patterns over creating page-specific duplicates.

## Architecture and security

### Project data

- Projects and all project-related data must be owned and authorised server-side.
- UI checks improve the experience; they never replace database or server-side authorisation.
- Add new persistence through the schema and a migration. Avoid client-only state for durable project records.

### AI features

- AI requests run through server-side helpers in `src/lib`.
- Preserve the project context that makes suggestions relevant.
- Require confirmation before an AI action writes or substantially changes project data.
- Never invent outcomes, citations, project metrics, or user data. Clearly state when information is unavailable.

### Credits and subscriptions

- Subscription plans are defined in `src/lib/plans.ts`.
- Credit holds and settlement must reflect actual usage.
- Each paid plan bill resets the credit balance through the `reset_plan_credits` database function.
- Active-project limits are enforced by a database trigger, so every creation path is protected.

### Website availability

Website availability is a singleton setting that is publicly readable but writable only by administrators through an authenticated, role-checked server function. The maintenance gate is a presentation guard—not a substitute for data authorisation—and must preserve authentication, password recovery, and admin access.

## Interface conventions

The visual system is defined in `src/styles.css` and uses semantic tokens. Keep components on those tokens rather than adding raw colours ad hoc.

- Workspace: dark studio surfaces with violet and blue accents
- Marketing: a separately styled public experience
- Authentication: account-specific pine/coral tokens must remain scoped under `.auth-stage`; they must not affect the shared workspace theme
- Reuse `src/components/ui` primitives for controls, feedback, overlays, and inputs
- Use accessible labels, visible focus states, responsive layouts, and meaningful loading, empty, error, and success states
- Use Material Symbols or the existing icon system; avoid emoji-as-icon UI

## Navigation

Workspace Back follows router-tracked in-app history. For direct entry with no history target, it falls back to Welcome. It is disabled on Welcome, preventing a no-op click or navigation outside the app. Preserve this behaviour when changing routes or shell navigation.

## Database changes

The project contains both Drizzle and Supabase/Lovable migration history. Before altering data models:

1. Inspect `drizzle/schema.ts` and relevant existing migrations.
2. Add a forward-only migration appropriate to the affected migration system.
3. Add or update server-side ownership and role checks.
4. Verify that the user-facing feature handles loading, empty, error, and success states.

Never rewrite published Git history. This project is connected to Lovable, so force pushes, rebases, amended commits, and squashed already-pushed commits can break the synced history. Keep commits working and forward-moving.

## Development checklist

Before handing off a change:

1. Confirm the feature supports the project lifecycle rather than a generic dashboard pattern.
2. Keep business logic out of route rendering where practical.
3. Verify ownership, roles, and server-side protection for new data or actions.
4. Use existing design tokens and UI primitives.
5. Run the relevant checks, at minimum `bun run lint` for code changes and `bun run build` for route/build-impacting changes.
6. Do not commit secrets or expose server credentials to the client.

## Product direction

The MVP prioritises authentication, project creation and templates, the project dashboard, tasks, requirements, project progress, research and document management, testing, the AI mentor, documentation tracking, review, and showcase.

Advanced automation, complex multi-agent systems, full ML training, deep integrations, marketplace expansion, and collaboration should be designed for future growth—but not simulated or prematurely built.
