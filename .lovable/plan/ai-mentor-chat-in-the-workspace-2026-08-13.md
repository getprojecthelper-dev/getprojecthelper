# AI Mentor chat in the workspace

Turn the AI Mentor from a landing-page animation into a real, project-aware chat you can talk to while you build.

## What you get

- **One ongoing conversation per project**, saved in the backend so it follows you across devices.
- **A dedicated "AI Mentor" tab** in the project workspace nav.
- **A floating mentor launcher** on every project page that opens the same conversation in a side panel — no lost history between the two surfaces.
- The mentor always sees your current project: idea, domain, stage, build sections and their status, tasks, requirements, test cases and their pass/fail results, experiments and documents. So "why is my accuracy misleading?" gets an answer grounded in your actual numbers.
- Streaming replies with markdown, a typing indicator, copy on messages, and suggested starter prompts when the chat is empty ("Review my requirements", "Prep me for viva questions", "What should I do next?").
- Credits: each mentor reply is held and settled like other AI actions, shown in the live credit meter. If credits run out, you get the normal low-credit message instead of a silent failure.

## Technical approach

**Database** — one migration adding `mentor_messages` (id uuid pk, project_id, user_id, role, content jsonb parts, created_at) with GRANTs for `authenticated`/`service_role`, RLS scoping every row to `auth.uid()` and to a project the user owns. No thread table: the project is the conversation.

**Server**
- Streaming endpoint `src/routes/api/chat.ts` (TanStack server route, POST). It verifies the Supabase bearer token, checks the project belongs to the caller, builds the project context, calls the Lovable AI Gateway Responses API with `openai/gpt-5.6-sol` (same gateway/key path as `src/lib/ai.server.ts`), streams the response, and persists the user message plus the finished assistant message.
- New `src/lib/mentor-context.server.ts` — loads and compacts project + sections + tasks + requirements + test cases + experiments into a bounded system-prompt block (truncated so long projects don't blow the context).
- New `src/lib/mentor.functions.ts` — `getMentorHistory({ projectId })` and `clearMentorChat({ projectId })` server functions behind `requireSupabaseAuth`.
- Extend `src/lib/credit-costs.ts` with a `mentor_chat` action; hold before the stream, settle from reported token usage, and log to `ai_usage_events` reusing the existing helpers in `ai.server.ts` / `credits.server.ts`.

**Client**
- Install AI Elements (`conversation`, `message`, `prompt-input`, `shimmer`) and the AI SDK React client; compose the chat from those primitives rather than hand-rolled bubbles. Assistant messages render on the page surface, user messages in a `primary`/`primary-foreground` bubble.
- `src/components/mentor-chat.tsx` — shared chat surface keyed by `projectId`, seeded with history from the server, `useChat` with `DefaultChatTransport` pointing at `/api/chat`, renders `message.parts`, keeps the textarea focused.
- New route `src/routes/_authenticated.projects.$projectId.mentor.tsx` + a "AI Mentor" entry in the workspace `NAV`.
- `src/components/mentor-dock.tsx` — floating button + sheet rendered in the project layout, reusing the same `MentorChat`.
- Mentor identity uses a generated mentor mark (not a generic sparkle icon), matching the Ink & Ember palette.

**Landing page** — the existing `#mentor` animated section gets a "Try the mentor" call to action pointing into the app; the animation itself stays.
