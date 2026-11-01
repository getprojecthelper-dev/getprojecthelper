import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { initBackTracking } from "./lib/back-navigation";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  if (typeof window !== "undefined") {
    initBackTracking(router);
    installStaleChunkReload();
  }

  return router;
};

// After a new deploy, old page files are gone; reload once to get the new ones.
function installStaleChunkReload() {
  const w = window as Window & { __staleChunkReload?: boolean };
  if (w.__staleChunkReload) return;
  w.__staleChunkReload = true;
  const KEY = "stale-chunk-reload-at";
  const reload = () => {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < 10_000) return; // avoid reload loops
    sessionStorage.setItem(KEY, String(Date.now()));
    window.location.reload();
  };
  const isChunkError = (msg: unknown) =>
    /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
      String(msg),
    );
  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    reload();
  });
  window.addEventListener("error", (e) => {
    if (isChunkError(e.message)) reload();
  });
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason as { message?: string } | undefined;
    if (isChunkError(r?.message ?? r)) reload();
  });
}
