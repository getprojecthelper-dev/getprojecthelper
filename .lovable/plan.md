# AI Credit System with Referral Codes

Users get a small free starter balance. After that, they need credits to run any AI action. Credits come from redeem/referral codes that you create in the admin dashboard. Card payments come later — the same balance ledger will plug straight into checkout.

## How it works for a student

1. On signup they receive a free starter balance (50 credits).
2. Every AI action (idea suggestions, dataset finding, section planning, section generation, review, fixes) costs credits.
3. The header and the project pages show the remaining balance.
4. When the balance is too low, the AI button is blocked and a panel appears: "Out of credits — enter a code".
5. They paste a code on a Credits page and the credits land instantly. Each code can be limited to one use per user and to a total number of uses.

## How it works for you (admin)

New "Credits" section in the admin dashboard:
- Create a code: value (50 / 100 / custom), max total redemptions, optional expiry, optional label.
- Codes list with used/remaining counts and an enable/disable switch.
- Manually grant or deduct credits for any user (support cases).
- Existing usage charts stay; a new panel shows credits granted vs. credits consumed.

## Pricing recommendation

Cost basis today: 1 credit = 1,000 AI tokens, and a typical section generation run uses roughly 6,000–15,000 tokens (~6–15 credits). A student finishing one full project consumes roughly 120–250 credits.

Recommended packs (for when payments are wired up):

| Pack | Credits | Price | Per credit |
| --- | --- | --- | --- |
| Starter | 50 | free | — |
| Boost | 250 | $5 | $0.020 |
| Project | 600 | $10 | $0.017 |
| Semester | 1,500 | $20 | $0.013 |

That keeps a healthy margin over model cost at student-friendly entry prices. Referral codes will typically be worth 50 or 100 credits, so a referral is a real but bounded giveaway.

Action costs charged to the user (flat, deducted before the call, reconciled to real tokens after):

| Action | Cost |
| --- | --- |
| Idea suggestions | 2 |
| Dataset search | 2 |
| Plan the project steps | 5 |
| Generate a step | 8 |
| Fix my code | 4 |

## Technical section

Database (one migration):
- `credit_balances` — user_id (PK), balance numeric, lifetime_granted, lifetime_spent. Owner-read only; writes via service role.
- `credit_transactions` — user_id, delta, kind (`starter` | `redeem` | `spend` | `admin_adjust` | `purchase`), reason, ref_id. Owner-read only.
- `referral_codes` — code (unique, uppercase), credits, max_redemptions, redemption_count, expires_at, is_active, created_by, label. Admin-only via `has_role`.
- `code_redemptions` — code_id + user_id unique, prevents double redeeming.
- `redeem_referral_code(_code text)` — SECURITY DEFINER function: validates active/expiry/limits/not-already-used, inserts redemption, credits the balance, writes a transaction, returns credits granted.
- `spend_credits(_user_id uuid, _amount numeric, _feature text)` — SECURITY DEFINER, atomic decrement that fails when balance is short.
- `handle_new_user` extended to seed 50 starter credits + a `starter` transaction.
- GRANTs for each new table, plus RLS as described.

Server:
- `src/lib/credits.functions.ts` — `getMyCredits`, `redeemCode` (auth middleware), both user-facing.
- `src/lib/credits.server.ts` — `chargeCredits(userId, feature)` called at the top of every AI server function in `builder.functions.ts`; throws a friendly "not enough credits" error that the UI catches.
- Cost table lives in one shared constant so pricing changes are a one-line edit.
- `admin.functions.ts` gains `listReferralCodes`, `createReferralCode`, `toggleReferralCode`, `adjustUserCredits` — all behind the existing `has_role('admin')` check, all using the service-role client.

UI:
- `src/routes/_authenticated.credits.tsx` — balance, redeem-code form, transaction history, preview of the paid packs (marked "coming soon").
- Balance chip in the dashboard/workspace header linking to the credits page.
- Out-of-credits state on AI buttons in the builder and build pages instead of a raw error toast.
- Admin dashboard: "Referral codes" card with create form and codes table, plus a manual credit adjustment form.

Payments are intentionally out of scope for this change; the pack table above is displayed as pricing only.
