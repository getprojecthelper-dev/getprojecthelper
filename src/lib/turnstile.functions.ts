import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

// The site key is public; it's served from the server so it lives with the secret.
export const getTurnstileSiteKey = createServerFn({ method: "GET" }).handler(async () => ({
  siteKey: process.env["TURNSTILE_SITE_KEY"] ?? "",
}));

export const verifyTurnstile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ token: z.string().min(1).max(4096) }).parse(input))
  .handler(async ({ data }) => {
    const { verifyTurnstileToken } = await import("./turnstile.server");
    await verifyTurnstileToken(data.token, getRequestHeader("cf-connecting-ip"));
    return { ok: true };
  });
