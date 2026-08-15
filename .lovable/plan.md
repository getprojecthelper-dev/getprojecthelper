# Adjust AI credit prices to $0.90 per credit (USD)

## Goal
Move the global USD anchor price to roughly **$0.90 per credit**, then re-derive all regional currencies from that new anchor.

## New price list

| Pack | Credits | New USD price | Per credit |
|---|---|---|---|
| Starter | 150 | $135 | $0.90 |
| Builder | 500 | $450 | $0.90 |
| Semester | 1,200 | $1,080 | $0.90 |

At this price one average project (~130 credits) costs a student about **$117**.

## Files to change

1. `src/lib/pricing.ts`
   - Update `PACKS` so each pack's `priceUsd` equals `credits * 0.90`.
   - Keep the PPP/fx derivation logic unchanged; regional prices will auto-recalculate from the new USD anchor.

2. `src/lib/economics.ts`
   - No logic change required, but verify `packEconomics()` still reports positive margins.
   - Optionally add a comment noting the new price anchor.

3. `src/routes/pricing.tsx`
   - Meta tags currently hard-code "$5 / ₹149"; update to the new cheapest-pack price.
   - FAQ text mentions "from $5 or ₹149"; update to the new Starter prices.

4. `src/routes/_authenticated.credits.tsx`
   - Any static price copy (e.g. "from $5") must be updated to the new Starter price.

5. `src/components/admin-economics.tsx` and `src/components/admin-profit-calculator.tsx`
   - Confirm they read prices from `PACKS` dynamically; if any hard-coded values exist, update them.

## What stays the same

- 50-credit free signup grant.
- Currency detection and regional PPP multipliers.
- Pack sizes (150 / 500 / 1,200 credits).
- "Most popular" badge on Builder.

## Risk note

Measured AI cost is ~$0.002 per credit (worst case $0.005). At $0.90/credit gross margin is ~99%, but the student-market conversion risk is high. The previous plan recommended $0.028–$0.033/credit for global markets.
