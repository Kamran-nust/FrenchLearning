import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { installWindowStorage } from "./lib/windowStorage";
import { installTtsShim } from "./lib/ttsShim";

const COLORS = {
  bg: "#0B1220",
  card: "#131C2E",
  border: "#25314A",
  accent: "#3B82F6",
  text: "#E8EDF6",
  muted: "#8291AB",
};

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      installWindowStorage(session.user.id);
      installTtsShim();
    }
  }, [session]);

  async function sendLink(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setSending(false);
    if (error) {
      setError(error.message);
    } else {
      setLinkSent(true);
    }
  }

  if (session === undefined) {
    return (
      <div style={wrap}>
        <div style={{ color: COLORS.muted, fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (session) {
    return children;
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6, color: COLORS.text }}>
          French NCLC 7 Study App
        </div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 20 }}>
          Sign in with your email to sync your progress.
        </div>
        {linkSent ? (
          <div style={{ fontSize: 13, color: COLORS.text }}>
            Check <strong>{email}</strong> for a sign-in link.
          </div>
        ) : (
          <form onSubmit={sendLink}>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input}
            />
            <button type="submit" disabled={sending} style={button}>
              {sending ? "Sending…" : "Send magic link"}
            </button>
            {error && <div style={{ color: "#F87171", fontSize: 12, marginTop: 10 }}>{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: COLORS.bg,
  padding: 24,
  fontFamily: "'IBM Plex Sans', sans-serif",
};

const card = {
  width: "100%",
  maxWidth: 360,
  background: COLORS.card,
  border: "1px solid " + COLORS.border,
  borderRadius: 16,
  padding: 28,
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid " + COLORS.border,
  background: COLORS.bg,
  color: COLORS.text,
  fontSize: 14,
  marginBottom: 12,
  outline: "none",
};

const button = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
  background: COLORS.accent,
  color: "#0B1220",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};
