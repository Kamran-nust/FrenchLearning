import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { COLORS } from "./shared/theme.jsx";
import ThemePicker from "./ThemePicker.jsx";

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

  async function logout() {
    setSigningOut(true);
    await supabase.auth.signOut();
  }

  return (
    <div style={{ background: COLORS.card, borderBottom: "1px solid " + COLORS.border, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div className="w-full max-w-md mx-auto px-5 py-1.5 flex items-center justify-between text-xs" style={{ color: COLORS.muted }}>
        <span className="truncate">
          Signed in as <strong style={{ color: COLORS.text, fontWeight: 500 }}>{label}</strong>
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
