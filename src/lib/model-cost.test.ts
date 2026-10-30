import { describe, expect, test } from "bun:test";
import { groupUsage, usageCostUsd } from "./model-cost";

describe("model cost", () => {
  test("prices input and output tokens separately per 1M", () => {
    expect(usageCostUsd(1_000_000, 500_000, { inputPer1M: 2, outputPer1M: 8 })).toBeCloseTo(6);
  });
  test("groups calls by feature", () => {
    const r = groupUsage([
      { feature: "a", model: "m", input_tokens: 10, output_tokens: 5, created_at: "2026-10-30T01:00:00Z" },
      { feature: "a", model: "m", input_tokens: 20, output_tokens: 5, created_at: "2026-10-30T02:00:00Z" },
    ]);
    expect(r.byFeature[0]).toEqual({ key: "a", calls: 2, inputTokens: 30, outputTokens: 10 });
  });
});
