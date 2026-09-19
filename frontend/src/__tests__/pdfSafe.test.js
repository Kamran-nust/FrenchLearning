import { describe, it, expect } from "vitest";
import { pdfSafe } from "../lib/dayPlanPdf";

describe("pdfSafe", () => {
  it("keeps French accents and typographic punctuation", () => {
    const s = "J'habite à Québec, c'est très bien – œuvre ç É “oui”";
    expect(pdfSafe(s)).toBe(s);
  });
  it("replaces characters the PDF font can't draw", () => {
    expect(pdfSafe("日本 ok")).toBe("?? ok");
  });
  it("turns arrows into ASCII and odd spaces into spaces", () => {
    expect(pdfSafe("a → b")).toBe("a -> b");
    expect(pdfSafe("a b")).toBe("a b");
  });
  it("handles null and numbers", () => {
    expect(pdfSafe(null)).toBe("");
    expect(pdfSafe(5)).toBe("5");
  });
});
