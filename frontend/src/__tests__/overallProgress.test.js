import { describe, it, expect, beforeEach } from "vitest";
import { loadFullyCompletedThrough } from "../lib/overallProgress";

const KEYS = ["progress", "grammar-progress", "kwiziq-progress", "tv5-progress", "writing-progress"];

function fakeStorage(byKey) {
  window.storage = {
    get: async (key) => (byKey[key] === undefined ? null : { value: JSON.stringify({ completed_days: byKey[key] }) }),
  };
}
const range = (n) => Array.from({ length: n }, (_, i) => i + 1);

describe("loadFullyCompletedThrough", () => {
  beforeEach(() => {
    delete window.storage;
  });

  it("is the highest day every module has completed, counting from day 1", async () => {
    fakeStorage({
      progress: range(10),
      "grammar-progress": range(7),
      "kwiziq-progress": range(9),
      "tv5-progress": range(8),
      "writing-progress": range(12),
    });
    expect(await loadFullyCompletedThrough(301)).toBe(7);
  });

  it("stops at the first gap", async () => {
    fakeStorage(Object.fromEntries(KEYS.map((k) => [k, [1, 2, 4, 5]])));
    expect(await loadFullyCompletedThrough(301)).toBe(2);
  });

  it("is 0 when a module has nothing saved", async () => {
    fakeStorage({ progress: range(5) });
    expect(await loadFullyCompletedThrough(301)).toBe(0);
  });

  it("never exceeds the total", async () => {
    fakeStorage(Object.fromEntries(KEYS.map((k) => [k, range(20)])));
    expect(await loadFullyCompletedThrough(10)).toBe(10);
  });

  it("returns null when storage can't be read", async () => {
    window.storage = {
      get: async () => {
        throw new Error("boom");
      },
    };
    expect(await loadFullyCompletedThrough(301)).toBe(null);
  });
});
