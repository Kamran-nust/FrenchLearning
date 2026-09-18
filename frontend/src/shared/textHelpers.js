// Shared between Tv5Module and KwiziqModule, both of which render their
// day's task text as a list of semicolon-separated lesson chips.
export function splitLessonChips(text) {
  return text
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
