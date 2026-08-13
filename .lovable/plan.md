# Pricing that puts Project Helper in profit

## The short answer

Keep credit packs, raise the floor slightly, and add an India price list. Target price is **about $0.028–0.030 per credit in USD** and **about ₹0.90–1.10 per credit in INR**. That leaves roughly 85–90% gross margin even in the worst case where every run uses the expensive model.

### Where the numbers come from (measured, not guessed)

From live usage in this app: 14 AI runs, 66,630 tokens, 66.63 credits — so 1 credit ≈ 1,000 tokens, and the blended provider cost is **$0.002 per credit**. Worst case (all Pro-model traffic) it is $0.005 per credit.

| Item | Credits | Our AI cost | Worst-case cost |
|---|---|---|---|
| One AI run (avg) | ~4.8 | $0.010 | $0.024 |
| One full project (idea → viva) | ~130 | $0.26 | $0.65 |
| Free welcome grant per signup | 50 | $0.10 | $0.25 |

Two costs the current packs ignore:
- **Payment fees.** ~2.9% + $0.30 per charge. On the $5 Starter that is $0.45, i.e. 9% of revenue — the smallest pack must not go below $5.
- **Free-credit burn from people who never pay.** At a 5% conversion rate, each paying user carries ~19 free users, or about **$1.90–$4.75** of giveaway cost. This is the real reason the app is not profitable today, not the AI cost.

**Break-even per paying user is therefore ≈ $2.70** (own AI cost + fees + their share of free-tier burn). Any pack at $5 or above is comfortably profitable; the risk is only in volume and conversion.

## Recommended price list

### USD (global)

| Pack | Credits | Price | Per credit | AI cost | Gross margin |
|---|---|---|---|---|---|
| Starter | 150 | $5 | $0.033 | $0.30 | ~85% after fees |
| Builder (popular) | 500 | $14 | $0.028 | $1.00 | ~89% after fees |
| Semester | 1,200 | $29 | $0.024 | $2.40 | ~90% after fees |

Changes vs today: Starter drops 200 → 150 credits (still ~1 project's worth of steps), Builder $12 → $14 for 500, Semester $20 → $29 for 1,200. Today's Semester pack sells credits at $0.017 each, which is the thinnest tier and the one people buy to farm cheap credits.

### INR (India / South Asia)

| Pack | Credits | Price | Per credit |
|---|---|---|---|
| Starter | 150 | ₹149 | ₹0.99 |
| Builder (popular) | 500 | ₹399 | ₹0.80 |
| Semester | 1,200 | ₹899 | ₹0.75 |

That is roughly 35–40% of the USD price, which is the standard student-market discount. ₹149 ≈ $1.75 still clears the ~$0.35 of fees + $0.30 of AI cost per Starter buyer, so every regional sale is profitable on its own — it just carries less of the free-tier burn, which is fine because free-tier cost scales with signups, not with region.

### Free tier stays at 50 credits

Kept as requested. To keep the burn honest, the plan adds a "free credits spent" line to the admin economics panel and a soft conversion nudge: when a student's free balance drops under 15, the existing low-credit banner also surfaces the cheapest local pack.

## What gets built

1. **Regional pricing config** — one source of truth listing each pack in USD and INR, plus per-credit price and a `region` resolver.
2. **Region detection** — pick INR when the browser locale/timezone is India (and let the user switch currency manually; the choice sticks).
3. **Public pricing page** at `/pricing`, linked from the landing nav: three pack cards, currency toggle, "what 500 credits gets you" breakdown in plain terms (≈ 1 full project, ≈ 40 AI steps), and the free-tier callout.
4. **Credits page update** — show the same packs in the user's currency instead of the current static list.
5. **Admin: profitability calculator** — inputs for signups/month, conversion %, and pack mix; outputs monthly revenue, AI cost, free-credit burn, payment fees, and net profit, so you can see what conversion rate you need at these prices. Sits next to the unit-economics panel.
6. **Admin panel additions** — payment-fee and free-burn lines added to the existing margin figures so reported margin is net, not gross.

Checkout itself is **not** part of this plan — the packs stay display-only until a payment provider is enabled. Say the word and I'll set that up as a follow-up.

## Technical notes

- New `src/lib/pricing.ts`: `CURRENCIES`, `PACKS` (credits + `priceUsd` + `priceInr`), `formatMoney(amount, currency)`, `perCreditPrice(pack, currency)`. `CREDIT_PACKS` in `src/lib/credit-costs.ts` re-exports from it so nothing breaks.
- `src/lib/economics.ts` gains `PAYMENT_FEE_PCT` (0.029) and `PAYMENT_FEE_FIXED_USD` (0.30); `packEconomics()` returns net margin after fees.
- `src/lib/economics.server.ts` gains `freeCreditBurnUsd` already present, plus `paymentFeesUsd` and `netMarginUsd` in `computeUnitEconomics`.
- New `src/hooks/use-currency.tsx` (localStorage + `Intl.DateTimeFormat().resolvedOptions().timeZone` for the India default), new `src/routes/pricing.tsx` with its own `head()` metadata, new `src/components/admin-profit-calculator.tsx`.
- `/pricing` gets added to `src/routes/sitemap[.]xml.ts`.
