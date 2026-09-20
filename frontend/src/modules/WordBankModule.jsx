import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Lock, Loader2, Plus, Pencil, Trash2, Search, RotateCcw } from "lucide-react";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { useTier } from "../TierContext.jsx";
import { readSaved } from "../shared/storage";
import { fetchWordBank, addWord, updateWord, removeWord, resetStarterWords } from "../lib/wordBank";
import {
  ownWordLimit,
  ownWordCount,
  hasRoom,
  validateWord,
  isDuplicate,
  filterWords,
  sortForDisplay,
  isOwn,
  MAX_FRENCH,
  MAX_ENGLISH,
  MAX_NOTE,
} from "../shared/wordBank";

const PAGE = 100;
const TOTAL_DAYS = 301;

const fieldStyle = {
  background: COLORS.card,
  border: "1px solid " + COLORS.border,
  color: COLORS.text,
};

// The day the person is on in Anki, stamped on each word they add (1 if it can't be read).
async function currentDay() {
  const r = await readSaved("progress");
  const d = r.ok && r.value ? Number(r.value.current_day) : 1;
  return Number.isFinite(d) ? Math.max(1, Math.min(TOTAL_DAYS, Math.round(d))) : 1;
}

function Shell({ onBack, children }) {
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
            Word Bank
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function WordFields({ draft, setDraft, onEnter, labelPrefix = "" }) {
  return (
    <div className="space-y-2">
      <input
        value={draft.french}
        onChange={(e) => setDraft({ ...draft, french: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        maxLength={MAX_FRENCH}
        placeholder="French, for example le fromage"
        aria-label={labelPrefix + "French"}
        className="w-full text-sm rounded-lg px-3 py-2.5"
        style={fieldStyle}
      />
      <input
        value={draft.english}
        onChange={(e) => setDraft({ ...draft, english: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        maxLength={MAX_ENGLISH}
        placeholder="English, for example cheese"
        aria-label={labelPrefix + "English"}
        className="w-full text-sm rounded-lg px-3 py-2.5"
        style={fieldStyle}
      />
      <input
        value={draft.note}
        onChange={(e) => setDraft({ ...draft, note: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        maxLength={MAX_NOTE}
        placeholder="Note (optional)"
        aria-label={labelPrefix + "Note"}
        className="w-full text-sm rounded-lg px-3 py-2.5"
        style={fieldStyle}
      />
    </div>
  );
}

const EMPTY = { french: "", english: "", note: "" };

export default function WordBankModule({ onBack, onOpenPlans }) {
  const { tier, loading: tierLoading, can } = useTier();
  const allowed = !tierLoading && can("wordBank");

  const [words, setWords] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [showCount, setShowCount] = useState(PAGE);
  const [draft, setDraft] = useState(EMPTY);
  const [addError, setAddError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(EMPTY);
  const [editError, setEditError] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState("");

  async function load() {
    setLoadError(false);
    try {
      setWords(await fetchWordBank());
    } catch {
      setLoadError(true);
      setWords([]);
    }
  }

  useEffect(() => {
    if (!allowed) return undefined;
    let cancelled = false;
    fetchWordBank()
      .then((list) => {
        if (!cancelled) setWords(list);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          setWords([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  const visible = useMemo(() => (words || []).filter((w) => !w.hidden), [words]);
  const hiddenStarterCount = (words || []).filter((w) => w.hidden && w.starter_id).length;
  const shown = useMemo(() => filterWords(sortForDisplay(visible), query), [visible, query]);
  const limit = ownWordLimit(tier);
  const ownCount = ownWordCount(visible);

  if (tierLoading) {
    return (
      <Shell onBack={onBack}>
        <div className="flex justify-center py-16">
          <Loader2 size={18} className="animate-spin" color={COLORS.muted} />
        </div>
      </Shell>
    );
  }

  if (!allowed) {
    return (
      <Shell onBack={onBack}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.5rem" }} className="mb-3">
          Word Bank
        </h2>
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}
        >
          <Lock size={20} color={COLORS.accent} className="mx-auto mb-2" />
          <div className="text-sm font-medium mb-1">Word Bank is a Premium feature</div>
          <p className="text-xs mb-4" style={{ color: COLORS.muted }}>
            Keep your own list of French words. They join your Anki reviews from your next session.
          </p>
          {onOpenPlans && (
            <button
              onClick={onOpenPlans}
              className="px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: COLORS.accent, color: COLORS.onAccent }}
            >
              See plans
            </button>
          )}
        </div>
      </Shell>
    );
  }

  async function add() {
    setNotice("");
    const problem = validateWord(draft);
    if (problem) return setAddError(problem);
    if (!hasRoom(tier, visible)) return setAddError("You've reached your limit of " + limit + " words.");
    if (isDuplicate(visible, draft)) return setAddError("That word is already in your list.");
    setBusy(true);
    setAddError("");
    try {
      const day = await currentDay();
      const saved = await addWord(draft, day);
      setWords((prev) => [...(prev || []), saved]);
      setDraft(EMPTY);
      setNotice("Added. It will appear in your Anki reviews from your next session.");
    } catch (e) {
      setAddError(
        e && e.code === "limit"
          ? "You've reached your limit of " + limit + " words."
          : "Couldn't save that word. Try again.",
      );
    }
    setBusy(false);
  }

  function startEdit(w) {
    setEditingId(w.id);
    setEditDraft({ french: w.french, english: w.english, note: w.note || "" });
    setEditError("");
    setConfirmId(null);
  }

  async function saveEdit(w) {
    const problem = validateWord(editDraft);
    if (problem) return setEditError(problem);
    if (isDuplicate(visible, editDraft, w.id)) return setEditError("That word is already in your list.");
    setBusy(true);
    try {
      const saved = await updateWord(w.id, editDraft);
      setWords((prev) => prev.map((x) => (x.id === w.id ? saved : x)));
      setEditingId(null);
    } catch {
      setEditError("Couldn't save the change. Try again.");
    }
    setBusy(false);
  }

  async function remove(w) {
    setBusy(true);
    setNotice("");
    try {
      await removeWord(w);
      setWords((prev) =>
        isOwn(w) ? prev.filter((x) => x.id !== w.id) : prev.map((x) => (x.id === w.id ? { ...x, hidden: true } : x)),
      );
      setConfirmId(null);
    } catch {
      setNotice("Couldn't remove that word. Try again.");
    }
    setBusy(false);
  }

  async function reset() {
    setBusy(true);
    setNotice("");
    try {
      await resetStarterWords();
      await load();
      setConfirmReset(false);
      setNotice("Starter words restored.");
    } catch {
      setNotice("Couldn't restore the starter words. Try again.");
    }
    setBusy(false);
  }

  return (
    <Shell onBack={onBack}>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.5rem" }} className="mb-1">
        Word Bank
      </h2>
      <p className="text-xs mb-4" style={{ color: COLORS.muted }}>
        Your own words. They join the review cards in Anki from your next session.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-xl p-3" style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            Words in rotation
          </div>
          <div className="text-lg font-medium">{visible.length}</div>
        </div>
        <div className="rounded-xl p-3" style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            Words you added
          </div>
          <div className="text-lg font-medium">
            {ownCount}
            {tier === "premium" && (
              <span className="text-xs font-normal" style={{ color: COLORS.muted }}>
                {" "}
                of {limit}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4 mb-4" style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}>
        <div className="text-sm font-medium mb-2 flex items-center gap-1.5">
          <Plus size={14} color={COLORS.accent} /> Add a word
        </div>
        <WordFields draft={draft} setDraft={setDraft} onEnter={add} />
        {addError && (
          <p role="alert" className="text-xs mt-2" style={{ color: COLORS.warnText }}>
            {addError}
          </p>
        )}
        <button
          onClick={add}
          disabled={busy}
          className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: COLORS.accent, color: COLORS.onAccent, opacity: busy ? 0.7 : 1 }}
        >
          Add word
        </button>
        {notice && (
          <p role="status" className="text-xs mt-2 text-center" style={{ color: COLORS.muted }}>
            {notice}
          </p>
        )}
      </div>

      <div className="relative mb-3">
        <Search size={14} color={COLORS.muted} className="absolute left-3 top-3" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowCount(PAGE);
          }}
          placeholder="Search your words"
          aria-label="Search your words"
          className="w-full text-sm rounded-lg pl-9 pr-3 py-2.5"
          style={fieldStyle}
        />
      </div>

      {words === null && (
        <div className="flex justify-center py-8">
          <Loader2 size={18} className="animate-spin" color={COLORS.muted} />
        </div>
      )}
      {loadError && (
        <p role="alert" className="text-xs mb-3" style={{ color: COLORS.warnText }}>
          Couldn't load your words.{" "}
          <button onClick={load} className="underline">
            Retry
          </button>
        </p>
      )}
      {words !== null && !loadError && shown.length === 0 && (
        <p className="text-xs text-center py-6" style={{ color: COLORS.muted }}>
          {query ? "No words match that search." : "No words yet. Add your first one above."}
        </p>
      )}

      <div className="space-y-2">
        {shown.slice(0, showCount).map((w) =>
          editingId === w.id ? (
            <div
              key={w.id}
              className="rounded-xl p-3"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.accent }}
            >
              <WordFields draft={editDraft} setDraft={setEditDraft} onEnter={() => saveEdit(w)} labelPrefix="Edit " />
              {editError && (
                <p role="alert" className="text-xs mt-2" style={{ color: COLORS.warnText }}>
                  {editError}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => saveEdit(w)}
                  disabled={busy}
                  className="flex-1 py-2 rounded-lg text-xs font-medium"
                  style={{ background: COLORS.accent, color: COLORS.onAccent }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 py-2 rounded-lg text-xs"
                  style={{ ...fieldStyle, color: COLORS.muted }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              key={w.id}
              className="rounded-xl px-3 py-2.5 flex items-start gap-2"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{w.french}</div>
                <div className="text-xs" style={{ color: COLORS.muted }}>
                  {w.english}
                  {w.note ? " · " + w.note : ""}
                </div>
                <span
                  className="inline-block text-xs mt-1 px-2 py-0.5 rounded-full"
                  style={{ background: COLORS.accentSoft, color: COLORS.link, fontSize: 10 }}
                >
                  {isOwn(w) ? "Mine" : "Starter"}
                </span>
              </div>
              {confirmId === w.id ? (
                <div className="flex items-center gap-2 shrink-0 text-xs">
                  <button
                    onClick={() => remove(w)}
                    disabled={busy}
                    className="underline"
                    style={{ color: COLORS.warnText }}
                  >
                    {isOwn(w) ? "Delete" : "Hide"}
                  </button>
                  <button onClick={() => setConfirmId(null)} style={{ color: COLORS.muted }}>
                    Keep
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(w)} aria-label={"Edit " + w.french} className="p-1.5">
                    <Pencil size={14} color={COLORS.muted} />
                  </button>
                  <button
                    onClick={() => (isOwn(w) ? setConfirmId(w.id) : remove(w))}
                    aria-label={(isOwn(w) ? "Delete " : "Hide ") + w.french}
                    className="p-1.5"
                  >
                    <Trash2 size={14} color={COLORS.muted} />
                  </button>
                </div>
              )}
            </div>
          ),
        )}
      </div>

      {shown.length > showCount && (
        <button
          onClick={() => setShowCount(showCount + PAGE)}
          className="w-full mt-3 py-2.5 rounded-xl text-xs"
          style={{ ...fieldStyle, color: COLORS.link }}
        >
          Show more ({shown.length - showCount} left)
        </button>
      )}

      <div className="mt-6 text-center">
        {confirmReset ? (
          <div className="text-xs" style={{ color: COLORS.muted }}>
            Bring back hidden starter words and undo edits to them? Words you added stay as they are.
            <div className="flex justify-center gap-4 mt-2">
              <button onClick={reset} disabled={busy} className="underline" style={{ color: COLORS.link }}>
                Reset
              </button>
              <button onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="text-xs inline-flex items-center gap-1.5"
            style={{ color: COLORS.muted }}
          >
            <RotateCcw size={12} />
            Reset starter words{hiddenStarterCount ? " (" + hiddenStarterCount + " hidden)" : ""}
          </button>
        )}
      </div>
    </Shell>
  );
}
