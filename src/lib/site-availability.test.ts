import { describe, expect, test } from "bun:test";
import { canAccessSite } from "./site-availability";

describe("website availability", () => {
  test("public mode allows visitors", () => {
    expect(canAccessSite(false, false, "/")).toBe(true);
  });
  test("maintenance blocks public visitors and ordinary users", () => {
    expect(canAccessSite(true, false, "/welcome")).toBe(false);
  });
  test("maintenance preserves administrator access", () => {
    expect(canAccessSite(true, true, "/admin")).toBe(true);
  });
  test("maintenance preserves the working login and password recovery", () => {
    expect(canAccessSite(true, false, "/auth")).toBe(true);
    expect(canAccessSite(true, false, "/reset-password")).toBe(true);
    expect(canAccessSite(true, false, "/auth-other")).toBe(false);
  });
});