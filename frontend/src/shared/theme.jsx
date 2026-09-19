import { THEMES, DEFAULT_THEME, colorVar } from "./themes";

// Every token name maps to a CSS variable (defined per theme in themes.js),
// so components keep writing COLORS.bg, COLORS.accent, ... and the values
// follow whichever theme is active.
export const COLORS = Object.fromEntries(
  Object.keys(THEMES[DEFAULT_THEME].colors).map((token) => [token, colorVar(token)])
);

const GLOBAL_CSS =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&display=swap'); html, body { height: 100%; margin: 0; background: " +
  COLORS.bg +
  "; } input[type='number']::-webkit-inner-spin-button, input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } input[type='number'] { -moz-appearance: textfield; appearance: textfield; }";

export function GlobalStyle() {
  return <style>{GLOBAL_CSS}</style>;
}
