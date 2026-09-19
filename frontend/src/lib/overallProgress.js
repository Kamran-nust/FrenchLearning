import { waitForStorage } from "../shared/storage";

// Storage key each module saves its progress under.
const MODULE_KEYS = ["progress", "grammar-progress", "kwiziq-progress", "tv5-progress", "writing-progress"];

async function loadCompletedDays(key) {
  const r = await window.storage.get(key, false);
  if (!r || !r.value) return new Set();
  const parsed = JSON.parse(r.value);
  return new Set(Array.isArray(parsed.completed_days) ? parsed.completed_days : []);
}

// Highest day N such that every module has completed days 1..N.
// Returns null if storage can't be read.
export async function loadFullyCompletedThrough(totalDays) {
  try {
    if (!(await waitForStorage(10, 300))) return null;
    const sets = await Promise.all(MODULE_KEYS.map(loadCompletedDays));
    let n = 0;
    while (n < totalDays && sets.every((s) => s.has(n + 1))) n += 1;
    return n;
  } catch (e) {
    return null;
  }
}
