import { useState, useEffect, useRef } from "react";
import { Flame, RotateCcw, Check, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { waitForStorage, diagnoseStorage, readSaved } from "../shared/storage";
import StorageNotice from "../shared/StorageNotice.jsx";
import { FRESH_PROGRESS, progressAfterCompleting } from "../shared/progress";
import { WRITING_DAYS } from "../data/writingDays";
import { fetchWritingFeedback, fetchFeedbackQuota } from "../lib/writingFeedback";

const WRITING_TOTAL = WRITING_DAYS.length;

function formatWait(ms) {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? h + "h " + m + "m" : m + "m";
}

function extractWordTarget(text) {
  const m = text.match(/(\d+)[\s-]*words?\b/i);
  return m ? parseInt(m[1], 10) : null;
}

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

// The most characters a single day's draft can hold. Matches MAX_INPUT_CHARS in the writing-feedback
// function (so you can't type more than you can submit) and keeps writing-entries a bounded size.
const MAX_DRAFT_CHARS = 4000;

export default function WritingModule({ onBack, startDay }) {
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(FRESH_PROGRESS);
  const [entries, setEntries] = useState({});
  const [storageOk, setStorageOk] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);
  const [viewDay, setViewDay] = useState(1);
  const [draft, setDraft] = useState("");
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [feedbackState, setFeedbackState] = useState("idle"); // idle | loading | error
  const [feedbackError, setFeedbackError] = useState(null); // "busy" | "other" when feedbackState is "error"
  const [quota, setQuota] = useState(null); // AI feedback allowance for this user; null until loaded
  const saveTimer = useRef(null);
  const entriesRef = useRef({});

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    fetchFeedbackQuota().then(setQuota);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      let p = null;
      let ent = {};
      let failed = false;
      const present = await waitForStorage(10, 300);
      if (present) {
        const [rp, re] = await Promise.all([readSaved("writing-progress"), readSaved("writing-entries")]);
        if (rp.ok) p = rp.value;
        if (re.ok && re.value) ent = re.value;
        if (!rp.ok || !re.ok) failed = true;
      }
      const diag = present
        ? await diagnoseStorage()
        : { ok: false, message: "window.storage is not present in this environment." };
      if (cancelled) return;
      const finalProgress = p || FRESH_PROGRESS;
      setProgress(finalProgress);
      setEntries(ent);
      setStorageOk(diag.ok);
      setLoadFailed(failed);
      const initialDay = startDay
        ? Math.max(1, Math.min(startDay, WRITING_TOTAL))
        : Math.min(finalProgress.current_day, WRITING_TOTAL);
      setViewDay(initialDay);
      setDraft((ent[initialDay] && ent[initialDay].text) || "");
      setPhase("day");
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persist(key, value) {
    if (loadFailed) return; // a failed load must never be overwritten by a save
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, JSON.stringify(value), false);
      }
    } catch {
      setStorageOk(false);
    }
  }

  const viewIdx = viewDay - 1;
  const viewed = viewIdx >= 0 && viewIdx < WRITING_TOTAL ? WRITING_DAYS[viewIdx] : null;
  const isPendingDay = viewDay === progress.current_day && progress.current_day <= WRITING_TOTAL;
  const wordTarget = viewed ? extractWordTarget(viewed.x) : null;
  const wordCount = countWords(draft);
  const currentFeedback = entries[viewDay] && entries[viewDay].feedback;
  const limitReached =
    !!quota &&
    quota.limit !== null &&
    quota.remaining === 0 &&
    !!quota.resets_at &&
    Date.parse(quota.resets_at) > Date.now();

  function switchToDay(day) {
    // flush any pending debounced save for the day we're leaving first
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      persist("writing-entries", entriesRef.current);
    }
    setViewDay(day);
    setDraft((entriesRef.current[day] && entriesRef.current[day].text) || "");
    setSaveState("idle");
    setFeedbackState("idle");
  }

  function goPrevPage() {
    if (viewDay > 1) switchToDay(viewDay - 1);
  }

  function goNextPage() {
    if (viewDay < WRITING_TOTAL) switchToDay(viewDay + 1);
  }

  function handleDraftChange(rawText) {
    const text = rawText.length > MAX_DRAFT_CHARS ? rawText.slice(0, MAX_DRAFT_CHARS) : rawText;
    setDraft(text);
    setSaveState("saving");
    const next = { ...entriesRef.current, [viewDay]: { ...(entriesRef.current[viewDay] || {}), text } };
    entriesRef.current = next;
    setEntries(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await persist("writing-entries", entriesRef.current);
      setSaveState("saved");
    }, 1000);
  }

  async function getFeedback() {
    if (!draft.trim()) return;
    setFeedbackState("loading");
    setFeedbackError(null);
    try {
      const { feedback: text, quota: latest } = await fetchWritingFeedback(viewed.x, draft);
      if (latest) setQuota(latest);
      const next = {
        ...entriesRef.current,
        [viewDay]: { ...(entriesRef.current[viewDay] || {}), text: draft, feedback: text },
      };
      entriesRef.current = next;
      setEntries(next);
      persist("writing-entries", next);
      setFeedbackState("idle");
    } catch (e) {
      if (e.code === "limit_reached") {
        // The limit line under the button explains it; no separate error needed.
        if (e.quota) setQuota(e.quota);
        setFeedbackState("idle");
      } else {
        setFeedbackError(e.code || "other");
        setFeedbackState("error");
      }
    }
  }

  function completeDay() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      persist("writing-entries", entriesRef.current);
    }
    const { progress: newProgress, streak } = progressAfterCompleting(progress, viewed.d);
    const newCompleted = newProgress.completed_days;
    setProgress(newProgress);
    persist("writing-progress", newProgress);
    setCompletionInfo({ day: viewed.d, remaining: WRITING_TOTAL - newCompleted.length, streak });
    setPhase(newProgress.current_day > WRITING_TOTAL ? "finished" : "complete");
  }

  function continueNext() {
    if (progress.current_day > WRITING_TOTAL) {
      setPhase("finished");
      return;
    }
    switchToDay(progress.current_day);
    setPhase("day");
  }

  function doReset() {
    setProgress(FRESH_PROGRESS);
    setEntries({});
    entriesRef.current = {};
    persist("writing-progress", FRESH_PROGRESS);
    persist("writing-entries", {});
    setConfirmingReset(false);
    switchToDay(1);
    setPhase("day");
  }

  const totalDone = progress.completed_days.length;
  const pct = Math.round((totalDone / WRITING_TOTAL) * 100);

  const Header = (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            {phase === "finished" ? "Writing plan complete" : "Day " + viewDay + " of " + WRITING_TOTAL}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: COLORS.accentSoft }}>
          <Flame size={14} color={progress.streak_count > 0 ? COLORS.hard : COLORS.muted} />
          <span
            className="text-xs font-medium"
            style={{ color: progress.streak_count > 0 ? COLORS.text : COLORS.muted }}
          >
            {progress.streak_count}
          </span>
        </div>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: pct + "%", background: COLORS.accent }}
        />
      </div>
      <div className="mt-1.5 text-xs" style={{ color: COLORS.muted }}>
        {totalDone} days done · {WRITING_TOTAL - totalDone} to go
      </div>
    </div>
  );

  const ResetControl = (
    <div className="w-full max-w-md mx-auto px-5 pb-6 pt-2">
      {!confirmingReset ? (
        <button
          onClick={() => setConfirmingReset(true)}
          className="text-xs flex items-center gap-1.5 mx-auto"
          style={{ color: COLORS.muted }}
        >
          <RotateCcw size={12} />
          Reset progress
        </button>
      ) : (
        <div
          className="flex items-center justify-center gap-3 text-xs p-3 rounded-xl"
          style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}
        >
          <span style={{ color: COLORS.text }}>Erase all saved progress and writing?</span>
          <button onClick={doReset} className="font-medium" style={{ color: COLORS.danger }}>
            Yes, reset
          </button>
          <button onClick={() => setConfirmingReset(false)} style={{ color: COLORS.muted }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  const wrapStyle = { background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" };

  if (phase === "loading") {
    return (
      <div style={wrapStyle} className="flex items-center justify-center min-h-screen p-6">
        <GlobalStyle />
        <div className="text-sm" style={{ color: COLORS.muted }}>
          Loading your session…
        </div>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        <GlobalStyle />
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: COLORS.successSoft }}
          >
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            All {WRITING_TOTAL} days done
          </div>
          <div className="text-sm max-w-xs" style={{ color: COLORS.muted }}>
            Longest streak: {progress.longest_streak} days. The writing module is finished.
          </div>
        </div>
        {ResetControl}
      </div>
    );
  }

  if (phase === "complete" && completionInfo) {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        <GlobalStyle />
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: COLORS.successSoft }}
          >
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
            Day {completionInfo.day} done
          </div>
          <div className="text-sm mb-6" style={{ color: COLORS.muted }}>
            {completionInfo.remaining} days left · streak {completionInfo.streak}
          </div>
          <button
            onClick={continueNext}
            className="px-6 py-3 rounded-xl text-sm font-medium"
            style={{ background: COLORS.accent, color: COLORS.onAccent }}
          >
            Start next day
          </button>
        </div>
        {ResetControl}
      </div>
    );
  }

  if (!viewed) {
    return (
      <div style={wrapStyle} className="min-h-screen flex items-center justify-center">
        <GlobalStyle />
        <div className="text-sm" style={{ color: COLORS.muted }}>
          Nothing to show.
        </div>
      </div>
    );
  }

  return (
    <div style={wrapStyle} className="min-h-screen flex flex-col">
      <GlobalStyle />
      {Header}

      <StorageNotice storageOk={storageOk} loadFailed={loadFailed} />

      <div className="flex-1 flex flex-col items-center px-5 pt-2 pb-6">
        <div className="w-full max-w-md">
          {viewDay !== progress.current_day && (
            <div className="text-xs mb-2 px-1" style={{ color: COLORS.muted }}>
              Your current day is Day {Math.min(progress.current_day, WRITING_TOTAL)} — you can still edit this entry.
            </div>
          )}

          <div className="relative w-full">
            <button
              onClick={goPrevPage}
              disabled={viewDay <= 1}
              aria-label="Previous page"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: viewDay <= 1 ? 0.35 : 1,
                cursor: viewDay <= 1 ? "default" : "pointer",
              }}
            >
              <ChevronLeft size={18} color={COLORS.text} />
            </button>

            <div
              className="rounded-2xl p-6 w-full flex flex-col gap-4"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}
            >
              <div className="text-sm leading-relaxed text-center w-full">{viewed.x}</div>

              <div>
                <textarea
                  value={draft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  maxLength={MAX_DRAFT_CHARS}
                  placeholder="Écrivez ici…"
                  className="w-full text-sm rounded-lg p-3 leading-relaxed"
                  style={{
                    background: COLORS.bg,
                    border: "1px solid " + COLORS.border,
                    color: COLORS.text,
                    minHeight: "160px",
                    resize: "vertical",
                  }}
                />
                <div className="flex items-center justify-between mt-1.5 px-0.5">
                  <span className="text-xs" style={{ color: COLORS.muted }}>
                    {wordTarget ? wordCount + " / " + wordTarget + " words" : wordCount + " words"}
                  </span>
                  <span className="text-xs" style={{ color: COLORS.muted }}>
                    {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
                  </span>
                </div>
              </div>

              <button
                onClick={getFeedback}
                disabled={!draft.trim() || feedbackState === "loading" || limitReached}
                className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                style={{
                  background: COLORS.goldSoft,
                  color: COLORS.gold,
                  opacity: !draft.trim() || limitReached ? 0.5 : 1,
                  cursor: !draft.trim() || limitReached ? "default" : "pointer",
                }}
              >
                {feedbackState === "loading" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {feedbackState === "loading" ? "Getting feedback…" : "Get feedback"}
              </button>

              {limitReached ? (
                <div className="text-xs text-center" style={{ color: COLORS.muted }}>
                  Daily AI feedback limit reached. Next one available in{" "}
                  {formatWait(Date.parse(quota.resets_at) - Date.now())}.
                </div>
              ) : (
                quota &&
                quota.limit !== null && (
                  <div className="text-xs text-center" style={{ color: COLORS.muted }}>
                    {quota.remaining} of {quota.limit} AI feedback{quota.limit === 1 ? "" : "s"} left
                  </div>
                )
              )}

              {feedbackState === "error" && (
                <div className="text-xs text-center" style={{ color: COLORS.danger }}>
                  {feedbackError === "busy"
                    ? "The AI is busy right now. Try again in a minute — that didn't use any of your allowance."
                    : "Couldn't get feedback — check your connection and try again."}
                </div>
              )}

              {currentFeedback && feedbackState !== "loading" && (
                <div className="pt-4" style={{ borderTop: "1px solid " + COLORS.border }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={13} color={COLORS.gold} />
                    <span className="text-xs font-medium" style={{ color: COLORS.gold }}>
                      Feedback
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{currentFeedback}</div>
                </div>
              )}
            </div>

            <button
              onClick={goNextPage}
              disabled={viewDay >= WRITING_TOTAL}
              aria-label="Next page"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: viewDay >= WRITING_TOTAL ? 0.35 : 1,
                cursor: viewDay >= WRITING_TOTAL ? "default" : "pointer",
              }}
            >
              <ChevronRight size={18} color={COLORS.text} />
            </button>
          </div>

          {isPendingDay && (
            <button
              onClick={completeDay}
              className="w-full mt-4 py-3.5 rounded-xl text-sm font-medium"
              style={{ background: COLORS.accent, color: COLORS.onAccent }}
            >
              Mark day complete
            </button>
          )}
        </div>
      </div>

      {ResetControl}
    </div>
  );
}
