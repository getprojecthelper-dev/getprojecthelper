<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Scope authentication-specific pine/coral tokens to `.auth-stage` in `src/styles.css` so account-page styling cannot alter the shared workspace theme.
- Persist website availability in a singleton public-readable setting with admin-only RLS writes and an authenticated, role-checked server function; the shared maintenance gate polls it and preserves login/recovery and admin access. This replaces hardcoded maintenance without treating the presentation gate as data authorization.
- Workspace Back uses router-tracked browser history and falls back to Welcome on direct entry; disable it at the history root on Welcome to avoid no-op clicks and navigation outside the app.
- Use Bun and `bun.lock` as the sole dependency lockfile; a stale npm lockfile can install a different, incomplete dependency graph.
- Subscription plans live in `src/lib/plans.ts`; each paid plan bill resets the credit balance via the `reset_plan_credits` DB function, and a DB trigger enforces active-project limits so every creation path is covered.
