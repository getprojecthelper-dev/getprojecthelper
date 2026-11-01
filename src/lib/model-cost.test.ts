import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { groupUsage, usageCostUsd } from "./model-cost";
import { creditsForTokens } from "./credit-costs";

describe("model cost", () => {
  test("prices input and output tokens separately per 1M", () => {
    assert.ok(Math.abs(usageCostUsd(1_000_000, 500_000, { inputPer1M: 2, outputPer1M: 8 }) - 6) < 1e-9);
  });
  test("GPT Luna 6 rates: $0.10/1M input, $0.50/1M output", () => {
    assert.ok(Math.abs(usageCostUsd(1_000_000, 1_000_000, { inputPer1M: 0.1, outputPer1M: 0.5 }) - 0.6) < 1e-9);
  });
  test("credits follow Luna 6 cost: 1K input = 1 credit, 1K output = 5 credits", () => {
    assert.equal(creditsForTokens(1000, 0), 1);
    assert.equal(creditsForTokens(0, 1000), 5);
    assert.equal(creditsForTokens(2000, 400), 4);
  });
  test("a call always costs at least 0.1 credits", () => {
    assert.equal(creditsForTokens(0, 0), 0.1);
  });
  test("groups calls by feature", () => {
    const r = groupUsage([
      { feature: "a", model: "m", input_tokens: 10, output_tokens: 5, created_at: "2026-10-30T01:00:00Z" },
      { feature: "a", model: "m", input_tokens: 20, output_tokens: 5, created_at: "2026-10-30T02:00:00Z" },
    ]);
    assert.deepEqual(r.byFeature[0], { key: "a", calls: 2, inputTokens: 30, outputTokens: 10 });
  });
});
