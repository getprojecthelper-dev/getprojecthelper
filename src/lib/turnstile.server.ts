// Server-only check of a Turnstile token with Cloudflare.
export async function verifyTurnstileToken(token: string | undefined, ip?: string | null) {
  const secret = process.env["TURNSTILE_SECRET_KEY"];
  if (!secret) throw new Error("Human verification is not configured.");
  if (!token) throw new Error("Please complete the human verification.");
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const result = (await res.json().catch(() => null)) as { success?: boolean } | null;
  if (!result?.success) throw new Error("Human verification failed. Please try again.");
}
