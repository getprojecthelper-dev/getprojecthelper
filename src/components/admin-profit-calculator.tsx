import { Calculator } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STARTER_CREDITS } from "@/lib/credit-costs";
import { USD_PER_1K_TOKENS, paymentFeeUsd, usd } from "@/lib/economics";
import { PACKS } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/** Credits a paying student is assumed to burn from a pack they bought. */
const CONSUMPTION_RATE = 0.85;

/**
 * "What conversion rate do I need?" — models a month at the published prices
 * so pricing changes can be sanity-checked before they ship.
 */
export function AdminProfitCalculator() {
  const [signups, setSignups] = useState(500);
  const [conversion, setConversion] = useState(5);
  const [packId, setPackId] = useState(PACKS.find((p) => p.popular)?.id ?? PACKS[0]!.id);

  const pack = PACKS.find((p) => p.id === packId) ?? PACKS[0]!;

  const m = useMemo(() => {
    const buyers = (signups * conversion) / 100;
    const revenue = buyers * pack.priceUsd;
    const fees = paymentFeeUsd(revenue, buyers);

    // 1 credit ≈ 1,000 tokens, so credits map straight onto token cost.
    const costPerCredit = USD_PER_1K_TOKENS;
    const paidCost = buyers * pack.credits * CONSUMPTION_RATE * costPerCredit;
    const freeCost = signups * STARTER_CREDITS * costPerCredit;
    const aiCost = paidCost + freeCost;
    const net = revenue - fees - aiCost;

    // Conversion rate at which net profit hits zero.
    const perBuyer =
      pack.priceUsd * (1 - 0.029) - 0.3 - pack.credits * CONSUMPTION_RATE * costPerCredit;
    const breakEvenPct =
      perBuyer > 0 ? ((STARTER_CREDITS * costPerCredit) / perBuyer) * 100 : Number.POSITIVE_INFINITY;

    return { buyers, revenue, fees, paidCost, freeCost, aiCost, net, breakEvenPct };
  }, [signups, conversion, pack]);

  const rows: [string, string][] = [
    ["Paying students", m.buyers.toFixed(0)],
    ["Revenue", usd(m.revenue)],
    ["Payment fees", `-${usd(m.fees)}`],
    ["AI cost — paying users", `-${usd(m.paidCost)}`],
    ["AI cost — free credits", `-${usd(m.freeCost)}`],
    ["Total AI cost", `-${usd(m.aiCost)}`],
  ];

  return (
    <div className="panel p-5">
      <h3 className="flex items-center gap-2 font-display text-base font-semibold">
        <Calculator className="h-4 w-4 text-primary" />
        Profitability calculator
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        A month at the published prices, assuming buyers use {Math.round(CONSUMPTION_RATE * 100)}% of
        their credits.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="calc-signups">Signups / month</Label>
          <Input
            id="calc-signups"
            type="number"
            min={0}
            value={signups}
            onChange={(e) => setSignups(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div>
          <Label htmlFor="calc-conversion">Conversion %</Label>
          <Input
            id="calc-conversion"
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={conversion}
            onChange={(e) => setConversion(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div>
          <Label htmlFor="calc-pack">Pack they buy</Label>
          <select
            id="calc-pack"
            value={packId}
            onChange={(e) => setPackId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {PACKS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ${p.priceUsd} / {p.credits} cr
              </option>
            ))}
          </select>
        </div>
      </div>

      <dl className="mt-5 space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-mono tabular-nums">{value}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-2">
          <dt className="font-medium">Net profit / month</dt>
          <dd
            className={cn(
              "font-mono text-base font-semibold tabular-nums",
              m.net >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {usd(m.net)}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-muted-foreground">
        {Number.isFinite(m.breakEvenPct)
          ? `Break-even needs about ${m.breakEvenPct.toFixed(2)}% of signups to buy the ${pack.name} pack.`
          : "This pack cannot break even at the current cost assumptions."}
      </p>
    </div>
  );
}
