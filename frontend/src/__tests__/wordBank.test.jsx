import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import {
  ownWordLimit,
  ownWordCount,
  hasRoom,
  cleanWord,
  validateWord,
  isDuplicate,
  filterWords,
  sortForDisplay,
  toAnkiCards,
  splitReviewSlots,
} from "../shared/wordBank";
import { buildSession } from "../lib/ankiSession";
import { canUse } from "../shared/tiers";

const own = (id, french, english, extra = {}) => ({
  id,
  french,
  english,
  note: null,
  starter_id: null,
  hidden: false,
  added_day: 3,
  created_at: "2026-01-0" + id,
  ...extra,
});
const starter = (id, french, english, extra = {}) => ({
  ...own(id, french, english),
  starter_id: Number(id),
  ...extra,
});

describe("Word Bank rules", () => {
  it("is a Premium feature", () => {
    expect(canUse("free", "wordBank")).toBe(false);
    expect(canUse("premium", "wordBank")).toBe(true);
    expect(canUse("super", "wordBank")).toBe(true);
  });

  it("limits Premium to 500 own words and never counts starter words", () => {
    expect(ownWordLimit("free")).toBe(0);
    expect(ownWordLimit("premium")).toBe(500);
    expect(ownWordLimit("super")).toBeGreaterThan(10000);
    const words = [starter("1", "bonjour", "hello"), own("2", "le pain", "bread")];
    expect(ownWordCount(words)).toBe(1);
    const full = Array.from({ length: 500 }, (_, i) => own(String(i + 10), "mot" + i, "word" + i));
    expect(hasRoom("premium", full)).toBe(false);
    expect(hasRoom("super", full)).toBe(true);
    expect(hasRoom("free", [])).toBe(false);
  });

  it("tidies and validates what's typed", () => {
    expect(cleanWord({ french: "  le   pain ", english: " bread ", note: "  " })).toEqual({
      french: "le pain",
      english: "bread",
      note: null,
    });
    expect(validateWord({ french: "", english: "x" })).toMatch(/French/);
    expect(validateWord({ french: "x", english: "  " })).toMatch(/English/);
    expect(validateWord({ french: "x".repeat(201), english: "y" })).toMatch(/too long/);
    expect(validateWord({ french: "le pain", english: "bread" })).toBeNull();
  });

  it("spots duplicates ignoring case and hidden words", () => {
    const words = [own("1", "Le Pain", "Bread"), own("2", "l'eau", "water", { hidden: true })];
    expect(isDuplicate(words, { french: "le pain", english: "bread" })).toBe(true);
    expect(isDuplicate(words, { french: "le pain", english: "bread" }, "1")).toBe(false);
    expect(isDuplicate(words, { french: "l'eau", english: "water" })).toBe(false);
  });

  it("searches French, English and the note, and lists own words first", () => {
    const words = [
      starter("1", "bonjour", "hello"),
      own("2", "le pain", "bread", { note: "boulangerie" }),
      own("3", "l'eau", "water", { created_at: "2026-02-01" }),
    ];
    expect(filterWords(words, "boulang").map((w) => w.id)).toEqual(["2"]);
    expect(filterWords(words, "HELLO").map((w) => w.id)).toEqual(["1"]);
    expect(sortForDisplay(words).map((w) => w.id)).toEqual(["3", "2", "1"]);
  });

  it("turns words into Anki cards with safe ids and leaves hidden ones out", () => {
    const cards = toAnkiCards([own("a1", "le pain", "bread"), own("a2", "l'eau", "water", { hidden: true })]);
    expect(cards).toEqual([{ i: "wb:a1", f: "le pain", e: "bread", sourceDay: 3, custom: true }]);
  });
});

describe("splitting review slots", () => {
  it("gives Word Bank about a quarter of the slots", () => {
    expect(splitReviewSlots(20, 500, 300)).toEqual({ builtin: 15, custom: 5 });
    expect(splitReviewSlots(5, 100, 100)).toEqual({ builtin: 3, custom: 2 });
  });
  it("fills the gap when there are too few built-in words (day 1)", () => {
    expect(splitReviewSlots(5, 0, 148)).toEqual({ builtin: 0, custom: 5 });
    expect(splitReviewSlots(5, 3, 148)).toEqual({ builtin: 3, custom: 2 });
    expect(splitReviewSlots(5, 0, 2)).toEqual({ builtin: 0, custom: 2 });
  });
  it("changes nothing without Word Bank words", () => {
    expect(splitReviewSlots(5, 100, 0)).toEqual({ builtin: 5, custom: 0 });
    expect(splitReviewSlots(5, 2, 0)).toEqual({ builtin: 2, custom: 0 });
  });
});

describe("Anki session with Word Bank words", () => {
  const progress = { current_day: 30, completed_days: Array.from({ length: 29 }, (_, i) => i + 1) };
  const cards = Array.from({ length: 50 }, (_, i) => ({
    i: "wb:" + i,
    f: "mot" + i,
    e: "word" + i,
    sourceDay: 12,
    custom: true,
  }));

  it("mixes them in as review cards, never as new", () => {
    const s = buildSession(progress, new Set(), cards);
    const mine = s.words.filter((w) => w.custom);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.length).toBeLessThanOrEqual(Math.ceil(s.reviewCount / 4));
    expect(s.words.filter((w) => !w.custom && w.key.includes("-new-")).length).toBe(s.dayObj.c.length);
    expect(mine.every((w) => w.key.includes("-rev-"))).toBe(true);
  });

  it("fills day 1 reviews from Word Bank when nothing has been learned yet", () => {
    const s = buildSession({ current_day: 1, completed_days: [] }, new Set(), cards);
    expect(s.reviewCount).toBe(5);
    expect(s.words.filter((w) => w.custom).length).toBe(5);
  });

  it("is unchanged without Word Bank words", () => {
    const s = buildSession(progress, new Set());
    expect(s.words.some((w) => w.custom)).toBe(false);
    expect(s.reviewCount).toBe(Math.round(5 + (35 / 300) * 29));
  });

  it("favours words marked hard", () => {
    let hardPicked = 0;
    let easyPicked = 0;
    const small = cards.slice(0, 10);
    for (let n = 0; n < 200; n++) {
      const s = buildSession({ current_day: 1, completed_days: [] }, new Set(["wb:0"]), small);
      const picked = s.words.filter((w) => w.custom).map((w) => w.i);
      if (picked.includes("wb:0")) hardPicked++;
      if (picked.includes("wb:9")) easyPicked++;
    }
    expect(hardPicked).toBeGreaterThan(easyPicked);
  });
});

// ------------------------------------------------------------------ the screen
let mockTier = "premium";
let mockLoading = false;
const api = {
  fetchWordBank: vi.fn(),
  addWord: vi.fn(),
  updateWord: vi.fn(),
  removeWord: vi.fn(),
  resetStarterWords: vi.fn(),
};

vi.mock("../lib/supabaseClient", () => ({ supabase: {} }));
vi.mock("../lib/wordBank", () => ({
  fetchWordBank: (...a) => api.fetchWordBank(...a),
  addWord: (...a) => api.addWord(...a),
  updateWord: (...a) => api.updateWord(...a),
  removeWord: (...a) => api.removeWord(...a),
  resetStarterWords: (...a) => api.resetStarterWords(...a),
}));
vi.mock("../TierContext.jsx", () => ({
  useTier: () => ({
    tier: mockTier,
    loading: mockLoading,
    can: (f) => f === "wordBank" && ["premium", "super"].includes(mockTier),
  }),
}));
vi.mock("../shared/storage", () => ({ readSaved: async () => ({ ok: true, value: { current_day: 42 } }) }));

const { default: WordBankModule } = await import("../modules/WordBankModule.jsx");

describe("Word Bank screen", () => {
  beforeEach(() => {
    mockTier = "premium";
    mockLoading = false;
    api.fetchWordBank.mockResolvedValue([
      starter("1", "bonjour", "hello"),
      starter("2", "merci", "thank you"),
      own("3", "le pain", "bread"),
    ]);
  });
  afterEach(() => {
    cleanup();
    Object.values(api).forEach((m) => m.mockReset());
  });

  it("locks free accounts and points to the plans", () => {
    mockTier = "free";
    const onOpenPlans = vi.fn();
    render(<WordBankModule onBack={() => {}} onOpenPlans={onOpenPlans} />);
    expect(screen.getByText("Word Bank is a Premium feature")).toBeTruthy();
    fireEvent.click(screen.getByText("See plans"));
    expect(onOpenPlans).toHaveBeenCalled();
    expect(api.fetchWordBank).not.toHaveBeenCalled();
  });

  it("lists words with counts and the Premium limit", async () => {
    render(<WordBankModule onBack={() => {}} />);
    await screen.findByText("le pain");
    expect(screen.getByText("bonjour")).toBeTruthy();
    expect(screen.getByText(/of 500/)).toBeTruthy();
    expect(screen.getAllByText("Mine").length).toBe(1);
    expect(screen.getAllByText("Starter").length).toBe(2);
  });

  it("adds a word stamped with the current Anki day", async () => {
    api.addWord.mockResolvedValue(own("9", "le fromage", "cheese", { added_day: 42 }));
    render(<WordBankModule onBack={() => {}} />);
    await screen.findByText("le pain");
    fireEvent.change(screen.getByLabelText("French"), { target: { value: "le fromage" } });
    fireEvent.change(screen.getByLabelText("English"), { target: { value: "cheese" } });
    fireEvent.click(screen.getByText("Add word"));
    await screen.findByText("le fromage");
    expect(api.addWord).toHaveBeenCalledWith({ french: "le fromage", english: "cheese", note: "" }, 42);
    expect(screen.getByRole("status").textContent).toMatch(/next session/);
  });

  it("refuses an empty word and a duplicate without calling the server", async () => {
    render(<WordBankModule onBack={() => {}} />);
    await screen.findByText("le pain");
    fireEvent.click(screen.getByText("Add word"));
    expect(screen.getByRole("alert").textContent).toMatch(/French/);
    fireEvent.change(screen.getByLabelText("French"), { target: { value: "Le Pain" } });
    fireEvent.change(screen.getByLabelText("English"), { target: { value: "bread" } });
    fireEvent.click(screen.getByText("Add word"));
    expect(screen.getByRole("alert").textContent).toMatch(/already/);
    expect(api.addWord).not.toHaveBeenCalled();
  });

  it("deletes their own word after a confirmation, but only hides a starter word", async () => {
    api.removeWord.mockResolvedValue();
    render(<WordBankModule onBack={() => {}} />);
    await screen.findByText("le pain");
    fireEvent.click(screen.getByLabelText("Delete le pain"));
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(screen.queryByText("le pain")).toBeNull());
    expect(api.removeWord).toHaveBeenCalledWith(expect.objectContaining({ id: "3" }));

    fireEvent.click(screen.getByLabelText("Hide bonjour"));
    await waitFor(() => expect(screen.queryByText("bonjour")).toBeNull());
    expect(screen.getByText(/Reset starter words \(1 hidden\)/)).toBeTruthy();
  });

  it("edits a word", async () => {
    api.updateWord.mockResolvedValue(own("3", "le pain", "the bread"));
    render(<WordBankModule onBack={() => {}} />);
    await screen.findByText("le pain");
    fireEvent.click(screen.getByLabelText("Edit le pain"));
    fireEvent.change(screen.getByLabelText("Edit English"), { target: { value: "the bread" } });
    fireEvent.click(screen.getByText("Save"));
    await screen.findByText("the bread");
    expect(api.updateWord).toHaveBeenCalledWith("3", { french: "le pain", english: "the bread", note: "" });
  });

  it("searches", async () => {
    render(<WordBankModule onBack={() => {}} />);
    await screen.findByText("le pain");
    fireEvent.change(screen.getByLabelText("Search your words"), { target: { value: "thank" } });
    expect(screen.getByText("merci")).toBeTruthy();
    expect(screen.queryByText("le pain")).toBeNull();
  });

  it("shows a retry when the words can't be loaded", async () => {
    api.fetchWordBank.mockRejectedValue(new Error("x"));
    render(<WordBankModule onBack={() => {}} />);
    await screen.findByText(/Couldn't load your words/);
  });

  it("shows no Premium limit for super users", async () => {
    mockTier = "super";
    render(<WordBankModule onBack={() => {}} />);
    await screen.findByText("le pain");
    expect(screen.queryByText(/of 500/)).toBeNull();
  });
});
