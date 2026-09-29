import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { EMPTY_MISSED, parseMissed, toggleMissed, mergeMissed, unflagged } from "../shared/missedWords";

const card = (i, f, e) => ({ i, f, e, dir: "FE", sourceDay: 1, key: i + "-k" });

describe("missed-words logic", () => {
  it("toggles a card on and off", () => {
    let r = toggleMissed({}, card("a", "le pain", "bread"));
    expect(r).toEqual({ a: { i: "a", f: "le pain", e: "bread" } });
    r = toggleMissed(r, card("a", "le pain", "bread"));
    expect(r).toEqual({});
  });

  it("merges a round into the saved list, each word once, in order", () => {
    const saved = [{ i: "a", f: "A", e: "a" }];
    const round = { b: { i: "b", f: "B", e: "b" }, a: { i: "a", f: "A", e: "a" } };
    expect(mergeMissed(saved, round).map((w) => w.i)).toEqual(["a", "b"]);
    expect(mergeMissed([], {})).toEqual([]);
  });

  it("reads the saved value safely", () => {
    expect(parseMissed(null)).toEqual(EMPTY_MISSED);
    expect(parseMissed("junk")).toEqual(EMPTY_MISSED);
    expect(
      parseMissed({ day: 4, words: [{ i: "a", f: "A", e: "a" }, { i: "a", f: "A", e: "a" }, { bad: 1 }] }),
    ).toEqual({
      day: 4,
      words: [{ i: "a", f: "A", e: "a" }],
    });
    expect(parseMissed({ day: "x", words: [] }).day).toBeNull();
  });

  it("finds the missed words not yet flagged hard", () => {
    const words = [
      { i: "a", f: "A", e: "a" },
      { i: "b", f: "B", e: "b" },
    ];
    expect(unflagged(words, new Set(["a"])).map((w) => w.i)).toEqual(["b"]);
  });
});

// ------------------------------------------------------------------ the Anki screen
let store = {};
vi.mock("../lib/supabaseClient", () => ({ supabase: {} }));
vi.mock("../lib/wordBank", () => ({ fetchWordBank: async () => [] }));
vi.mock("../TierContext.jsx", () => ({ useTier: () => ({ tier: "super", loading: false }) }));

const { default: AnkiModule } = await import("../modules/AnkiModule.jsx");
const saved = (k) => (k in store ? JSON.parse(store[k]) : undefined);

// Day 1 is six new cards, bonjour first (no reviews yet, no Word Bank words in these tests).
async function finishDay() {
  for (let n = 0; n < 5; n++) fireEvent.click(screen.getByLabelText("Next word"));
  fireEvent.click(screen.getByLabelText("Finish day"));
}

describe("marking words wrong in Anki", () => {
  beforeEach(() => {
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

  it("offers the button only once the answer is shown", async () => {
    render(<AnkiModule onBack={() => {}} />);
    await screen.findByText("bonjour");
    expect(screen.queryByText("I got it wrong")).toBeNull();
    fireEvent.click(screen.getByText("Show answer"));
    expect(screen.getByText("I got it wrong")).toBeTruthy();
  });

  it("marks a word wrong, lists it after the day and saves the list", async () => {
    render(<AnkiModule onBack={() => {}} />);
    await screen.findByText("bonjour");
    fireEvent.click(screen.getByText("Show answer"));
    fireEvent.click(screen.getByText("I got it wrong"));
    expect(screen.getByText("Marked as wrong")).toBeTruthy();
    expect(screen.getByText("Tap again to undo")).toBeTruthy();
    await finishDay();

    await screen.findByText("Day 1 done");
    expect(screen.getByText("Missed today")).toBeTruthy();
    expect(screen.getByText("bonjour")).toBeTruthy();
    expect(screen.getByText("hello")).toBeTruthy();
    expect(screen.getByLabelText("Hear bonjour")).toBeTruthy();
    await waitFor(() =>
      expect(saved("anki-missed")).toEqual({ day: 1, words: [{ i: "d1c1", f: "bonjour", e: "hello" }] }),
    );
  });

  it("undoing the mark leaves nothing to list", async () => {
    render(<AnkiModule onBack={() => {}} />);
    await screen.findByText("bonjour");
    fireEvent.click(screen.getByText("Show answer"));
    fireEvent.click(screen.getByText("I got it wrong"));
    fireEvent.click(screen.getByText("Marked as wrong"));
    expect(screen.getByText("I got it wrong")).toBeTruthy();
    await finishDay();
    await screen.findByText("Day 1 done");
    expect(screen.queryByText("Missed today")).toBeNull();
    expect(saved("anki-missed")).toBeUndefined();
  });

  it("keeps a mark when going back to the card", async () => {
    render(<AnkiModule onBack={() => {}} />);
    await screen.findByText("bonjour");
    fireEvent.click(screen.getByText("Show answer"));
    fireEvent.click(screen.getByText("I got it wrong"));
    fireEvent.click(screen.getByLabelText("Next word"));
    fireEvent.click(screen.getByLabelText("Previous word"));
    expect(screen.getByText("Marked as wrong")).toBeTruthy();
  });

  it("flags all missed words as hard in one tap", async () => {
    render(<AnkiModule onBack={() => {}} />);
    await screen.findByText("bonjour");
    fireEvent.click(screen.getByText("Show answer"));
    fireEvent.click(screen.getByText("I got it wrong"));
    await finishDay();
    fireEvent.click(await screen.findByText("Flag all 1 as hard"));
    expect(screen.getByText("All flagged as hard")).toBeTruthy();
    await waitFor(() => expect(saved("hard-words")).toContain("d1c1"));
  });

  it("reopens on the Day-done screen with the list, and Start next day clears it", async () => {
    store.progress = JSON.stringify({
      current_day: 2,
      completed_days: [1],
      last_activity_date: new Date().toDateString(),
      streak_count: 1,
      longest_streak: 1,
    });
    store["anki-missed"] = JSON.stringify({ day: 1, words: [{ i: "d1c1", f: "bonjour", e: "hello" }] });
    render(<AnkiModule onBack={() => {}} />);
    await screen.findByText("Day 1 done");
    expect(screen.getByText("Missed today")).toBeTruthy();
    expect(screen.getByText("bonjour")).toBeTruthy();

    fireEvent.click(screen.getByText("Start next day"));
    await screen.findByText("Show answer");
    await waitFor(() => expect(saved("anki-missed")).toEqual({ day: null, words: [] }));
  });

  it("goes straight into the next day when nothing was missed", async () => {
    store.progress = JSON.stringify({
      current_day: 2,
      completed_days: [1],
      last_activity_date: new Date().toDateString(),
      streak_count: 1,
      longest_streak: 1,
    });
    render(<AnkiModule onBack={() => {}} />);
    await screen.findByText("Show answer");
    expect(screen.queryByText("Day 1 done")).toBeNull();
  });
});
