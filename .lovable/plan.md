# Are we profitable? Short answer: not yet — there is no revenue at all

Checked the live data:

- 2 registered accounts, 0 active subscriptions, $0 recorded revenue
- 150 credits handed out (welcome grants) + 50 redeemed from a code — all free
- 14 AI runs, 66,630 tokens, 66.63 credits consumed

Every credit in circulation was given away, and credit packs exist in code
(`CREDIT_PACKS`: $5/200, $12/550, $20/1200) but checkout is not wired up — the
credits page literally says checkout is not enabled. So current margin is
negative by exactly the model cost of those 66,630 tokens.

## What to build

### 1. Unit-economics panel in the admin dashboard

New metrics computed server-side (admin only), for a selectable window (7d / 30d / all time):

- Revenue: sum of paid credit purchases + active subscription MRR
- AI cost: tokens consumed, converted to USD with a configurable per-1K-token rate
- Gross margin: revenue − AI cost, plus margin %
- Free-credit burn: cost of tokens spent from granted/redeemed credits (the giveaway line item)
- Effective price per credit sold vs. average cost per credit consumed
- Per-user view: top consumers, average credits used per active user, cost per signup

### 2. Cost model config

A single shared module with the AI cost assumption (USD per 1K tokens, per model)
and the pack prices, so the dashboard's "profit" number can be tuned without
touching queries. Break-even per pack shown next to each price.

### 3. Make revenue possible

Right now nothing can be sold, so profitability is structurally impossible.
Add checkout for the three credit packs (Stripe or Paddle, chosen via the
payment-provider recommendation), recording each purchase as a `purchase`
credit transaction so the revenue query above has real input.

## Technical notes

- Extend `src/lib/admin.functions.ts` with a `getUnitEconomics` server fn:
  aggregates `ai_usage_events` (tokens, credits), `credit_transactions`
  (kind = purchase / grant / redeem / spend), and `subscriptions`. Keep the
  existing `forbidden` flag pattern rather than throwing.
- Add `src/lib/economics.ts` with the cost constants and margin helpers, shared
  by the server fn and the UI so both agree on the maths.
- Render a new `src/components/admin-economics.tsx` card grid + a simple
  revenue-vs-cost bar per week, mounted in `src/routes/_authenticated.admin.tsx`.
- Checkout is a separate step: it needs a payment provider connected and a
  webhook route under `src/routes/api/public/` that credits the buyer.

## Suggested order

1. Cost model + unit-economics panel (answers "are we profitable" continuously)
2. Payment provider + pack checkout (makes the answer capable of being "yes")
