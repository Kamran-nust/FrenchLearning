import { describe, it, expect } from "vitest";
import { DAYS } from "../data/ankiDays";
import { GRAMMAR_DAYS } from "../data/grammarDays";
import { KWIZIQ_DAYS } from "../data/kwiziqDays";
import { TV5_DAYS } from "../data/tv5Days";
import { WRITING_DAYS } from "../data/writingDays";
import { LEVELS, SECTIONS } from "../shared/navigationConfig";

const SETS = { anki: DAYS, grammar: GRAMMAR_DAYS, kwiziq: KWIZIQ_DAYS, tv5: TV5_DAYS, writing: WRITING_DAYS };

describe.each(Object.entries(SETS))("%s plan data", (name, days) => {
  it("has 301 days numbered 1..301 in order", () => {
    expect(days).toHaveLength(301);
    days.forEach((d, i) => expect(d.d).toBe(i + 1));
  });
  it("puts each day in the right week", () => {
    days.forEach((d) => expect(d.w).toBe(Math.ceil(d.d / 7)));
  });
  if (name !== "anki") {
    it("gives every day some task text", () => {
      days.forEach((d) => expect(typeof d.x === "string" && d.x.trim().length > 0, "day " + d.d).toBe(true));
    });
  }
});

describe("anki cards", () => {
  it("every day has cards with French, English and a unique id", () => {
    const seen = new Set();
    DAYS.forEach((day) => {
      expect(day.c.length, "day " + day.d).toBeGreaterThan(0);
      day.c.forEach((c) => {
        expect(c.f && c.e, c.i).toBeTruthy();
        expect(seen.has(c.i), "duplicate id " + c.i).toBe(false);
        seen.add(c.i);
      });
    });
  });
});

describe("kwiziq chips", () => {
  it("have no stray whitespace after splitting (lesson links are keyed on the exact text)", () => {
    KWIZIQ_DAYS.forEach((d) =>
      d.x
        .split(";")
        .map((s) => s.trim())
        .forEach((chip) => expect(chip, "day " + d.d).toBe(chip.trim())),
    );
  });
});

describe("navigation config", () => {
  it("levels cover days 1..301 with no gaps or overlaps", () => {
    let next = 1;
    LEVELS.forEach((l) => {
      expect(l.startDay).toBe(next);
      expect(l.endDay).toBeGreaterThanOrEqual(l.startDay);
      next = l.endDay + 1;
    });
    expect(next - 1).toBe(301);
  });
  it("has the five sections with unique ids", () => {
    expect(new Set(SECTIONS.map((s) => s.id)).size).toBe(SECTIONS.length);
    expect(SECTIONS.map((s) => s.id)).toEqual(
      expect.arrayContaining(["anki", "grammar", "kwiziq", "tv5monde", "writing"]),
    );
  });
});
