export const COLORS = {
  bg: "#0B1220",
  card: "#131C2E",
  cardHover: "#182238",
  border: "#25314A",
  accent: "#3B82F6",
  accentSoft: "rgba(59,130,246,0.14)",
  hard: "#F59E0B",
  hardSoft: "rgba(245,158,11,0.14)",
  gold: "#F5B841",
  goldSoft: "rgba(245,184,65,0.14)",
  frBlue: "#2E4A9E",
  frRed: "#B23A48",
  text: "#E8EDF6",
  muted: "#8291AB",
  success: "#22C55E",
  successSoft: "rgba(34,197,94,0.14)",
};

const GLOBAL_CSS =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&display=swap'); html, body { height: 100%; margin: 0; background: " +
  COLORS.bg +
  "; } input[type='number']::-webkit-inner-spin-button, input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } input[type='number'] { -moz-appearance: textfield; appearance: textfield; }";

export function GlobalStyle() {
  return <style>{GLOBAL_CSS}</style>;
}
