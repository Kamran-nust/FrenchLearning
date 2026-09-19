import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

// The module pulls in Supabase for lesson links; none of that matters here.
vi.mock("../lib/supabaseClient", () => ({
  supabase: { from: vi.fn(), rpc: vi.fn(async () => ({ data: null, error: {} })), functions: { invoke: vi.fn() } },
}));

const { default: KwiziqModule } = await import("../modules/KwiziqModule.jsx");
const { default: WritingModule } = await import("../modules/WritingModule.jsx");
const { readSaved } = await import("../shared/storage");

function storageWith(getImpl) {
  const set = vi.fn(async () => ({ ok: true }));
  window.storage = {
    get: vi.fn(getImpl),
    set,
  };
  return set;
}

// A shim that reads and writes fine except for reading the given key.
function failingReadOf(badKey) {
  const mem = {};
  return storageWith(async (key) => {
    if (key === badKey) throw new Error("network down");
    return { value: key in mem ? mem[key] : null };
  });
}

describe("readSaved", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("tells 'nothing saved' apart from 'could not read'", async () => {
    window.storage = { get: async () => ({ value: null }) };
    expect(await readSaved("k")).toEqual({ ok: true, value: null });
    window.storage = { get: async () => ({ value: JSON.stringify({ a: 1 }) }) };
    expect(await readSaved("k")).toEqual({ ok: true, value: { a: 1 } });
    window.storage = {
      get: async () => {
        throw new Error("x");
      },
    };
    expect(await readSaved("k")).toEqual({ ok: false, value: null });
    window.storage = { get: async () => ({ value: "{not json" }) };
    expect(await readSaved("k")).toEqual({ ok: false, value: null });
  });
});

describe.each([
  ["Kwiziq", KwiziqModule, "kwiziq-progress"],
  ["Writing", WritingModule, "writing-progress"],
])("%s module when saved progress can't be loaded", (_name, Module, key) => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("warns, and never saves over the real progress", async () => {
    const set = failingReadOf(key);
    render(<Module onBack={() => {}} />);

    expect(await screen.findByText(/Couldn't load your saved progress/)).toBeTruthy();

    // Completing the day must not write anything
    const complete = await screen.findByText(/Mark day complete/);
    fireEvent.click(complete);
    await new Promise((r) => setTimeout(r, 50));
    const wroteProgress = set.mock.calls.some(([k]) => k === key);
    expect(wroteProgress).toBe(false);
  });

  it("works and saves normally when nothing has been saved yet", async () => {
    const set = storageWith(async () => ({ value: null }));
    render(<Module onBack={() => {}} />);
    const complete = await screen.findByText(/Mark day complete/);
    expect(screen.queryByText(/Couldn't load your saved progress/)).toBeNull();
    fireEvent.click(complete);
    await waitFor(() => expect(set.mock.calls.some(([k]) => k === key)).toBe(true));
  });
});
