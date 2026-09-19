import { describe, it, expect, beforeEach } from "vitest";
import { todayKey, waitForStorage, diagnoseStorage } from "../shared/storage";

describe("storage helpers", () => {
  beforeEach(() => {
    delete window.storage;
  });

  it("todayKey is stable within a day", () => {
    expect(todayKey()).toBe(todayKey());
  });

  it("waitForStorage resolves true once storage appears, false if it never does", async () => {
    setTimeout(() => (window.storage = {}), 20);
    expect(await waitForStorage(20, 10)).toBe(true);
    delete window.storage;
    expect(await waitForStorage(3, 5)).toBe(false);
  });

  it("diagnoseStorage reports a missing shim and a working one", async () => {
    expect((await diagnoseStorage()).ok).toBe(false);
    const mem = {};
    window.storage = { set: async (k, v) => (mem[k] = v), get: async (k) => ({ value: mem[k] }) };
    expect((await diagnoseStorage()).ok).toBe(true);
  });

  it("diagnoseStorage reports a failing write", async () => {
    window.storage = {
      set: async () => {
        throw new Error("nope");
      },
      get: async () => null,
    };
    const r = await diagnoseStorage();
    expect(r.ok).toBe(false);
    expect(r.message).toContain("nope");
  });
});
