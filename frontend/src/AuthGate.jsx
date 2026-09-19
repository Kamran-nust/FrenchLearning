import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { installWindowStorage } from "./lib/windowStorage";
import { installTtsShim } from "./lib/ttsShim";
import SessionBar from "./SessionBar.jsx";
import { signInWithUsername } from "./lib/usernameSignIn";

const COLORS = {
  bg: "#0B1220",
  card: "#131C2E",
  border: "#25314A",
  accent: "#3B82F6",
  text: "#E8EDF6",
  muted: "#8291AB",
};

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loginMethod, setLoginMethod] = useState("email"); // "email" | "username"
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmSent, setConfirmSent] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordSaved, setNewPasswordSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      // Fires when the session came from a password-recovery link - a
      // session exists at this point, but the point of that link was to
      // set a new password, not to silently drop them straight into the
      // app with whatever password they had before (or none at all).
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      installWindowStorage(session.user.id);
      installTtsShim();
      // Don't keep the typed password in memory after signing in - otherwise
      // it would reappear in the form after logging out.
      setPassword("");
      setError("");
    }
  }, [session]);

  async function submit(e) {
    e.preventDefault();
    const byUsername = mode === "signin" && loginMethod === "username";
    if (!(byUsername ? loginName.trim() : email.trim()) || !password) return;
    setSubmitting(true);
    setError("");
    if (byUsername) {
      const message = await signInWithUsername(loginName.trim(), password);
      setSubmitting(false);
      if (message) setError(message);
    } else if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setSubmitting(false);
      if (error) setError(error.message);
    } else {
      const name = username.trim();
      if (!USERNAME_RE.test(name)) {
        setSubmitting(false);
        setError("Username must be 3–20 characters: letters, numbers or underscore.");
        return;
      }
      const { data: free, error: checkError } = await supabase.rpc("username_available", { name });
      if (checkError) {
        setSubmitting(false);
        setError("Couldn't check that username. Try again.");
        return;
      }
      if (!free) {
        setSubmitting(false);
        setError("That username is taken.");
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin, data: { username: name } },
      });
      setSubmitting(false);
      if (error) {
        setError(error.message);
      } else if (!data.session) {
        // Project has "Confirm email" on - account created but needs a
        // one-time email confirmation before it can sign in.
        setConfirmSent(true);
      }
    }
  }

  async function submitNewPassword(e) {
    e.preventDefault();
    if (!newPassword) return;
    setSubmitting(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setNewPasswordSaved(true);
      setRecovering(false);
    }
  }

  if (session === undefined) {
    return (
      <div style={wrap}>
        <div style={{ color: COLORS.muted, fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (recovering) {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6, color: COLORS.text }}>
            Set a new password
          </div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 20 }}>
            {newPasswordSaved
              ? "Password updated."
              : "Choose a new password for " + (session?.user?.email || "your account") + "."}
          </div>
          {newPasswordSaved ? (
            <button onClick={() => setRecovering(false)} style={button}>
              Continue
            </button>
          ) : (
            <form onSubmit={submitNewPassword}>
              <input
                type="password"
                required
                minLength={6}
                placeholder="new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={input}
              />
              <button type="submit" disabled={submitting} style={button}>
                {submitting ? "Saving…" : "Save password"}
              </button>
              {error && <div style={{ color: "#F87171", fontSize: 12, marginTop: 10 }}>{error}</div>}
            </form>
          )}
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <>
        <SessionBar userId={session.user.id} email={session.user.email} />
        {children}
      </>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6, color: COLORS.text }}>
          French NCLC 7 Study App
        </div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 20 }}>
          {mode === "signin" ? "Sign in to sync your progress." : "Create an account to sync your progress."}
        </div>
        {confirmSent ? (
          <div style={{ fontSize: 13, color: COLORS.text }}>
            Check <strong>{email}</strong> to confirm your account, then sign in.
          </div>
        ) : (
          <form onSubmit={submit}>
            {mode === "signin" && (
              <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 13, color: COLORS.muted }}>
                {[
                  ["email", "Email"],
                  ["username", "Username"],
                ].map(([value, text]) => (
                  <label key={value} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="loginMethod"
                      value={value}
                      checked={loginMethod === value}
                      onChange={() => {
                        setLoginMethod(value);
                        setError("");
                      }}
                    />
                    {text}
                  </label>
                ))}
              </div>
            )}
            {mode === "signin" && loginMethod === "username" ? (
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="username"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                style={input}
              />
            ) : (
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={input}
              />
            )}
            {mode === "signup" && (
              <input
                type="text"
                required
                minLength={3}
                maxLength={20}
                autoComplete="username"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={input}
              />
            )}
            <input
              type="password"
              required
              minLength={6}
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input}
            />
            <button type="submit" disabled={submitting} style={button}>
              {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
            {error && <div style={{ color: "#F87171", fontSize: 12, marginTop: 10 }}>{error}</div>}
          </form>
        )}
        {!confirmSent && (
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
            }}
            style={linkButton}
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
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

const linkButton = {
  display: "block",
  width: "100%",
  marginTop: 16,
  background: "none",
  border: "none",
  color: COLORS.muted,
  fontSize: 12,
  cursor: "pointer",
  textAlign: "center",
};
