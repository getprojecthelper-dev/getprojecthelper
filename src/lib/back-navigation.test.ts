import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { getBackAction } from "./back-navigation";

describe("workspace back navigation", () => {
  test("returns to the previous browser page when app history exists", () => {
    assert.equal(getBackAction(true, "/settings"), "history");
    assert.equal(getBackAction(true, "/welcome"), "history");
  });
  test("direct entry to a workspace page falls back to Welcome", () => {
    assert.equal(getBackAction(false, "/settings"), "workspace");
    assert.equal(getBackAction(false, "/projects/example/build"), "workspace");
  });
  test("direct entry to Welcome does not navigate away or loop", () => {
    assert.equal(getBackAction(false, "/welcome"), "none");
  });
});