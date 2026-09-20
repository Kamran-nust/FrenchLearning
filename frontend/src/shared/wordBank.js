// Word Bank logic that needs no screen or network, so it can be tested on its own.
// The database (migration 0010) enforces the same limits; these are for showing the person where they stand.

// How many of their own words a tier may add. Starter words never count.
// Super has no limit in practice; the ceiling only stops a runaway paste filling the database.
export const OWN_WORD_LIMITS = { premium: 500, super: 20000 };
export const SUPER_IS_UNLIMITED = true;

export const MAX_FRENCH = 200;
export const MAX_ENGLISH = 200;
export const MAX_NOTE = 300;

export function ownWordLimit(tier) {
  return OWN_WORD_LIMITS[tier] || 0;
}

export function isOwn(word) {
  return !word.starter_id;
}

export function ownWordCount(words) {
  return words.filter(isOwn).length;
}

export function hasRoom(tier, words) {
  return ownWordCount(words) < ownWordLimit(tier);
}

// Collapses stray spaces so "  le   pain " and "le pain" are the same word.
export function cleanWord({ french, english, note }) {
  const tidy = (s) => (s || "").replace(/\s+/g, " ").trim();
  return { french: tidy(french), english: tidy(english), note: tidy(note) || null };
}

// Returns a message to show, or null if the word can be saved.
export function validateWord(fields) {
  const w = cleanWord(fields);
  if (!w.french) return "Enter the French word.";
  if (!w.english) return "Enter the English meaning.";
  if (w.french.length > MAX_FRENCH || w.english.length > MAX_ENGLISH)
    return "That's too long. Keep each side under 200 characters.";
  if (w.note && w.note.length > MAX_NOTE) return "The note is too long. Keep it under 300 characters.";
  return null;
}

export function isDuplicate(words, fields, ignoreId) {
  const w = cleanWord(fields);
  return words.some(
    (x) =>
      !x.hidden &&
      x.id !== ignoreId &&
      x.french.toLowerCase() === w.french.toLowerCase() &&
      x.english.toLowerCase() === w.english.toLowerCase(),
  );
}

// Searches both languages and the note.
export function filterWords(words, query) {
  const q = query.trim().toLowerCase();
  if (!q) return words;
  return words.filter(
    (w) =>
      w.french.toLowerCase().includes(q) ||
      w.english.toLowerCase().includes(q) ||
      (w.note || "").toLowerCase().includes(q),
  );
}

// The order shown: the person's own words (newest first), then the starter words in their original order.
export function sortForDisplay(words) {
  const own = words
    .filter(isOwn)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
  const starter = words.filter((w) => !isOwn(w));
  return [...own, ...starter];
}

// Word Bank rows as Anki flashcards. Hidden words are left out. The id starts with "wb:" so it can
// never clash with a built-in card id, and the hard-word marks and card stats work the same way.
export function toAnkiCards(words) {
  return words
    .filter((w) => !w.hidden)
    .map((w) => ({ i: "wb:" + w.id, f: w.french, e: w.english, sourceDay: w.added_day || 1, custom: true }));
}

// Splits a session's review slots between the built-in words and Word Bank words. Word Bank gets about a
// quarter (at least one) so a long list can't crowd out the plan, but fills the gap when there are too few
// built-in words to review yet (for example on day 1).
export function splitReviewSlots(target, builtinCount, customCount) {
  if (customCount <= 0 || target <= 0) return { builtin: Math.min(target, builtinCount), custom: 0 };
  const quota = Math.max(1, Math.ceil(target / 4));
  const custom = Math.min(customCount, Math.max(quota, target - builtinCount));
  const builtin = Math.max(0, Math.min(builtinCount, target - custom));
  return { builtin, custom };
}
