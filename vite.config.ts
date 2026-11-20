// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Load non-VITE_ env vars into process.env for server-side code only.
Object.assign(process.env, loadEnv(process.env["NODE_ENV"] ?? "development", process.cwd(), ""));

export default defineConfig({
  vite: {
    // Development modules are intentionally served as source files by Vite.
    // Keep that server local so they cannot be reached from another device.
    server: { host: "127.0.0.1" },
    // Production clients receive compiled assets only; never publish source maps.
    build: { sourcemap: false },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
