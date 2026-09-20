// Daily limits for the Anki vocabulary section, per tier, and how big a day is for Super users.
// Kept apart from the screen so it can be tested on its own.
//
// NOTE: Anki runs on the person's own device, so the daily counter is kept there too (with their other
// saved progress). It stops normal use but a determined person could reset it. Making it server-side
// is a later, bigger change (see "Later: server-side Anki limits" in DESIGN_DOC.md).

// Words (cards) a person can see per day. null = no limit.
export const DAILY_WORD_LIMITS = { free: 30, premium: 200, super: null };

// Super users' day: the total cards needed to complete a day (new words plus reviews). It rises steadily
// from SUPER_DAY_MIN at the start of the plan to SUPER_DAY_MAX at the end. Change these two to retune it.
export const SUPER_DAY_MIN = 25;
export const SUPER_DAY_MAX = 50;

// Unknown tiers count as free, so a mistake can only ever restrict, never unlock.
export function dailyLimit(tier) {
  return tier in DAILY_WORD_LIMITS ? DAILY_WORD_LIMITS[tier] : DAILY_WORD_LIMITS.free;
}

// Cards in a Super user's day once `completedDays` days are done (25 at 0, 50 at 300 or more).
export function superDayTotal(completedDays) {
  const f = Math.min(1, Math.max(0, completedDays / 300));
  return Math.round(SUPER_DAY_MIN + (SUPER_DAY_MAX - SUPER_DAY_MIN) * f);
}

// How many cards were seen today, from what was saved ({ date, seen }). A saved count from another day is 0.
export function todaysCount(saved, today) {
  if (!saved || saved.date !== today) return 0;
  const n = Number(saved.seen);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

// Cards still allowed today, or null if there is no limit.
export function remainingToday(tier, seen) {
  const limit = dailyLimit(tier);
  return limit === null ? null : Math.max(0, limit - seen);
}

export function limitReached(tier, seen) {
  const left = remainingToday(tier, seen);
  return left !== null && left <= 0;
}

// The most cards a new session may have. A day's own session is only ever held to the daily limit itself, so
// the day can always be completed; extra practice gets only what is left of today's allowance.
export function sessionCap(tier, { practice = false, seen = 0 } = {}) {
  const limit = dailyLimit(tier);
  if (limit === null) return null;
  return practice ? Math.max(0, limit - seen) : limit;
}
