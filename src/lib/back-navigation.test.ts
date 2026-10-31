import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import {
  initBackTracking,
  peekBackTarget,
  resetBackTracking,
  takeBackTarget,
} from "./back-navigation";

function fakeRouter(initialPath: string) {
  const listeners: Array<(event: { toLocation: { pathname: string } }) => void> = [];
  return {
    state: { location: { pathname: initialPath } },
    subscribe: (_event: string, cb: (event: { toLocation: { pathname: string } }) => void) =>
      listeners.push(cb),
    visit(path: string) {
      listeners.forEach((cb) => cb({ toLocation: { pathname: path } }));
    },
  };
}

describe("workspace back navigation", () => {
  test("back returns to the actual previous page, not the workspace", () => {
    resetBackTracking();
    const router = fakeRouter("/welcome");
    initBackTracking(router as never);
    router.visit("/projects");
    router.visit("/projects/abc");
    assert.equal(takeBackTarget("/projects/abc"), "/projects");
    assert.equal(takeBackTarget("/projects"), "/welcome");
  });

  test("repeated backs keep walking further back through visited pages", () => {
    resetBackTracking();
    const router = fakeRouter("/welcome");
    initBackTracking(router as never);
    router.visit("/projects");
    router.visit("/projects/abc");
    router.visit("/projects/abc/build");
    assert.equal(takeBackTarget("/projects/abc/build"), "/projects/abc");
    assert.equal(takeBackTarget("/projects/abc"), "/projects");
    assert.equal(takeBackTarget("/projects"), "/welcome");
    assert.equal(takeBackTarget("/welcome"), null);
  });

  test("peek does not consume the target", () => {
    resetBackTracking();
    const router = fakeRouter("/welcome");
    initBackTracking(router as never);
    router.visit("/settings");
    assert.equal(peekBackTarget("/settings"), "/welcome");
    assert.equal(peekBackTarget("/settings"), "/welcome");
  });

  test("direct entry with no tracked history has no back target", () => {
    resetBackTracking();
    const router = fakeRouter("/projects/abc");
    initBackTracking(router as never);
    assert.equal(takeBackTarget("/projects/abc"), null);
  });
});
