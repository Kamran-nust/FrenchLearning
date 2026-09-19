// Colour themes. Each theme gives a value to every token; components read
// tokens through COLORS (see theme.jsx), which points at CSS variables, so
// switching themes never touches component code.

export const THEMES = {
  midnight: {
    label: "Midnight",
    colors: {
      bg: "#0B1220",
      card: "#131C2E",
      cardHover: "#182238",
      border: "#25314A",
      accent: "#3B82F6",
      accentSoft: "rgba(59,130,246,0.14)",
      onAccent: "#0B1220",
      hard: "#F59E0B",
      hardSoft: "rgba(245,158,11,0.14)",
      gold: "#F5B841",
      goldSoft: "rgba(245,184,65,0.14)",
      frBlue: "#2E4A9E",
      frRed: "#B23A48",
      stripe: "#EDE7DA",
      text: "#E8EDF6",
      muted: "#8291AB",
      success: "#22C55E",
      successSoft: "rgba(34,197,94,0.14)",
      link: "#93C5FD",
      danger: "#F87171",
      warnText: "#F5C77E",
    },
  },
  paper: {
    label: "Paper",
    colors: {
      bg: "#F6F7F9",
      card: "#FFFFFF",
      cardHover: "#F0F2F6",
      border: "#E2E6EE",
      accent: "#2563EB",
      accentSoft: "rgba(37,99,235,0.10)",
      onAccent: "#FFFFFF",
      hard: "#D97706",
      hardSoft: "rgba(217,119,6,0.12)",
      gold: "#7F5600",
      goldSoft: "rgba(127,86,0,0.12)",
      frBlue: "#2E4A9E",
      frRed: "#B23A48",
      stripe: "#B8BFCC",
      text: "#1B2233",
      muted: "#5B667A",
      success: "#15803D",
      successSoft: "rgba(21,128,61,0.12)",
      link: "#1D4ED8",
      danger: "#B91C1C",
      warnText: "#92400E",
    },
  },
  lavender: {
    label: "Lavender",
    colors: {
      bg: "#F3EFFB",
      card: "#FFFFFF",
      cardHover: "#EDE7F8",
      border: "#DDD3F0",
      accent: "#7255D6",
      accentSoft: "rgba(114,85,214,0.11)",
      onAccent: "#FFFFFF",
      hard: "#D97706",
      hardSoft: "rgba(217,119,6,0.12)",
      gold: "#7F5600",
      goldSoft: "rgba(127,86,0,0.12)",
      frBlue: "#4B3FA6",
      frRed: "#B23A48",
      stripe: "#C4B8E2",
      text: "#2A1F4D",
      muted: "#665B8A",
      success: "#15803D",
      successSoft: "rgba(21,128,61,0.12)",
      link: "#5A3FC0",
      danger: "#B91C1C",
      warnText: "#92400E",
    },
  },
  blush: {
    label: "Blush",
    colors: {
      bg: "#FDF1F5",
      card: "#FFFFFF",
      cardHover: "#FAE6EC",
      border: "#F3D3DD",
      accent: "#C43570",
      accentSoft: "rgba(196,53,112,0.10)",
      onAccent: "#FFFFFF",
      hard: "#D97706",
      hardSoft: "rgba(217,119,6,0.12)",
      gold: "#7F5600",
      goldSoft: "rgba(127,86,0,0.12)",
      frBlue: "#2E4A9E",
      frRed: "#B23A48",
      stripe: "#EBC3CF",
      text: "#4A1F2E",
      muted: "#86566A",
      success: "#15803D",
      successSoft: "rgba(21,128,61,0.12)",
      link: "#A82860",
      danger: "#B91C1C",
      warnText: "#92400E",
    },
  },
};

export const DEFAULT_THEME = "midnight";
const STORAGE_KEY = "theme";

const cssVar = (token) => "--c-" + token;

function themeCss() {
  const block = (selector, colors) =>
    selector + "{" + Object.entries(colors).map(([k, v]) => cssVar(k) + ":" + v + ";").join("") + "}";
  return (
    block(":root", THEMES[DEFAULT_THEME].colors) +
    Object.entries(THEMES)
      .map(([id, t]) => block('[data-theme="' + id + '"]', t.colors))
      .join("") +
    "html,body{background:var(--c-bg);}"
  );
}

export function colorVar(token) {
  return "var(" + cssVar(token) + ")";
}

export function isValidTheme(id) {
  return Object.prototype.hasOwnProperty.call(THEMES, id);
}

export function getSavedTheme() {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    return isValidTheme(id) ? id : DEFAULT_THEME;
  } catch (e) {
    return DEFAULT_THEME;
  }
}

export function applyTheme(id) {
  const theme = isValidTheme(id) ? id : DEFAULT_THEME;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    // Private mode etc. - the theme still applies for this session.
  }
  return theme;
}

// Call once before React renders, so the saved theme is on the page from the
// first paint (no flash of the default theme).
export function initTheme() {
  const style = document.createElement("style");
  style.id = "theme-vars";
  style.textContent = themeCss();
  document.head.appendChild(style);
  applyTheme(getSavedTheme());
}
