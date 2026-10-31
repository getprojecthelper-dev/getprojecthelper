import type { AnyRouter } from "@tanstack/react-router";

/**
 * In-app page history. The browser history index is unreliable here because
 * redirects (sign-in, checkout) replace entries, so Back could skip straight
 * to the workspace. We track visited paths ourselves instead.
 */
const MAX_STACK = 50;
let stack: string[] = [];
let initialized = false;

/** Start recording visited pages. Call once per client session (not during SSR). */
export function initBackTracking(router: AnyRouter) {
  if (initialized) return;
  initialized = true;
  stack = [router.state.location.pathname];
  router.subscribe("onResolved", ({ toLocation }) => {
    const path = toLocation.pathname;
    if (stack[stack.length - 1] !== path) {
      stack.push(path);
      if (stack.length > MAX_STACK) stack.shift();
    }
  });
}

/** Previous tracked page before `currentPath`, without mutating the stack. */
export function peekBackTarget(currentPath: string): string | null {
  let i = stack.length - 1;
  while (i >= 0 && stack[i] === currentPath) i--;
  return i >= 0 ? stack[i] : null;
}

/**
 * Previous tracked page before `currentPath`. Entries equal to the current
 * page are dropped so repeated backs keep walking further back.
 */
export function takeBackTarget(currentPath: string): string | null {
  while (stack.length > 0 && stack[stack.length - 1] === currentPath) stack.pop();
  return stack.length > 0 ? stack[stack.length - 1] : null;
}

/** Test-only: clear tracked history between tests. */
export function resetBackTracking() {
  stack = [];
  initialized = false;
}
