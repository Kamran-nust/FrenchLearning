import { useState, useEffect, useRef } from "react";
import { Palette } from "lucide-react";
import { COLORS } from "./shared/theme.jsx";
import { THEMES, getSavedTheme, applyTheme, isValidTheme } from "./shared/themes";
import { waitForStorage } from "./shared/storage";

const ACCOUNT_KEY = "theme";

export default function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(getSavedTheme());
  const rootRef = useRef(null);
  const pickedByUser = useRef(false);

  // The theme is also saved on the account, so it follows you between devices.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!(await waitForStorage(10, 300))) return;
        const r = await window.storage.get(ACCOUNT_KEY, false);
        const saved = r && r.value ? JSON.parse(r.value) : null;
        if (!cancelled && !pickedByUser.current && isValidTheme(saved)) {
          setCurrent(applyTheme(saved));
        }
      } catch {
        // No saved theme, or storage unavailable - keep the device's theme.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function choose(id) {
    pickedByUser.current = true;
    setCurrent(applyTheme(id));
    setOpen(false);
    try {
      await window.storage.set(ACCOUNT_KEY, JSON.stringify(id), false);
    } catch {
      // The theme still applies on this device even if saving to the account failed.
    }
  }

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        aria-expanded={open}
        className="flex items-center gap-1"
        style={{ color: COLORS.muted }}
      >
        <Palette size={13} />
        Theme
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            zIndex: 50,
            background: COLORS.card,
            border: "1px solid " + COLORS.border,
            borderRadius: 14,
            padding: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            display: "flex",
            gap: 12,
          }}
        >
          {Object.entries(THEMES).map(([id, theme]) => {
            const active = id === current;
            return (
              <button
                key={id}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(id)}
                className="flex flex-col items-center gap-1.5"
                style={{ color: active ? COLORS.text : COLORS.muted, minWidth: 52 }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, " + theme.colors.bg + " 50%, " + theme.colors.accent + " 50%)",
                    border: "2px solid " + theme.colors.border,
                    boxShadow: active ? "0 0 0 2px " + COLORS.card + ", 0 0 0 4px " + COLORS.accent : "none",
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>{theme.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
