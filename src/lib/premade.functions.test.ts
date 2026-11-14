import { beforeEach, describe, expect, it, vi } from "vitest";

const { gatewayFetch, createClient } = vi.hoisted(() => ({
  gatewayFetch: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    inputValidator: () => ({
      handler: (handler: unknown) => handler,
    }),
    middleware: () => ({
      inputValidator: () => ({ handler: (handler: unknown) => handler }),
    }),
  }),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/paddle.server", () => ({ gatewayFetch }));

import { resolveProjectPrice } from "./premade.functions";

// The builder mock exposes the real handler without a transport wrapper.
const resolve = resolveProjectPrice as unknown as (input: {
  data: { priceId: string; environment: "sandbox" | "live" };
}) => Promise<string>;

beforeEach(() => vi.resetAllMocks());

describe("shared checkout price resolution", () => {
  for (const priceId of ["starter_monthly", "student_monthly", "professional_monthly"]) {
    it(`resolves ${priceId} without checking the project store`, async () => {
      gatewayFetch.mockResolvedValue(Response.json({
        data: [{ id: "pri_monthly", import_meta: { external_id: priceId }, status: "active" }],
      }));
      expect(await resolve({ data: { priceId, environment: "sandbox" } })).toBe("pri_monthly");
      expect(gatewayFetch).toHaveBeenCalledWith("sandbox", `/prices?external_id=${priceId}`);
      expect(createClient).not.toHaveBeenCalled();
    });
  }

  it("uses the requested live catalog", async () => {
    gatewayFetch.mockResolvedValue(Response.json({
      data: [{ id: "pri_live", import_meta: { external_id: "starter_monthly" }, status: "active" }],
    }));
    expect(await resolve({ data: { priceId: "starter_monthly", environment: "live" } })).toBe("pri_live");
    expect(gatewayFetch).toHaveBeenCalledWith("live", "/prices?external_id=starter_monthly");
  });

  it("rejects arbitrary external IDs without querying the payment catalog", async () => {
    await expect(resolve({ data: { priceId: "unlisted_monthly", environment: "sandbox" } }))
      .rejects.toThrow("This project price is unavailable.");
    expect(gatewayFetch).not.toHaveBeenCalled();
  });

  it("does not return an archived or mismatched subscription price", async () => {
    gatewayFetch.mockResolvedValue(Response.json({ data: [
      { id: "pri_archived", import_meta: { external_id: "starter_monthly" }, status: "archived" },
      { id: "pri_other", import_meta: { external_id: "other_monthly" }, status: "active" },
    ] }));
    await expect(resolve({ data: { priceId: "starter_monthly", environment: "sandbox" } }))
      .rejects.toThrow("This subscription price is unavailable.");
  });

  it("keeps internal project prices behind the store gate", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.invalid");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "public-test-key");
    const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.maybeSingle.mockResolvedValue({ data: { premade_enabled: false }, error: null });
    createClient.mockReturnValue({ from: vi.fn(() => query) });
    await expect(resolve({ data: { priceId: "pri_project", environment: "sandbox" } }))
      .rejects.toThrow("Buy projects is launching soon.");
    expect(gatewayFetch).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});