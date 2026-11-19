import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { getPlan, planForPriceId } from "./plans";

describe("plans", () => {
  test("free gives 100 credits and 1 project", () => {
    assert.equal(getPlan("free").credits, 100);
    assert.equal(getPlan("free").projectLimit, 1);
  });
  test("legacy starter keeps 1,000 credits and 2 projects", () => {
    const p = planForPriceId("starter_monthly")!;
    assert.deepEqual([p.inrPrice, p.credits, p.projectLimit], [199, 1000, 2]);
  });
  test("student has 1,000 credits and 3 projects", () => {
    const p = planForPriceId("student_monthly")!;
    assert.deepEqual([p.inrPrice, p.credits, p.projectLimit], [399, 1000, 3]);
  });
  test("Max has 3,000 credits and 15 projects", () => {
    const p = planForPriceId("professional_monthly")!;
    assert.equal(p.name, "Max");
    assert.deepEqual([p.inrPrice, p.credits, p.projectLimit], [999, 3000, 15]);
  });
});
