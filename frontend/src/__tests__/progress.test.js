import { describe, it, expect } from "vitest";
import { FRESH_PROGRESS, progressAfterCompleting } from "../shared/progress";

const NOW = new Date("2026-03-10T15:00:00").getTime();
const TODAY = new Date(NOW).toDateString();
const YESTERDAY = new Date(NOW - 86400000).toDateString();
const LONG_AGO = new Date(NOW - 5 * 86400000).toDateString();

describe("progressAfterCompleting", () => {
  it("first ever completion starts a streak of 1 and moves to day 2", () => {
    const { progress, streak } = progressAfterCompleting(FRESH_PROGRESS, 1, TODAY, NOW);
    expect(streak).toBe(1);
    expect(progress).toEqual({
      current_day: 2,
      completed_days: [1],
      last_activity_date: TODAY,
      streak_count: 1,
      longest_streak: 1,
    });
  });

  it("extends the streak when yesterday was active", () => {
    const before = {
      ...FRESH_PROGRESS,
      current_day: 4,
      completed_days: [1, 2, 3],
      last_activity_date: YESTERDAY,
      streak_count: 3,
      longest_streak: 3,
    };
    const { progress, streak } = progressAfterCompleting(before, 4, TODAY, NOW);
    expect(streak).toBe(4);
    expect(progress.streak_count).toBe(4);
    expect(progress.longest_streak).toBe(4);
    expect(progress.completed_days).toEqual([1, 2, 3, 4]);
  });

  it("does not add to the streak for a second completion on the same day", () => {
    const before = {
      ...FRESH_PROGRESS,
      current_day: 3,
      completed_days: [1, 2],
      last_activity_date: TODAY,
      streak_count: 2,
      longest_streak: 2,
    };
    const { progress, streak } = progressAfterCompleting(before, 3, TODAY, NOW);
    expect(streak).toBe(2);
    expect(progress.streak_count).toBe(2);
    expect(progress.current_day).toBe(4);
  });

  it("restarts at 1 after a gap but keeps the longest streak", () => {
    const before = {
      ...FRESH_PROGRESS,
      current_day: 10,
      completed_days: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      last_activity_date: LONG_AGO,
      streak_count: 9,
      longest_streak: 9,
    };
    const { progress, streak } = progressAfterCompleting(before, 10, TODAY, NOW);
    expect(streak).toBe(1);
    expect(progress.streak_count).toBe(1);
    expect(progress.longest_streak).toBe(9);
  });

  it("does not modify the progress it was given", () => {
    const before = { ...FRESH_PROGRESS, completed_days: [] };
    progressAfterCompleting(before, 1, TODAY, NOW);
    expect(before).toEqual(FRESH_PROGRESS);
    expect(FRESH_PROGRESS.completed_days).toEqual([]);
  });
});
