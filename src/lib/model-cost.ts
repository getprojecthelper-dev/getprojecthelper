/** Token → USD maths for the developer cost tracker. Rates are USD per 1M tokens. */
export interface ModelRates {
  inputPer1M: number;
  outputPer1M: number;
}

export const DEFAULT_RATES: ModelRates = { inputPer1M: 0, outputPer1M: 0 };

export const usageCostUsd = (inputTokens: number, outputTokens: number, r: ModelRates) =>
  (inputTokens / 1_000_000) * r.inputPer1M + (outputTokens / 1_000_000) * r.outputPer1M;

interface Row {
  feature: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
}
interface Group {
  key: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
}

export function groupUsage(rows: Row[]) {
  const totals: Group = { key: "total", calls: 0, inputTokens: 0, outputTokens: 0 };
  const maps = { feature: new Map<string, Group>(), model: new Map<string, Group>(), day: new Map<string, Group>() };
  const add = (m: Map<string, Group>, key: string, i: number, o: number) => {
    const g = m.get(key) ?? { key, calls: 0, inputTokens: 0, outputTokens: 0 };
    g.calls += 1;
    g.inputTokens += i;
    g.outputTokens += o;
    m.set(key, g);
  };
  for (const r of rows) {
    const i = Number(r.input_tokens ?? 0);
    const o = Number(r.output_tokens ?? 0);
    totals.calls += 1;
    totals.inputTokens += i;
    totals.outputTokens += o;
    add(maps.feature, r.feature ?? "unknown", i, o);
    add(maps.model, r.model ?? "unknown", i, o);
    add(maps.day, r.created_at.slice(0, 10), i, o);
  }
  const byTokens = (a: Group, b: Group) => b.inputTokens + b.outputTokens - (a.inputTokens + a.outputTokens);
  return {
    totals,
    byFeature: [...maps.feature.values()].sort(byTokens),
    byModel: [...maps.model.values()].sort(byTokens),
    byDay: [...maps.day.values()].sort((a, b) => b.key.localeCompare(a.key)),
  };
}
