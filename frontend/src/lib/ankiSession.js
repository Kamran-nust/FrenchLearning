import { DAYS } from "../data/ankiDays";
import { splitReviewSlots } from "../shared/wordBank";
import { superDayTotal, sessionCap } from "../shared/ankiLimits";

const TOTAL_DAYS = DAYS.length;

// Picks `count` cards from `pool`, favouring cards marked hard (5x as likely).
export function weightedSample(pool, hardSet, count) {
  const arr = pool.map((c) => ({ ...c, weight: hardSet.has(c.i) ? 5 : 1 }));
  const out = [];
  for (let n = 0; n < count && arr.length > 0; n++) {
    const total = arr.reduce((s, c) => s + c.weight, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < arr.length; idx++) {
      r -= arr[idx].weight;
      if (r <= 0) break;
    }
    idx = Math.min(idx, arr.length - 1);
    out.push(arr[idx]);
    arr.splice(idx, 1);
  }
  return out;
}

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// customCards: the person's Word Bank words as cards (see toAnkiCards). They join the review pool along
// with the words from earlier days; they are never "new".
// options.tier: the person's tier. Super users get a bigger day (25 rising to 50 cards); free and premium
//   sessions are held to their daily limit. Leave it out and the session is sized as it always was.
// options.practice / options.seen: extra practice may only use what is left of today's allowance.
export function buildSession(progress, hardWordsSet, customCards = [], options = {}) {
  const { tier, practice = false, seen = 0 } = options;
  const dayIdx = progress.current_day - 1;
  if (dayIdx < 0 || dayIdx >= TOTAL_DAYS) return null;
  const dayObj = DAYS[dayIdx];
  const newWords = dayObj.c.map((c) => ({ ...c, sourceDay: dayObj.d }));
  const completedCount = progress.completed_days.length;
  const reviewPool = [];
  for (const d of DAYS) {
    if (d.d < dayObj.d) {
      for (const c of d.c) reviewPool.push({ ...c, sourceDay: d.d });
    }
  }
  let target = Math.round(5 + (35 / 300) * completedCount);
  let newList = newWords;
  if (tier !== undefined) {
    if (tier === "super") target = Math.max(0, superDayTotal(completedCount) - newWords.length);
    const cap = sessionCap(tier, { practice, seen });
    if (cap !== null) {
      newList = newWords.slice(0, cap);
      target = Math.min(target, Math.max(0, cap - newList.length));
    }
  }
  const slots = splitReviewSlots(target, reviewPool.length, customCards.length);
  const picked = [
    ...weightedSample(reviewPool, hardWordsSet, slots.builtin),
    ...weightedSample(customCards, hardWordsSet, slots.custom),
  ];
  // Without Word Bank words the order is exactly as before; with them, mix the two kinds together.
  const reviewSelected = slots.custom > 0 ? shuffle(picked) : picked;
  const reviewCount = reviewSelected.length;

  // New words: always French -> English, one card each, no reverse pass.
  const newItems = newList.map((w) => ({
    ...w,
    dir: "FE",
    key: w.i + "-new-" + dayObj.d,
  }));

  // Review words: one card each, direction chosen at random per card.
  const reviewItems = reviewSelected.map((w) => ({
    ...w,
    dir: Math.random() < 0.5 ? "EF" : "FE",
    key: w.i + "-rev-" + w.sourceDay + "-" + dayObj.d,
  }));

  const words = [...newItems, ...reviewItems];
  return { dayObj, words, queue: words, reviewCount };
}
