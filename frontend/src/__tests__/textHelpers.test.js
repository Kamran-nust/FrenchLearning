import { describe, it, expect } from "vitest";
import { splitLessonChips } from "../shared/textHelpers";

describe("splitLessonChips", () => {
  it("splits on semicolons and trims", () => {
    expect(splitLessonChips("a; b ;c")).toEqual(["a", "b", "c"]);
  });
  it("drops empty pieces", () => {
    expect(splitLessonChips("a;; ;b;")).toEqual(["a", "b"]);
  });
  it("keeps a single chip whole", () => {
    expect(splitLessonChips("Conjugate être in the present")).toEqual(["Conjugate être in the present"]);
  });
  it("returns nothing for blank text", () => {
    expect(splitLessonChips("  ")).toEqual([]);
  });
});
