import { describe, it, expect, vi, beforeEach } from "vitest";

const invoke = vi.fn();
const rpc = vi.fn();
vi.mock("../lib/supabaseClient", () => ({
  supabase: { functions: { invoke: (...a) => invoke(...a) }, rpc: (...a) => rpc(...a) },
}));

const { fetchWritingFeedback, fetchFeedbackQuota, FeedbackError } = await import("../lib/writingFeedback");

const httpError = (status, body) => ({ error: { context: { status, json: async () => body } } });

describe("fetchWritingFeedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns feedback and quota on success", async () => {
    invoke.mockResolvedValue({ data: { feedback: "Bien!", quota: { remaining: 4 } } });
    expect(await fetchWritingFeedback("t", "d")).toEqual({ feedback: "Bien!", quota: { remaining: 4 } });
  });

  it("maps 429 limit_reached to a limit error carrying the quota", async () => {
    invoke.mockResolvedValue(httpError(429, { code: "limit_reached", status: { resets_at: "x" } }));
    await expect(fetchWritingFeedback("t", "d")).rejects.toMatchObject({ code: "limit_reached", quota: { resets_at: "x" } });
  });

  it("maps 502 to busy", async () => {
    invoke.mockResolvedValue(httpError(502, {}));
    await expect(fetchWritingFeedback("t", "d")).rejects.toMatchObject({ code: "busy" });
  });

  it("maps anything else to other", async () => {
    invoke.mockResolvedValue(httpError(500, {}));
    await expect(fetchWritingFeedback("t", "d")).rejects.toBeInstanceOf(FeedbackError);
    invoke.mockResolvedValue({ data: {} });
    await expect(fetchWritingFeedback("t", "d")).rejects.toMatchObject({ code: "other" });
  });

  it("fetchFeedbackQuota returns null on error", async () => {
    rpc.mockResolvedValue({ error: {}, data: null });
    expect(await fetchFeedbackQuota()).toBe(null);
    rpc.mockResolvedValue({ data: { limit: 5 } });
    expect(await fetchFeedbackQuota()).toEqual({ limit: 5 });
  });
});
