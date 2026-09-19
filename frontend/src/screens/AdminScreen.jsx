import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Search, Loader2 } from "lucide-react";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { TIER_ORDER, TIER_LABELS } from "../shared/tiers";
import { supabase } from "../lib/supabaseClient";
import { fetchAdminUsers, changeUserTier } from "../lib/admin";

function formatDate(iso) {
  return iso
    ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "never";
}

function timeAgo(iso) {
  if (!iso) return "never";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 2) return "just now";
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours + "h ago";
  return Math.round(hours / 24) + "d ago";
}

export default function AdminScreen({ onBack }) {
  const [users, setUsers] = useState(null); // null = loading
  const [loadError, setLoadError] = useState("");
  const [myId, setMyId] = useState(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState({}); // userId -> true while a change is being saved
  const [rowError, setRowError] = useState({}); // userId -> message

  async function load() {
    setLoadError("");
    try {
      setUsers(await fetchAdminUsers());
    } catch (e) {
      setLoadError("Couldn't load users. " + (e && e.message ? e.message : ""));
      setUsers([]);
    }
  }

  useEffect(() => {
    load();
    supabase.auth.getSession().then(({ data }) => setMyId(data.session ? data.session.user.id : null));
  }, []);

  async function setTier(user, tier) {
    if (tier === user.tier) return;
    if (
      tier === "super" &&
      !window.confirm("Make " + (user.email || "this user") + " a super user? Super users can change everyone's tier.")
    )
      return;
    setSaving((s) => ({ ...s, [user.user_id]: true }));
    setRowError((e) => ({ ...e, [user.user_id]: "" }));
    try {
      await changeUserTier(user.user_id, tier);
      setUsers((list) => list.map((u) => (u.user_id === user.user_id ? { ...u, tier } : u)));
    } catch (e) {
      setRowError((er) => ({ ...er, [user.user_id]: (e && e.message) || "Couldn't change the tier." }));
    } finally {
      setSaving((s) => ({ ...s, [user.user_id]: false }));
    }
  }

  const counts = useMemo(() => {
    const c = { free: 0, premium: 0, super: 0 };
    (users || []).forEach((u) => {
      if (c[u.tier] !== undefined) c[u.tier] += 1;
    });
    return c;
  }, [users]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users || [];
    return (users || []).filter(
      (u) => (u.email || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q),
    );
  }, [users, query]);

  return (
    <div
      style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }}
      className="min-h-screen"
    >
      <GlobalStyle />
      <div className="w-full max-w-md mx-auto px-5 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            Admin
          </div>
        </div>

        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.5rem" }} className="mb-1">
          Users
        </h2>
        <p className="text-xs mb-4" style={{ color: COLORS.muted }}>
          Change what each person can use. Changes apply on their next page load.
        </p>

        {users && users.length > 0 && (
          <div className="flex gap-2 mb-4 text-xs">
            {TIER_ORDER.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-full"
                style={{ background: COLORS.accentSoft, color: COLORS.text }}
              >
                {counts[t]} {TIER_LABELS[t].toLowerCase()}
              </span>
            ))}
          </div>
        )}

        <div className="relative mb-4">
          <Search size={14} color={COLORS.muted} style={{ position: "absolute", left: 12, top: 13 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or username"
            className="w-full text-sm rounded-lg py-2.5 pr-3"
            style={{
              paddingLeft: 34,
              background: COLORS.card,
              border: "1px solid " + COLORS.border,
              color: COLORS.text,
            }}
          />
        </div>

        {users === null && (
          <div className="flex items-center justify-center gap-2 text-sm py-10" style={{ color: COLORS.muted }}>
            <Loader2 size={14} className="animate-spin" /> Loading users…
          </div>
        )}

        {loadError && (
          <div className="text-xs mb-3" style={{ color: COLORS.danger }}>
            {loadError}{" "}
            <button onClick={load} className="underline">
              Retry
            </button>
          </div>
        )}

        {users && users.length > 0 && shown.length === 0 && (
          <div className="text-xs text-center py-6" style={{ color: COLORS.muted }}>
            No one matches "{query}".
          </div>
        )}

        <div className="space-y-2.5">
          {shown.map((u) => {
            const isMe = u.user_id === myId;
            return (
              <div
                key={u.user_id}
                className="rounded-2xl p-4"
                style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {u.username || u.email}
                      {isMe && (
                        <span className="ml-2 text-xs font-normal" style={{ color: COLORS.muted }}>
                          (you)
                        </span>
                      )}
                    </div>
                    {u.username && (
                      <div className="text-xs truncate" style={{ color: COLORS.muted }}>
                        {u.email}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {saving[u.user_id] && <Loader2 size={13} className="animate-spin" color={COLORS.muted} />}
                    <select
                      value={u.tier}
                      disabled={isMe || saving[u.user_id]}
                      onChange={(e) => setTier(u, e.target.value)}
                      aria-label={"Tier for " + (u.email || u.username)}
                      className="text-xs rounded-lg px-2 py-1.5"
                      style={{
                        background: COLORS.bg,
                        border: "1px solid " + COLORS.border,
                        color: COLORS.text,
                        opacity: isMe ? 0.6 : 1,
                      }}
                    >
                      {TIER_ORDER.map((t) => (
                        <option key={t} value={t}>
                          {TIER_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="text-xs mt-2" style={{ color: COLORS.muted }}>
                  Joined {formatDate(u.created_at)} · Last sign-in {timeAgo(u.last_sign_in_at)}
                  {u.feedback_used_24h > 0 &&
                    " · " + u.feedback_used_24h + " AI feedback" + (u.feedback_used_24h === 1 ? "" : "s") + " (24h)"}
                </div>
                {rowError[u.user_id] && (
                  <div className="text-xs mt-2" style={{ color: COLORS.danger }}>
                    {rowError[u.user_id]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
