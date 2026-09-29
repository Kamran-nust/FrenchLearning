// Anki "I got it wrong" marks, kept apart from the screen so they can be tested on their own.
//
// While a round is running, the words marked wrong live in memory. When the round finishes they are merged
// into the saved list (each word once) and shown under the "Day N done" buttons. The list is saved to the
// account as `anki-missed` ({ day, words: [{ i, f, e }] }) so it survives closing the app and is the same on
// every device. It is cleared when the person taps "Start next day" (or resets Anki).

export const MISSED_KEY = "anki-missed";
export const EMPTY_MISSED = { day: null, words: [] };

// The saved value, checked and tidied; anything unreadable counts as an empty list.
export function parseMissed(saved) {
  if (!saved || typeof saved !== "object" || !Array.isArray(saved.words)) return EMPTY_MISSED;
  const seen = new Set();
  const words = [];
  for (const w of saved.words) {
    if (!w || typeof w.i !== "string" || typeof w.f !== "string" || typeof w.e !== "string" || seen.has(w.i)) continue;
    seen.add(w.i);
    words.push({ i: w.i, f: w.f, e: w.e });
  }
  const day = Number.isInteger(saved.day) ? saved.day : null;
  return { day, words };
}

// Marks or unmarks one card in the current round. `round` is a plain object keyed by card id.
export function toggleMissed(round, card) {
  const next = { ...round };
  if (next[card.i]) delete next[card.i];
  else next[card.i] = { i: card.i, f: card.f, e: card.e };
  return next;
}

// The saved list plus this round's marks, each word once, in the order they were first marked.
export function mergeMissed(words, round) {
  const out = [...words];
  const have = new Set(words.map((w) => w.i));
  for (const w of Object.values(round)) {
    if (!have.has(w.i)) {
      have.add(w.i);
      out.push(w);
    }
  }
  return out;
}

// The missed words that aren't flagged hard yet (what "Flag all as hard" would add).
export function unflagged(words, hardSet) {
  return words.filter((w) => !hardSet.has(w.i));
}
