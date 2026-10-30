import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { getModelUsage, type ModelUsageGroup } from "@/lib/admin.functions";
import { DEFAULT_RATES, usageCostUsd, type ModelRates } from "@/lib/model-cost";

const WINDOWS = ["1d", "7d", "30d", "all"] as const;
const RATES_KEY = "ph-dev-model-rates";
const n = (v: number) => v.toLocaleString("en-US");
const usd = (v: number) => `$${v < 1 ? v.toFixed(4) : v.toFixed(2)}`;

export function AdminModelUsage() {
  const fetchUsage = useServerFn(getModelUsage);
  const [win, setWin] = useState<(typeof WINDOWS)[number]>("7d");
  const [rates, setRates] = useState<ModelRates>(DEFAULT_RATES);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RATES_KEY);
      if (saved) setRates(JSON.parse(saved));
    } catch {}
  }, []);
  const updateRate = (k: keyof ModelRates, v: string) => {
    const next = { ...rates, [k]: Number(v) || 0 };
    setRates(next);
    localStorage.setItem(RATES_KEY, JSON.stringify(next));
  };
  const { data, isPending } = useQuery({
    queryKey: ["admin", "model-usage", win],
    queryFn: () => fetchUsage({ data: { window: win } }),
  });
  if (data?.forbidden) return null;
  const cost = (g: ModelUsageGroup) => usageCostUsd(g.inputTokens, g.outputTokens, rates);

  const Table = ({ title, rows }: { title: string; rows: ModelUsageGroup[] }) => (
    <div className="overflow-x-auto">
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr><th className="py-1">Name</th><th>Calls</th><th>Input</th><th>Output</th><th className="text-right">Cost</th><th className="text-right">Per call</th></tr>
        </thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.key} className="border-t border-border">
              <td className="py-1.5">{g.key}</td><td>{n(g.calls)}</td><td>{n(g.inputTokens)}</td><td>{n(g.outputTokens)}</td>
              <td className="text-right">{usd(cost(g))}</td>
              <td className="text-right text-muted-foreground">{usd(g.calls ? cost(g) / g.calls : 0)}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={6} className="py-3 text-muted-foreground">No AI calls in this period.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  return (
    <section className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">GPT Luna 6 — token & cost tracker</h2>
          <p className="text-xs text-muted-foreground">Developer-only, for pricing decisions. Students never see this.</p>
        </div>
        <div className="flex gap-1">
          {WINDOWS.map((w) => (
            <button key={w} onClick={() => setWin(w)}
              className={`rounded-md px-2.5 py-1 text-xs ${w === win ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {w === "all" ? "All" : w}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted-foreground">Input price (USD per 1M tokens)
          <Input type="number" step="0.01" min="0" value={rates.inputPer1M} onChange={(e) => updateRate("inputPer1M", e.target.value)} />
        </label>
        <label className="text-xs text-muted-foreground">Output price (USD per 1M tokens)
          <Input type="number" step="0.01" min="0" value={rates.outputPer1M} onChange={(e) => updateRate("outputPer1M", e.target.value)} />
        </label>
      </div>
      {isPending || !data ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["AI calls", n(data.totals.calls)],
              ["Input tokens", n(data.totals.inputTokens)],
              ["Output tokens", n(data.totals.outputTokens)],
              ["Estimated cost", usd(cost(data.totals))],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-lg font-semibold">{v}</p></div>
            ))}
          </div>
          <Table title="By feature" rows={data.byFeature} />
          <Table title="By model" rows={data.byModel} />
          <Table title="By day" rows={data.byDay} />
        </>
      )}
    </section>
  );
}
