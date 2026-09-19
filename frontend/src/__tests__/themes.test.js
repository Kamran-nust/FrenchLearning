import { describe, it, expect, beforeEach } from "vitest";
import { THEMES, DEFAULT_THEME, isValidTheme, getSavedTheme, applyTheme, colorVar } from "../shared/themes";

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("theme definitions", () => {
  const ids = Object.keys(THEMES);
  const tokens = Object.keys(THEMES[DEFAULT_THEME].colors).sort();

  it("has four themes including the default", () => {
    expect(ids).toHaveLength(4);
    expect(ids).toContain(DEFAULT_THEME);
  });

  it.each(ids)("%s defines exactly the same tokens as the default", (id) => {
    expect(Object.keys(THEMES[id].colors).sort()).toEqual(tokens);
  });

  // WCAG AA for normal text is 4.5:1
  it.each(ids)("%s keeps text readable (WCAG AA)", (id) => {
    const c = THEMES[id].colors;
    expect(contrast(c.text, c.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.text, c.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.muted, c.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.muted, c.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.onAccent, c.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.danger, c.bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("theme selection", () => {
  beforeEach(() => localStorage.clear());

  it("validates ids", () => {
    expect(isValidTheme("paper")).toBe(true);
    expect(isValidTheme("nope")).toBe(false);
    expect(isValidTheme("__proto__")).toBe(false);
    expect(isValidTheme(null)).toBe(false);
  });

  it("falls back to the default when nothing or junk is saved", () => {
    expect(getSavedTheme()).toBe(DEFAULT_THEME);
    localStorage.setItem("theme", "hacked");
    expect(getSavedTheme()).toBe(DEFAULT_THEME);
  });

  it("applies, saves and restores a theme", () => {
    const id = Object.keys(THEMES).find((k) => k !== DEFAULT_THEME);
    expect(applyTheme(id)).toBe(id);
    expect(document.documentElement.getAttribute("data-theme")).toBe(id);
    expect(getSavedTheme()).toBe(id);
  });

  it("applies the default for an invalid id", () => {
    expect(applyTheme("bogus")).toBe(DEFAULT_THEME);
  });

  it("maps a token to a CSS variable", () => {
    expect(colorVar("accent")).toBe("var(--c-accent)");
  });
});
