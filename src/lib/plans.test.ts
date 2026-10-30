import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { getPlan, planForPriceId } from "./plans";

describe("plans", () => {
  test("free gives 100K tokens (100 credits) and 1 project", () => {
    assert.equal(getPlan("free").credits, 100);
    assert.equal(getPlan("free").projectLimit, 1);
  });
  test("starter ₹199, 1M tokens, 2 projects", () => {
    const p = planForPriceId("starter_monthly")!;
    assert.deepEqual([p.inrPrice, p.credits, p.projectLimit], [199, 1000, 2]);
  });
  test("student ₹399, 3M tokens, 5 projects", () => {
    const p = planForPriceId("student_monthly")!;
    assert.deepEqual([p.inrPrice, p.credits, p.projectLimit], [399, 3000, 5]);
  });
  test("professional ₹999, 10M tokens, 15 projects", () => {
    const p = planForPriceId("professional_monthly")!;
    assert.deepEqual([p.inrPrice, p.credits, p.projectLimit], [999, 10000, 15]);
  });
});
