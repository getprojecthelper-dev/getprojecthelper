import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { turnstileHostname, verifyTurnstileToken } from "./turnstile.server";

const options = { secret: "test-only-secret", action: "signup", hostname: "www.getprojecthelper.com" };
const request = vi.fn();
beforeEach(() => { request.mockReset(); vi.stubGlobal("fetch", request); });
afterEach(() => vi.unstubAllGlobals());

describe("Turnstile verification", () => {
  it("accepts only a successful token for the exact action and hostname", async () => {
    request.mockResolvedValue(Response.json({ success: true, action: "signup", hostname: "www.getprojecthelper.com" }));
    await expect(verifyTurnstileToken("fresh-token", options)).resolves.toBeUndefined();
  });
  it("rejects a replayed or expired token", async () => {
    request.mockResolvedValue(Response.json({ success: false, "error-codes": ["timeout-or-duplicate"] }));
    await expect(verifyTurnstileToken("used-token", options)).rejects.toThrow("Human verification failed");
  });
  it("rejects a different action", async () => {
    request.mockResolvedValue(Response.json({ success: true, action: "contact", hostname: options.hostname }));
    await expect(verifyTurnstileToken("contact-token", options)).rejects.toThrow("Human verification failed");
  });
  it("rejects a local token on the production handler", async () => {
    request.mockResolvedValue(Response.json({ success: true, action: "signup", hostname: "localhost" }));
    await expect(verifyTurnstileToken("local-token", options)).rejects.toThrow("Human verification failed");
  });
  it("rejects tokens exceeding Cloudflare's 2048 character limit before fetching", async () => {
    await expect(verifyTurnstileToken("x".repeat(2049), options)).rejects.toThrow("Please complete");
    expect(request).not.toHaveBeenCalled();
  });
  it("fails closed on network errors", async () => {
    request.mockRejectedValue(new Error("network"));
    await expect(verifyTurnstileToken("token", options)).rejects.toThrow("Human verification failed");
  });
  it("fails closed on HTTP failures", async () => {
    request.mockResolvedValue(new Response("unavailable", { status: 503 }));
    await expect(verifyTurnstileToken("token", options)).rejects.toThrow("Human verification failed");
  });
  it("rejects unrecognized deployment domains", () => {
    expect(() => turnstileHostname("https://attacker.invalid")).toThrow("not available");
    expect(turnstileHostname("https://www.getprojecthelper.com/auth")).toBe("www.getprojecthelper.com");
  });
});