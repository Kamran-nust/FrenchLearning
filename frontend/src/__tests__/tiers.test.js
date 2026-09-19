import { describe, it, expect, vi } from "vitest";
import { TIER_ORDER, FEATURES, tierAtLeast, canUse } from "../shared/tiers";

describe("tierAtLeast", () => {
  it("orders free < premium < super", () => {
    expect(tierAtLeast("free", "free")).toBe(true);
    expect(tierAtLeast("free", "premium")).toBe(false);
    expect(tierAtLeast("premium", "premium")).toBe(true);
    expect(tierAtLeast("premium", "super")).toBe(false);
    expect(tierAtLeast("super", "premium")).toBe(true);
  });

  it("denies unknown tiers", () => {
    expect(tierAtLeast("gold", "free")).toBe(false);
    expect(tierAtLeast(undefined, "free")).toBe(false);
    expect(tierAtLeast("free", "gold")).toBe(false);
  });
});

describe("canUse", () => {
  it("applies the feature map", () => {
    expect(canUse("free", "grammarPdf")).toBe(false);
    expect(canUse("premium", "grammarPdf")).toBe(true);
    expect(canUse("premium", "adminPanel")).toBe(false);
    expect(canUse("super", "adminPanel")).toBe(true);
    expect(canUse("free", "dayPlanPdf")).toBe(false);
    expect(canUse("premium", "dayPlanPdf")).toBe(true);
  });

  it("denies an unknown feature for everyone", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(canUse("super", "doesNotExist")).toBe(false);
    warn.mockRestore();
  });

  it("only maps features to real tiers", () => {
    Object.values(FEATURES).forEach((t) => expect(TIER_ORDER).toContain(t));
  });
});
