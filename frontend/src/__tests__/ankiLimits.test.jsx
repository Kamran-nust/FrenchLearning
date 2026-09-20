import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import {
  DAILY_WORD_LIMITS,
  dailyLimit,
  superDayTotal,
  todaysCount,
  remainingToday,
  limitReached,
  sessionCap,
} from "../shared/ankiLimits";
import { buildSession } from "../lib/ankiSession";
import { DAYS } from "../data/ankiDays";

describe("daily word limits", () => {
  it("is 30 for free, 200 for premium and none for super; unknown tiers count as free", () => {
    expect(DAILY_WORD_LIMITS).toEqual({ free: 30, premium: 200, super: null });
    expect(dailyLimit("free")).toBe(30);
    expect(dailyLimit("premium")).toBe(200);
    expect(dailyLimit("super")).toBeNull();
    expect(dailyLimit("gold")).toBe(30);
  });

  it("counts only today's saved total", () => {
    expect(todaysCount({ date: "Sat Sep 19 2026", seen: 12 }, "Sat Sep 19 2026")).toBe(12);
    expect(todaysCount({ date: "Fri Sep 18 2026", seen: 12 }, "Sat Sep 19 2026")).toBe(0);
    expect(todaysCount(null, "x")).toBe(0);
    expect(todaysCount({ date: "x", seen: "junk" }, "x")).toBe(0);
  });

  it("works out what's left and when the limit is reached", () => {
    expect(remainingToday("free", 12)).toBe(18);
    expect(remainingToday("free", 45)).toBe(0);
    expect(remainingToday("super", 9999)).toBeNull();
    expect(limitReached("free", 29)).toBe(false);
    expect(limitReached("free", 30)).toBe(true);
    expect(limitReached("premium", 199)).toBe(false);
    expect(limitReached("super", 100000)).toBe(false);
  });

  it("holds a day's own session to the limit but extra practice to what is left", () => {
    expect(sessionCap("free", { seen: 12 })).toBe(30);
    expect(sessionCap("free", { practice: true, seen: 12 })).toBe(18);
    expect(sessionCap("premium", { practice: true, seen: 190 })).toBe(10);
    expect(sessionCap("super", { practice: true, seen: 5000 })).toBeNull();
  });

  it("steps super's day steadily from 25 up to 50", () => {
    expect(superDayTotal(0)).toBe(25);
    expect(superDayTotal(150)).toBe(38);
    expect(superDayTotal(300)).toBe(50);
    expect(superDayTotal(301)).toBe(50);
    let last = 0;
    for (let d = 0; d <= 300; d++) {
      const t = superDayTotal(d);
      expect(t).toBeGreaterThanOrEqual(last);
      last = t;
    }
  });
});

describe("session size by tier", () => {
  const bank = Array.from({ length: 200 }, (_, i) => ({
    i: "wb:" + i,
    f: "f" + i,
    e: "e" + i,
    sourceDay: 1,
    custom: true,
  }));
  const at = (completed) => ({
    current_day: completed + 1,
    completed_days: Array.from({ length: completed }, (_, i) => i + 1),
  });

  it("leaves sessions as they were when no tier is given", () => {
    const s = buildSession(at(150), new Set());
    expect(s.words.length).toBe(DAYS[150].c.length + Math.round(5 + (35 / 300) * 150));
  });

  it("holds a free day to 30 cards late in the plan (it would otherwise be 48)", () => {
    const s = buildSession(at(300), new Set(), [], { tier: "free", seen: 0 });
    expect(s.words.length).toBe(30);
    expect(s.words.filter((w) => w.key.includes("-new-")).length).toBe(DAYS[300].c.length);
  });

  it("does not shrink a free day that is already under 30", () => {
    const s = buildSession(at(50), new Set(), [], { tier: "free" });
    expect(s.words.length).toBe(DAYS[50].c.length + Math.round(5 + (35 / 300) * 50));
  });

  it("gives extra practice only what is left of today's allowance", () => {
    const s = buildSession(at(300), new Set(), [], { tier: "free", practice: true, seen: 22 });
    expect(s.words.length).toBe(8);
    const none = buildSession(at(300), new Set(), [], { tier: "free", practice: true, seen: 30 });
    expect(none.words.length).toBe(0);
  });

  it("gives premium the full day (never more than 200)", () => {
    const s = buildSession(at(300), new Set(), [], { tier: "premium" });
    expect(s.words.length).toBe(DAYS[300].c.length + 40);
  });

  it("makes a super day at least 25 cards from day 1 (with Word Bank words filling the reviews)", () => {
    const s = buildSession(at(0), new Set(), bank, { tier: "super" });
    expect(s.words.length).toBe(25);
  });

  it("makes a super day 38 cards halfway and 50 at the end", () => {
    expect(buildSession(at(150), new Set(), bank, { tier: "super" }).words.length).toBe(38);
    expect(buildSession(at(300), new Set(), bank, { tier: "super" }).words.length).toBe(50);
  });

  it("puts no cap on super practice", () => {
    const s = buildSession(at(300), new Set(), bank, { tier: "super", practice: true, seen: 9999 });
    expect(s.words.length).toBe(50);
  });
});

// ------------------------------------------------------------------ the screen
let mockTier = "free";
let mockTierLoading = false;
let store = {};

vi.mock("../lib/supabaseClient", () => ({ supabase: {} }));
vi.mock("../lib/wordBank", () => ({ fetchWordBank: async () => [] }));
vi.mock("../TierContext.jsx", () => ({ useTier: () => ({ tier: mockTier, loading: mockTierLoading }) }));

const { default: AnkiModule } = await import("../modules/AnkiModule.jsx");

describe("Anki screen with daily limits", () => {
  beforeEach(() => {
    mockTier = "free";
    mockTierLoading = false;
    store = {};
    window.storage = {
      get: async (key) => (key in store ? { value: store[key] } : null),
      set: async (key, value) => {
        store[key] = value;
        return { key, value };
      },
    };
  });
  afterEach(() => {
    cleanup();
    delete window.storage;
  });

  it("shows a free user how many words they've seen today and counts each new card once", async () => {
    render(<AnkiModule onBack={() => {}} />);
    await screen.findByText("Words today: 1 of 30");
    fireEvent.click(screen.getByLabelText("Next word"));
    await screen.findByText("Words today: 2 of 30");
    fireEvent.click(screen.getByLabelText("Previous word"));
    fireEvent.click(screen.getByLabelText("Next word"));
    expect(screen.getByText("Words today: 2 of 30")).toBeTruthy();
    await waitFor(() => expect(JSON.parse(store["anki-daily"]).seen).toBe(2));
  });

  it("shows premium their own limit", async () => {
    mockTier = "premium";
    render(<AnkiModule onBack={() => {}} />);
    await screen.findByText("Words today: 1 of 200");
  });

  it("shows super no counter", async () => {
    mockTier = "super";
    render(<AnkiModule onBack={() => {}} />);
    await screen.findByText(/new/);
    expect(screen.queryByText(/Words today/)).toBeNull();
  });

  it("stops a free user who has used today's 30 and offers the plans", async () => {
    store["anki-daily"] = JSON.stringify({ date: new Date().toDateString(), seen: 30 });
    const onOpenPlans = vi.fn();
    render(<AnkiModule onBack={() => {}} onOpenPlans={onOpenPlans} />);
    await screen.findByText("Today's limit reached");
    expect(screen.getByText(/Premium raises it to 200/)).toBeTruthy();
    fireEvent.click(screen.getByText("See plans"));
    expect(onOpenPlans).toHaveBeenCalled();
  });

  it("starts fresh on a new day", async () => {
    store["anki-daily"] = JSON.stringify({ date: "Mon Jan 01 2001", seen: 30 });
    render(<AnkiModule onBack={() => {}} />);
    await screen.findByText("Words today: 1 of 30");
  });

  it("never blocks super", async () => {
    mockTier = "super";
    store["anki-daily"] = JSON.stringify({ date: new Date().toDateString(), seen: 5000 });
    render(<AnkiModule onBack={() => {}} />);
    await screen.findByText(/new/);
    expect(screen.queryByText("Today's limit reached")).toBeNull();
  });
});
