import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";

// The site key is public; it's served from the server so it lives with the secret.
export const getTurnstileSiteKey = createServerFn({ method: "GET" }).handler(async () => ({
  siteKey: process.env["TURNSTILE_SITE_KEY"] ?? "",
}));

export const submitVerifiedAuth = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({
    token: z.string().min(1).max(2048),
    kind: z.enum(["login", "signup", "reset"]),
    email: z.string().trim().email().max(255),
    password: z.string().min(8).max(72).optional(),
    fullName: z.string().trim().min(2).max(120).optional(),
    termsAccepted: z.boolean().optional(),
  }).parse(input))
  .handler(async ({ data }) => {
    const { verifyTurnstileToken, turnstileHostname } = await import("./turnstile.server");
    const requestUrl = getRequestUrl();
    const hostname = turnstileHostname(requestUrl.href);
    if (data.kind !== "reset" && !data.password) throw new Error("Enter your password.");
    if (data.kind === "signup" && (!data.fullName || data.termsAccepted !== true)) {
      throw new Error("Enter your name and accept the Terms and Conditions.");
    }
    await verifyTurnstileToken(data.token, {
      secret: process.env["TURNSTILE_SECRET_KEY"],
      action: data.kind === "signup" ? "signup" : "login",
      hostname,
      ip: getRequestHeader("cf-connecting-ip") ?? null,
    });
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Authentication is not configured.");
    const authClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    if (data.kind === "reset") {
      const { error } = await authClient.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${requestUrl.origin}/reset-password`,
      });
      if (error) throw new Error(error.message);
      return { session: null };
    }
    const password = data.password;
    if (!password) throw new Error("Enter your password.");
    const result = data.kind === "signup"
      ? await authClient.auth.signUp({ email: data.email, password, options: {
        emailRedirectTo: requestUrl.origin, data: { full_name: data.fullName },
      } })
      : await authClient.auth.signInWithPassword({ email: data.email, password });
    if (result.error) throw new Error(result.error.message);
    const session = result.data.session;
    return { session: session ? { access_token: session.access_token, refresh_token: session.refresh_token } : null };
  });
