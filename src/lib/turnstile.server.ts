const frontendHosts = new Set([
  "getprojecthelper.com", "www.getprojecthelper.com",
  "getprojecthelper.lovable.app",
  "id-preview--340a8cfe-0ebb-47c8-8fe1-b3be45e9420d.lovable.app",
]);

export function turnstileHostname(requestUrl: string) {
  const hostname = new URL(requestUrl).hostname;
  if (frontendHosts.has(hostname) || hostname === "localhost" || hostname === "127.0.0.1") return hostname;
  throw new Error("Human verification is not available on this domain.");
}

/** Redeem once, inside the handler that performs the protected operation. */
export async function verifyTurnstileToken(
  token: string | undefined,
  options: { secret: string | undefined; action: string; hostname: string; ip?: string | null },
) {
  if (!options.secret) throw new Error("Human verification is not configured.");
  if (!token || token.length > 2048) throw new Error("Please complete the human verification.");
  const body = new URLSearchParams({ secret: options.secret, response: token });
  if (options.ip) body.set("remoteip", options.ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error("Verification service unavailable");
    const result = await response.json() as { success?: boolean; action?: string; hostname?: string };
    if (result.success !== true || result.action !== options.action || result.hostname !== options.hostname) {
      throw new Error("Invalid verification");
    }
  } catch {
    throw new Error("Human verification failed. Please try again.");
  }
}