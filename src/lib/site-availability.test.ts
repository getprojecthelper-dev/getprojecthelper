import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { canAccessSite } from "./site-availability";

describe("website availability", () => {
  test("public mode allows visitors", () => {
    assert.equal(canAccessSite(false, false, "/"), true);
  });
  test("maintenance blocks public visitors and ordinary users", () => {
    assert.equal(canAccessSite(true, false, "/welcome"), false);
  });
  test("maintenance preserves administrator access", () => {
    assert.equal(canAccessSite(true, true, "/admin"), true);
  });
  test("maintenance preserves the working login and password recovery", () => {
    assert.equal(canAccessSite(true, false, "/auth"), true);
    assert.equal(canAccessSite(true, false, "/reset-password"), true);
    assert.equal(canAccessSite(true, false, "/auth-other"), false);
  });
});