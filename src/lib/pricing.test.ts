import { strict as assert } from "node:assert";
import { describe, test } from "node:test";

import { PACKS, packPrice } from "./pricing";

describe("credit-pack pricing", () => {
  test("keeps the published Indian pack prices", () => {
    assert.deepEqual(
      PACKS.map((pack) => packPrice(pack, "INR")),
      [149, 399, 899],
    );
  });
});
