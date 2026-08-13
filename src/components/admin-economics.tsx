import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Coins, Flame, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";

import { AdminProfitCalculator } from "@/components/admin-profit-calculator";
import { MetricCard } from "@/components/metrics";
import { Button } from "@/components/ui/button";
import { getUnitEconomics } from "@/lib/admin.functions";
import {
  USD_PER_1K_TOKENS,
  WINDOW_LABELS,
  packEconomics,
  usd,
  type EconomicsWindow,
} from "@/lib/economics";
import { cn } from "@/lib/utils";

const WINDOWS: EconomicsWindow[] = ["7d", "30d", "all"];

/** Revenue vs. AI cost — is the product actually making money? */
export function AdminEconomics() {
  const [win, setWin] = useState<EconomicsWindow>("30d");
  const fetchEconomics = useServerFn(getUnitEconomics);
  const { data, isPending } = useQuery({
    queryKey: ["admin-economics", win],
    queryFn: () => fetchEconomics({ data: { window: win } }),
  });

  const packs = packEconomics();
  const profitable = !!data && !data.forbidden && data.grossMarginUsd > 0;
  const peak =
    data && !data.forbidden
      ? Math.max(0.0001, ...data.weekly.map((w) => Math.max(w.revenueUsd, w.costUsd)))
      : 1;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Unit economics</h2>
          <p className="text-sm text-muted-foreground">
            Money in versus what the AI actually costs, at {usd(USD_PER_1K_TOKENS)} per 1,000 tokens.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border/60 p-1">
          {WINDOWS.map((w) => (
            <Button
              key={w}
              size="sm"
              variant={w === win ? "secondary" : "ghost"}
              className="h-7 px-3 text-xs"
              onClick={() => setWin(w)}
            >
              {WINDOW_LABELS[w]}
            </Button>
          ))}
        </div>
      </div>

      {isPending || !data || data.forbidden ? (
        <div className="panel p-5 text-sm text-muted-foreground">Loading economics…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Revenue"
              value={usd(data.revenueUsd)}
              hint={`${usd(data.creditSalesUsd)} credit sales · ${usd(data.subscriptionMrrUsd)} recurring`}
              icon={<Wallet className="h-4 w-4" />}
              tone={data.revenueUsd > 0 ? "good" : "warn"}
            />
            <MetricCard
              label="AI cost"
              value={usd(data.aiCostUsd)}
              hint={`${data.tokens.toLocaleString()} tokens · ${data.creditsConsumed} credits used`}
              icon={<Flame className="h-4 w-4" />}
              tone="warn"
            />
            <MetricCard
              label="Gross margin"
              value={usd(data.grossMarginUsd)}
              hint={
                data.revenueUsd > 0
                  ? `${data.grossMarginPct}% gross · ${usd(data.netMarginUsd)} net after ${usd(data.paymentFeesUsd)} fees`
                  : "No revenue yet — every run is a loss"
              }
              icon={<TrendingUp className="h-4 w-4" />}
              tone={profitable ? "good" : "bad"}
            />
            <MetricCard
              label="Free credit burn"
              value={usd(data.freeCreditBurnUsd)}
              hint={`${data.creditsGrantedFree} credits given away · ${data.creditsSold} sold`}
              icon={<Coins className="h-4 w-4" />}
              tone={data.freeCreditBurnUsd > 0 ? "warn" : "default"}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <div className="panel p-5">
              <h3 className="font-display text-base font-semibold">Revenue vs cost by week</h3>
              {data.weekly.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Nothing recorded in this window.</p>
              ) : (
                <div className="mt-6 flex h-40 items-end gap-3">
                  {data.weekly.map((w) => (
                    <div key={w.week} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-full w-full items-end justify-center gap-1">
                        <div
                          className="w-1/3 rounded-t bg-success/70"
                          style={{ height: `${Math.max(2, (w.revenueUsd / peak) * 100)}%` }}
                          title={`${w.week}: ${usd(w.revenueUsd)} revenue`}
                        />
                        <div
                          className="w-1/3 rounded-t bg-destructive/60"
                          style={{ height: `${Math.max(2, (w.costUsd / peak) * 100)}%` }}
                          title={`${w.week}: ${usd(w.costUsd)} AI cost`}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{w.week.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-4 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success/70" /> Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-destructive/60" /> AI cost
                </span>
              </p>
            </div>

            <div className="panel p-5">
              <h3 className="font-display text-base font-semibold">Per-credit and per-user</h3>
              <dl className="mt-4 space-y-2 text-sm">
                {[
                  ["Price per credit sold", usd(data.avgPricePerCreditUsd)],
                  ["Payment fees", usd(data.paymentFeesUsd)],
                  ["Net margin", `${usd(data.netMarginUsd)} (${data.netMarginPct}%)`],
                  ["Cost per credit consumed", usd(data.avgCostPerCreditUsd)],
                  ["Signups in window", String(data.signups)],
                  ["AI cost per signup", usd(data.costPerSignupUsd)],
                  ["Active users", String(data.activeUsers)],
                  ["Avg credits per active user", String(data.avgCreditsPerActiveUser)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-mono tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <div className="panel p-5">
              <h3 className="font-display text-base font-semibold">Heaviest consumers</h3>
              {data.topUsers.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No AI usage in this window.</p>
              ) : (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <th className="pb-2 font-semibold">User</th>
                      <th className="pb-2 text-right font-semibold">Credits</th>
                      <th className="pb-2 text-right font-semibold">Cost to us</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topUsers.map((u) => (
                      <tr key={u.userId} className="border-t border-border/60">
                        <td className="py-2 text-muted-foreground">{u.email}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{u.credits}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{usd(u.costUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="panel space-y-6 p-0">
              <div className="panel border-0 p-5 shadow-none">
              <h3 className="font-display text-base font-semibold">Break-even per pack</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {packs.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4">
                    <span>
                      {p.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {p.credits} cr · {usd(p.priceUsd)} · {usd(p.feesUsd)} fees
                      </span>
                    </span>
                    <span
                      className={cn(
                        "font-mono text-xs tabular-nums",
                        p.marginUsd > 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {usd(p.marginUsd)} ({p.marginPct}%)
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Margin is after AI cost and payment fees, assuming every credit is consumed.
                Unused credits are pure profit.
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
