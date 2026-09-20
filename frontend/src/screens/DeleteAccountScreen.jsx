import { useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { useTier } from "../TierContext.jsx";
import { supabase } from "../lib/supabaseClient";
import { deleteAccount, canConfirmDelete, DELETE_WORD } from "../lib/accountDeletion";

const MESSAGES = {
  wrong_password: "That password isn't right.",
  super_not_allowed: "Super accounts can't be deleted here.",
  sign_in: "Your session expired. Sign in again to continue.",
  other: "Couldn't delete the account. Try again in a moment.",
};

const fieldStyle = { background: COLORS.card, border: "1px solid " + COLORS.border, color: COLORS.text };

export default function DeleteAccountScreen({ onBack }) {
  const { tier, loading } = useTier();
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function confirmDelete() {
    if (!canConfirmDelete(typed, password) || busy) return;
    setBusy(true);
    setError("");
    try {
      await deleteAccount(password);
      setDone(true);
    } catch (e) {
      setError(MESSAGES[e && e.code] || MESSAGES.other);
    }
    setBusy(false);
  }

  const isSuper = !loading && tier === "super";

  return (
    <div
      style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }}
      className="min-h-screen"
    >
      <GlobalStyle />
      <div className="w-full max-w-md mx-auto px-5 pt-6 pb-10">
        {!done && (
          <div className="flex items-center gap-2 mb-6">
            <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
              <ChevronLeft size={16} color={COLORS.muted} />
            </button>
            <div className="text-xs" style={{ color: COLORS.muted }}>
              Account
            </div>
          </div>
        )}

        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.5rem" }} className="mb-2">
          {done ? "Account deleted" : "Delete your account"}
        </h2>

        {done ? (
          <>
            <p className="text-sm mb-5" style={{ color: COLORS.muted }}>
              Your account and everything saved with it has been deleted.
            </p>
            <button
              onClick={() => supabase.auth.signOut({ scope: "local" })}
              className="w-full py-2.5 rounded-xl text-sm font-medium"
              style={{ background: COLORS.accent, color: COLORS.onAccent }}
            >
              Continue
            </button>
          </>
        ) : isSuper ? (
          <p className="text-sm" style={{ color: COLORS.muted }}>
            Super accounts can't be deleted here.
          </p>
        ) : (
          <>
            <p className="text-sm mb-3" style={{ color: COLORS.muted }}>
              This permanently deletes your account and everything saved with it. It can't be undone.
            </p>
            <ul className="text-xs mb-5 space-y-1 list-disc pl-5" style={{ color: COLORS.muted }}>
              <li>Your progress, streaks and Anki history</li>
              <li>Your Writing entries</li>
              <li>Your Word Bank and any words you added</li>
              <li>Your username and sign-in</li>
            </ul>
            <label className="text-xs block mb-1" style={{ color: COLORS.muted }} htmlFor="del-word">
              Type {DELETE_WORD} to confirm
            </label>
            <input
              id="del-word"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="w-full text-sm rounded-lg px-3 py-2.5 mb-3"
              style={fieldStyle}
            />
            <label className="text-xs block mb-1" style={{ color: COLORS.muted }} htmlFor="del-pass">
              Your password
            </label>
            <input
              id="del-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full text-sm rounded-lg px-3 py-2.5 mb-3"
              style={fieldStyle}
            />
            {error && (
              <p role="alert" className="text-xs mb-3" style={{ color: COLORS.danger }}>
                {error}
              </p>
            )}
            <button
              onClick={confirmDelete}
              disabled={!canConfirmDelete(typed, password) || busy}
              className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              style={{
                background: COLORS.danger,
                color: COLORS.onAccent,
                opacity: !canConfirmDelete(typed, password) || busy ? 0.5 : 1,
              }}
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              Delete my account
            </button>
            <button onClick={onBack} className="w-full mt-2 py-2.5 rounded-xl text-sm" style={{ color: COLORS.muted }}>
              Keep my account
            </button>
          </>
        )}
      </div>
    </div>
  );
}
