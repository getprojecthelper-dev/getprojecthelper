import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { canAccessSite, canOpenPremade } from "./site-availability";

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

describe("buy projects availability", () => {
  test("the store stays locked for students while the switch is off", () => {
    assert.equal(canOpenPremade(false, false), false);
  });
  test("the store opens for everyone once the switch is on", () => {
    assert.equal(canOpenPremade(true, false), true);
  });
  test("administrators can open a locked store", () => {
    assert.equal(canOpenPremade(false, true), true);
  });
  test("project checkout prices are recognised so the lock can block them", () => {
    assert.equal(isPremadePriceId("campus_event_planner_once"), true);
    assert.equal(isPremadePriceId("flight_delay_predictor_once"), true);
  });
  test("subscription prices are not blocked by the store lock", () => {
    assert.equal(isPremadePriceId("starter_monthly"), false);
    assert.equal(isPremadePriceId("student_monthly"), false);
    assert.equal(isPremadePriceId("professional_monthly"), false);
  });
});