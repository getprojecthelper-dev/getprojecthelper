import { beforeEach, describe, expect, it, vi } from "vitest";

const { verify, createClient, signIn, signUp, reset } = vi.hoisted(() => ({
  verify: vi.fn(), createClient: vi.fn(), signIn: vi.fn(), signUp: vi.fn(), reset: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({
  handler: (handler: unknown) => handler,
  inputValidator: () => ({ handler: (handler: unknown) => handler }),
}) }));
vi.mock("@tanstack/react-start/server", () => ({
  getRequestHeader: () => undefined,
  getRequestUrl: () => new URL("https://www.getprojecthelper.com/auth"),
}));
vi.mock("./turnstile.server", () => ({ verifyTurnstileToken: verify, turnstileHostname: () => "www.getprojecthelper.com" }));
vi.mock("@supabase/supabase-js", () => ({ createClient }));
import { submitVerifiedAuth } from "./turnstile.functions";

const submit = submitVerifiedAuth as unknown as (input: { data: {
  kind: "login" | "signup" | "reset"; token: string; email: string;
  password?: string; fullName?: string; termsAccepted?: boolean;
} }) => Promise<unknown>;
const input = { kind: "login" as const, token: "test-token", email: "student@example.invalid", password: "test-password" };

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SUPABASE_URL", "https://example.invalid");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "test-public-key");
  createClient.mockReturnValue({ auth: { signInWithPassword: signIn, signUp, resetPasswordForEmail: reset } });
});

describe("verified account handlers", () => {
  for (const kind of ["login", "signup", "reset"] as const) {
    it(`does not perform ${kind} when verification fails`, async () => {
      verify.mockRejectedValue(new Error("Human verification failed"));
      await expect(submit({ data: { ...input, kind, fullName: "Test Student", termsAccepted: true } })).rejects.toThrow("Human verification failed");
      expect(createClient).not.toHaveBeenCalled();
      expect(signIn).not.toHaveBeenCalled();
      expect(signUp).not.toHaveBeenCalled();
      expect(reset).not.toHaveBeenCalled();
    });
  }
  it("redeems once before logging in and returns only session credentials", async () => {
    verify.mockResolvedValue(undefined);
    signIn.mockResolvedValue({ data: { session: { access_token: "test-access", refresh_token: "test-refresh", extra: "not-returned" } }, error: null });
    await expect(submit({ data: input })).resolves.toEqual({ session: { access_token: "test-access", refresh_token: "test-refresh" } });
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith("test-token", expect.objectContaining({ action: "login", hostname: "www.getprojecthelper.com" }));
    expect(signIn).toHaveBeenCalledWith({ email: input.email, password: input.password });
  });
  it("keeps the reset redirect on the request's own origin", async () => {
    verify.mockResolvedValue(undefined);
    reset.mockResolvedValue({ error: null });
    await submit({ data: { kind: "reset", token: "test-token", email: input.email } });
    expect(reset).toHaveBeenCalledWith(input.email, { redirectTo: "https://www.getprojecthelper.com/reset-password" });
  });
  it("requires accepted terms for signup before redeeming the token", async () => {
    await expect(submit({ data: { ...input, kind: "signup", fullName: "Test Student", termsAccepted: false } })).rejects.toThrow("Terms and Conditions");
    expect(verify).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });
});