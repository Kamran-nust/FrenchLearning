// Shared helpers around the window.storage shim (see ../lib/windowStorage.js)
// used by every module's own load/persist logic.

export function todayKey() {
  return new Date().toDateString();
}

export function waitForStorage(maxAttempts, intervalMs) {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      if (typeof window !== "undefined" && window.storage) {
        resolve(true);
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        resolve(false);
        return;
      }
      setTimeout(check, intervalMs);
    };
    check();
  });
}

export async function diagnoseStorage() {
  if (typeof window === "undefined" || !window.storage) {
    return { ok: false, message: "window.storage is not present in this environment." };
  }
  try {
    await window.storage.set("__diag__", "ok", false);
  } catch (e) {
    return { ok: false, message: "storage.set failed: " + (e && e.message ? e.message : String(e)) };
  }
  try {
    const r = await window.storage.get("__diag__", false);
    if (!r || r.value !== "ok") {
      return { ok: false, message: "storage.get returned unexpected value: " + JSON.stringify(r) };
    }
  } catch (e) {
    return { ok: false, message: "storage.get failed: " + (e && e.message ? e.message : String(e)) };
  }
  return { ok: true, message: "" };
}
