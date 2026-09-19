import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TierContext } from "../TierContext.jsx";
import { KWIZIQ_DAYS } from "../data/kwiziqDays";
import { TV5_DAYS } from "../data/tv5Days";
import { splitLessonChips } from "../shared/textHelpers";

// Fixed rows the (mocked) lesson-links tables return for premium users.
const kwiziqChip = splitLessonChips(KWIZIQ_DAYS[0].x)[0];
const tv5Chip = splitLessonChips(
  TV5_DAYS[0].x.replace(/^(Première classe|A1-A2|A2-B1|B1-B2|A1|A2|B1|B2)\s*:\s*/, ""),
)[0];
const rows = {
  lesson_links: [
    { module: "kwiziq", chip: kwiziqChip, url: "https://example.test/kwiziq-direct" },
    { module: "tv5", chip: tv5Chip, url: "https://example.test/tv5-direct" },
  ],
  lesson_extra_links: [
    { module: "kwiziq", day: 1, label: "Extra Kwiziq lesson", url: "https://example.test/kwiziq-extra", sort: 0 },
    { module: "tv5", day: 1, label: "Extra TV5 lesson", url: "https://example.test/tv5-extra", sort: 0 },
  ],
};

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    rpc: vi.fn(async () => ({ data: null, error: {} })),
    functions: { invoke: vi.fn() },
    from: (table) => {
      let module = null;
      const q = {
        select: () => q,
        order: () => q,
        eq: (col, val) => {
          if (col === "module") module = val;
          return q;
        },
        then: (resolve) => resolve({ data: (rows[table] || []).filter((r) => r.module === module), error: null }),
      };
      return q;
    },
  },
}));

const { default: KwiziqModule } = await import("../modules/KwiziqModule.jsx");
const { default: Tv5Module } = await import("../modules/Tv5Module.jsx");

function tierValue(tier) {
  return { tier, loading: false, can: () => tier !== "free", refresh: () => {} };
}

function memoryStorage(initial = {}) {
  const mem = { ...initial };
  window.storage = {
    get: async (k) => ({ value: k in mem ? mem[k] : null }),
    set: async (k, v) => {
      mem[k] = v;
      return { ok: true };
    },
  };
}

// Guards the Kwiziq / TV5 screens: what they render must not change when the
// shared code behind them is reorganised. (Snapshots live in __snapshots__.)
describe.each([
  ["kwiziq", KwiziqModule, "kwiziq-progress"],
  ["tv5", Tv5Module, "tv5-progress"],
])("%s module output", (name, Module, key) => {
  afterEach(cleanup);

  const html = (c) => c.innerHTML.replace(/blob:[^"]+/g, "blob");

  it("fresh start, free user", async () => {
    memoryStorage();
    const { container } = render(
      <TierContext.Provider value={tierValue("free")}>
        <Module onBack={() => {}} />
      </TierContext.Provider>,
    );
    await screen.findByText(/Mark day complete/);
    expect(html(container)).toMatchSnapshot();
  });

  it("fresh start, premium user (direct links and extra links)", async () => {
    memoryStorage();
    const { container } = render(
      <TierContext.Provider value={tierValue("premium")}>
        <Module onBack={() => {}} />
      </TierContext.Provider>,
    );
    await screen.findByText(/Mark day complete/);
    await screen.findByText(/Extra (Kwiziq|TV5) lesson/);
    expect(html(container)).toMatchSnapshot();
  });

  it("opened on a later day (reading only)", async () => {
    memoryStorage();
    const { container } = render(
      <TierContext.Provider value={tierValue("free")}>
        <Module onBack={() => {}} startDay={109} />
      </TierContext.Provider>,
    );
    await screen.findByText(/Reading only/);
    expect(html(container)).toMatchSnapshot();
  });

  it("after marking the day complete", async () => {
    memoryStorage();
    const { container } = render(
      <TierContext.Provider value={tierValue("free")}>
        <Module onBack={() => {}} />
      </TierContext.Provider>,
    );
    fireEvent.click(await screen.findByText(/Mark day complete/));
    await screen.findByText(/Day 1 done/);
    expect(html(container)).toMatchSnapshot();
  });

  it("with saved progress on day 5, then reset prompt", async () => {
    const saved = {
      current_day: 5,
      completed_days: [1, 2, 3, 4],
      last_activity_date: null,
      streak_count: 4,
      longest_streak: 4,
    };
    memoryStorage({ [key]: JSON.stringify(saved) });
    const { container } = render(
      <TierContext.Provider value={tierValue("free")}>
        <Module onBack={() => {}} />
      </TierContext.Provider>,
    );
    await screen.findByText(/4 days done/);
    expect(html(container)).toMatchSnapshot();
  });

  it("finished plan", async () => {
    const saved = {
      current_day: 301,
      completed_days: Array.from({ length: 300 }, (_, i) => i + 1),
      last_activity_date: null,
      streak_count: 9,
      longest_streak: 12,
    };
    memoryStorage({ [key]: JSON.stringify(saved) });
    const { container } = render(
      <TierContext.Provider value={tierValue("free")}>
        <Module onBack={() => {}} />
      </TierContext.Provider>,
    );
    fireEvent.click(await screen.findByText(/Mark day complete/));
    await screen.findByText(/All 301 days done/);
    expect(html(container)).toMatchSnapshot();
    expect(name).toBeTruthy();
  });
});
