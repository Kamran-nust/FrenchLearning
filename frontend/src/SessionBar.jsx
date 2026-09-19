import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { COLORS } from "./shared/theme.jsx";
import ThemePicker from "./ThemePicker.jsx";
import { useTier } from "./TierContext.jsx";
import { TIER_LABELS } from "./shared/tiers";
import { OPEN_PLANS_EVENT } from "./shared/plans";

export default function SessionBar({ userId, email }) {
  const [signingOut, setSigningOut] = useState(false);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("profiles")
      .select("username")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setUsername(data ? data.username : null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const label = username || email;
  const { tier, loading } = useTier();

  async function logout() {
    setSigningOut(true);
    await supabase.auth.signOut();
  }

  return (
    <div
      style={{
        background: COLORS.card,
        borderBottom: "1px solid " + COLORS.border,
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      <div
        className="w-full max-w-md mx-auto px-5 py-1.5 flex items-center justify-between text-xs"
        style={{ color: COLORS.muted }}
      >
        <span className="truncate flex items-center gap-2">
          <span className="truncate">
            Signed in as <strong style={{ color: COLORS.text, fontWeight: 500 }}>{label}</strong>
          </span>
          {!loading && tier === "free" && (
            <button
              onClick={() => window.dispatchEvent(new Event(OPEN_PLANS_EVENT))}
              className="shrink-0 px-2 py-0.5 rounded-full"
              style={{ fontSize: 10, fontWeight: 600, background: COLORS.accent, color: COLORS.onAccent }}
            >
              Go Premium
            </button>
          )}
          {!loading && (
            <span
              className="shrink-0 px-2 py-0.5 rounded-full"
              style={{
                fontSize: 10,
                fontWeight: 600,
                background: tier === "super" ? COLORS.goldSoft : COLORS.accentSoft,
                color: tier === "super" ? COLORS.gold : tier === "premium" ? COLORS.link : COLORS.muted,
              }}
            >
              {TIER_LABELS[tier]}
            </span>
          )}
        </span>
        <div className="flex items-center gap-4 shrink-0 ml-3">
          <ThemePicker />
          <button
            onClick={logout}
            disabled={signingOut}
            className="flex items-center gap-1"
            style={{ color: COLORS.muted, opacity: signingOut ? 0.5 : 1 }}
          >
            <LogOut size={12} />
            {signingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </div>
    </div>
  );
}
