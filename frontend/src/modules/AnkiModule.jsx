import { useState, useEffect, useCallback, useRef } from "react";
import { Flame, Flag, Volume2, RotateCcw, Check, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { todayKey, waitForStorage, diagnoseStorage, readSaved } from "../shared/storage";
import StorageNotice from "../shared/StorageNotice.jsx";
import { DAYS } from "../data/ankiDays";
import { buildSession } from "../lib/ankiSession";
import { fetchWordBank } from "../lib/wordBank";
import { toAnkiCards } from "../shared/wordBank";
import { useTier } from "../TierContext.jsx";
import { dailyLimit, limitReached, todaysCount } from "../shared/ankiLimits";

const TOTAL_DAYS = DAYS.length;

const FRESH_PROGRESS = {
  current_day: 1,
  completed_days: [],
  last_activity_date: null,
  streak_count: 0,
  longest_streak: 0,
};

function loadFrenchVoice() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve(null);
      return;
    }
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      const exact = voices.find((v) => v.lang === "fr-FR");
      const loose = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("fr"));
      resolve(exact || loose || null);
    };
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) {
      pick();
    } else {
      window.speechSynthesis.onvoiceschanged = pick;
      setTimeout(pick, 400);
    }
  });
}

export default function AnkiModule({ onBack, startDay, onOpenPlans }) {
  const { tier, loading: tierLoading } = useTier();
  const limit = dailyLimit(tier);
  // Cards seen today (kept with the rest of the saved progress). The ref always holds the latest total.
  const [dailySeen, setDailySeen] = useState(0);
  const seenRef = useRef(0);
  const countedRef = useRef(0); // cards of the current session already added to today's total
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(FRESH_PROGRESS);
  const [hardWords, setHardWords] = useState(new Set());
  const [cardStats, setCardStats] = useState({});
  // The person's Word Bank words as cards. They join the review words each time a session is built.
  const [customCards, setCustomCards] = useState([]);
  const [session, setSession] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);
  const [storageOk, setStorageOk] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [storageDiag, setStorageDiag] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [isPracticeSession, setIsPracticeSession] = useState(false);
  const voiceRef = useRef(null);

  useEffect(() => {
    loadFrenchVoice().then((v) => {
      voiceRef.current = v;
    });
  }, []);

  useEffect(() => {
    if (tierLoading) return undefined; // the session size depends on the tier
    let cancelled = false;
    async function init() {
      let p = null;
      let hw = [];
      let cs = {};
      const present = await waitForStorage(10, 300);
      const diag = present
        ? await diagnoseStorage()
        : { ok: false, message: "window.storage is not present in this environment." };
      let failed = !diag.ok; // couldn't even test storage, so saved data can't be trusted to be absent
      if (diag.ok) {
        const [rp, rh, rc] = await Promise.all([
          readSaved("progress"),
          readSaved("hard-words"),
          readSaved("card-stats"),
        ]);
        if (rp.ok) p = rp.value;
        if (rh.ok && rh.value) hw = rh.value;
        if (rc.ok && rc.value) cs = rc.value;
        if (!rp.ok || !rh.ok || !rc.ok) failed = true;
      }
      // Word Bank words (nothing for free accounts, and never blocks Anki if they can't be loaded).
      let custom = [];
      try {
        custom = toAnkiCards(await fetchWordBank());
      } catch {
        custom = [];
      }
      let seen = 0;
      if (diag.ok) {
        const rd = await readSaved("anki-daily");
        seen = todaysCount(rd.ok ? rd.value : null, todayKey());
      }
      if (cancelled) return;
      seenRef.current = seen;
      setDailySeen(seen);
      setCustomCards(custom);
      const finalProgress = p || FRESH_PROGRESS;
      setProgress(finalProgress);
      setHardWords(new Set(hw));
      setCardStats(cs);
      setStorageOk(diag.ok);
      setLoadFailed(failed);
      setStorageDiag(diag.message);
      if (startDay) {
        // Opened from Level/Day browsing: launch a bonus practice session for
        // that specific day, leaving real progress/streak untouched.
        const clamped = Math.max(1, Math.min(startDay, TOTAL_DAYS));
        setIsPracticeSession(true);
        if (limitReached(tier, seen)) {
          setPhase("limit");
          return;
        }
        const sess = buildSession({ ...finalProgress, current_day: clamped }, new Set(hw), custom, {
          tier,
          practice: true,
          seen,
        });
        setSession(sess);
        setQIndex(0);
        setRevealed(false);
        setPhase("session");
        beginCounting(sess);
      } else if (finalProgress.current_day > TOTAL_DAYS) {
        setPhase("finished");
      } else {
        if (limitReached(tier, seen)) {
          setPhase("limit");
          return;
        }
        const sess = buildSession(finalProgress, new Set(hw), custom, { tier, seen });
        setSession(sess);
        setQIndex(0);
        setRevealed(false);
        setPhase("session");
        beginCounting(sess);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [tierLoading, tier]);

  const speak = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-FR";
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch (error) {
      console.warn("Speech failed", error); // audio is a nicety; the card still works without it
    }
  }, []);

  const currentItem = session ? session.queue[qIndex] : null;

  useEffect(() => {
    if (!currentItem) return;
    // FE = French shown as the prompt itself -> speak it right away.
    if (currentItem.dir === "FE" && !revealed) {
      speak(currentItem.f);
    }
  }, [currentItem, speak]);

  useEffect(() => {
    // EF = French only appears once revealed (it's the answer) -> speak on reveal.
    if (currentItem && currentItem.dir === "EF" && revealed) {
      speak(currentItem.f);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

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

  function toggleHard(cardId) {
    setHardWords((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
        setCardStats((prevStats) => {
          const s = prevStats[cardId] || { times_seen: 0, times_marked_hard_total: 0, last_seen_day: null };
          const updated = { ...prevStats, [cardId]: { ...s, times_marked_hard_total: s.times_marked_hard_total + 1 } };
          persist("card-stats", updated);
          return updated;
        });
      }
      persist("hard-words", Array.from(next));
      return next;
    });
  }

  function handleShowAnswer() {
    if (!currentItem || revealed) return;
    setRevealed(true);
  }

  // A new session starts: its first card is on screen, so it counts.
  function beginCounting(sess) {
    countedRef.current = 0;
    if (sess) recordShown(1);
  }

  // shownCount = how many cards of this session have been on screen so far. Only the newly seen ones are
  // added to today's total, so going back and forth over a card doesn't count it twice.
  function recordShown(shownCount) {
    if (limit === null || shownCount <= countedRef.current) return;
    const total = seenRef.current + (shownCount - countedRef.current);
    countedRef.current = shownCount;
    seenRef.current = total;
    setDailySeen(total);
    persist("anki-daily", { date: todayKey(), seen: total });
  }

  function goToNextWord() {
    if (!currentItem) return;
    const nextIndex = qIndex + 1;
    if (nextIndex >= session.queue.length) {
      finishSession();
    } else {
      setQIndex(nextIndex);
      setRevealed(false);
      recordShown(nextIndex + 1);
    }
  }

  function goToPrevWord() {
    if (qIndex === 0) return;
    setQIndex(qIndex - 1);
    setRevealed(false);
  }

  function finishSession() {
    if (isPracticeSession) {
      // Bonus practice: no progress, streak, or card-stat changes. Populate
      // completionInfo from real (unchanged) progress so the results screen
      // always has something coherent to show, whether this practice round
      // was launched from the normal completion screen or directly via
      // Level/Day browsing.
      setIsPracticeSession(false);
      setCompletionInfo({
        day: session.dayObj.d,
        remaining: TOTAL_DAYS - progress.completed_days.length,
        streak: progress.streak_count,
      });
      setPhase("complete");
      return;
    }
    const today = todayKey();
    let streak = progress.streak_count;
    let longest = progress.longest_streak;
    if (progress.last_activity_date !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (progress.last_activity_date === yesterday) {
        streak = streak + 1;
      } else {
        streak = 1;
      }
      longest = Math.max(longest, streak);
    }
    const newCompleted = [...progress.completed_days, session.dayObj.d];
    const newProgress = {
      current_day: progress.current_day + 1,
      completed_days: newCompleted,
      last_activity_date: today,
      streak_count: streak,
      longest_streak: longest,
    };
    setCardStats((prevStats) => {
      const newStats = { ...prevStats };
      for (const w of session.words) {
        const s = newStats[w.i] || { times_seen: 0, times_marked_hard_total: 0, last_seen_day: null };
        newStats[w.i] = { ...s, times_seen: s.times_seen + 1, last_seen_day: session.dayObj.d };
      }
      persist("card-stats", newStats);
      return newStats;
    });
    setProgress(newProgress);
    persist("progress", newProgress);
    setCompletionInfo({
      day: session.dayObj.d,
      remaining: TOTAL_DAYS - newCompleted.length,
      streak: streak,
    });
    setPhase(newProgress.current_day > TOTAL_DAYS ? "finished" : "complete");
  }

  function practiceDayAgain(day) {
    setIsPracticeSession(true);
    if (limitReached(tier, seenRef.current)) {
      setPhase("limit");
      return;
    }
    const sess = buildSession({ ...progress, current_day: day }, hardWords, customCards, {
      tier,
      practice: true,
      seen: seenRef.current,
    });
    setSession(sess);
    setQIndex(0);
    setRevealed(false);
    setPhase("session");
    beginCounting(sess);
  }

  function continueToNextDay() {
    if (progress.current_day > TOTAL_DAYS) {
      setPhase("finished");
      return;
    }
    if (limitReached(tier, seenRef.current)) {
      setPhase("limit");
      return;
    }
    const sess = buildSession(progress, hardWords, customCards, { tier, seen: seenRef.current });
    setSession(sess);
    setQIndex(0);
    setRevealed(false);
    setPhase("session");
    beginCounting(sess);
  }

  function doReset() {
    setProgress(FRESH_PROGRESS);
    setHardWords(new Set());
    setCardStats({});
    persist("progress", FRESH_PROGRESS);
    persist("hard-words", []);
    persist("card-stats", {});
    if (limitReached(tier, seenRef.current)) {
      setConfirmingReset(false);
      setPhase("limit");
      return;
    }
    const sess = buildSession(FRESH_PROGRESS, new Set(), customCards, { tier, seen: seenRef.current });
    setSession(sess);
    setQIndex(0);
    setRevealed(false);
    setConfirmingReset(false);
    setPhase("session");
    beginCounting(sess);
  }

  useEffect(() => {
    function onKey(e) {
      if (phase !== "session") return;
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleShowAnswer();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        goToNextWord();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        goToPrevWord();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const wrapStyle = {
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: "'IBM Plex Sans', sans-serif",
  };

  const fontImport = <GlobalStyle />;

  if (phase === "loading") {
    return (
      <div style={wrapStyle} className="flex items-center justify-center min-h-screen p-6">
        {fontImport}
        <div className="text-sm" style={{ color: COLORS.muted }}>
          Loading your session…
        </div>
      </div>
    );
  }

  const totalCurriculumDone = progress.completed_days.length;
  const curriculumPct = Math.round((totalCurriculumDone / TOTAL_DAYS) * 100);

  const Header = (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            {phase === "finished"
              ? "Plan complete"
              : isPracticeSession && session
                ? "Practicing Day " + session.dayObj.d + " of " + TOTAL_DAYS
                : "Day " + Math.min(progress.current_day, TOTAL_DAYS) + " of " + TOTAL_DAYS}
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
          style={{ width: curriculumPct + "%", background: COLORS.accent }}
        />
      </div>
      <div className="mt-1.5 text-xs" style={{ color: COLORS.muted }}>
        {totalCurriculumDone} days done · {TOTAL_DAYS - totalCurriculumDone} to go
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
          <span style={{ color: COLORS.text }}>Erase all saved progress?</span>
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

  if (phase === "limit") {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        {fontImport}
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: COLORS.accentSoft }}
          >
            <Lock size={26} color={COLORS.accent} />
          </div>
          <div className="text-2xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            Today's limit reached
          </div>
          <div className="text-sm max-w-xs mb-6" style={{ color: COLORS.muted }}>
            You've seen {limit} words today. Your limit resets tomorrow
            {tier === "free" ? ", and Premium raises it to 200 words a day." : "."}
          </div>
          {tier === "free" && onOpenPlans && (
            <button
              onClick={onOpenPlans}
              className="px-6 py-3 rounded-xl text-sm font-medium"
              style={{ background: COLORS.accent, color: COLORS.onAccent }}
            >
              See plans
            </button>
          )}
          <button
            onClick={onBack}
            className="mt-3 px-6 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "transparent", color: COLORS.muted, border: "1px solid " + COLORS.border }}
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        {fontImport}
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: COLORS.successSoft }}
          >
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            All 301 days done
          </div>
          <div className="text-sm max-w-xs" style={{ color: COLORS.muted }}>
            Longest streak: {progress.longest_streak} days. The vocabulary module is finished — nice work.
          </div>
        </div>
        {ResetControl}
      </div>
    );
  }

  if (phase === "complete" && completionInfo) {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        {fontImport}
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
            onClick={continueToNextDay}
            className="px-6 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ background: COLORS.accent, color: COLORS.onAccent }}
          >
            Start next day
          </button>
          <button
            onClick={() => practiceDayAgain(completionInfo.day)}
            className="mt-3 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "transparent", color: COLORS.muted, border: "1px solid " + COLORS.border }}
          >
            Practice this day again
          </button>
        </div>
        {ResetControl}
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div style={wrapStyle} className="min-h-screen flex items-center justify-center">
        {fontImport}
        <div className="text-sm" style={{ color: COLORS.muted }}>
          Nothing to show.
        </div>
      </div>
    );
  }

  const isHard = hardWords.has(currentItem.i);
  const promptText = currentItem.dir === "EF" ? currentItem.e : currentItem.f;
  const answerText = currentItem.dir === "EF" ? currentItem.f : currentItem.e;
  const directionLabel = currentItem.dir === "EF" ? "English → French" : "French → English";
  const isLast = qIndex + 1 >= session.queue.length;
  const isFirst = qIndex === 0;
  const isReview = currentItem.custom || currentItem.sourceDay !== session.dayObj.d;

  return (
    <div style={wrapStyle} className="min-h-screen flex flex-col">
      {fontImport}
      {Header}

      <StorageNotice storageOk loadFailed={loadFailed} />
      {!storageOk && !loadFailed && (
        <div className="w-full max-w-md mx-auto px-5 mb-2">
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: COLORS.hardSoft, color: COLORS.warnText }}>
            <div className="flex items-center justify-between gap-2">
              <span>Progress isn't saving right now — it may be lost if you reload.</span>
              <button
                onClick={async () => {
                  const present = await waitForStorage(6, 250);
                  const diag = present
                    ? await diagnoseStorage()
                    : { ok: false, message: "window.storage is not present in this environment." };
                  setStorageOk(diag.ok);
                  setStorageDiag(diag.message);
                  if (diag.ok) {
                    persist("progress", progress);
                    persist("hard-words", Array.from(hardWords));
                    persist("card-stats", cardStats);
                  }
                }}
                className="underline shrink-0"
              >
                Retry
              </button>
            </div>
            {storageDiag && (
              <div className="mt-1 opacity-80 font-mono" style={{ fontSize: "10px" }}>
                {storageDiag}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-md">
          {limit !== null && (
            <div className="text-xs text-center mb-2" style={{ color: COLORS.muted }}>
              Words today: {Math.min(dailySeen, limit)} of {limit}
            </div>
          )}
          <div className="flex items-center justify-between mb-2 px-1">
            <span
              className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: COLORS.accentSoft, color: COLORS.link }}
            >
              {directionLabel}
            </span>
            <span className="text-xs" style={{ color: COLORS.muted }}>
              {qIndex + 1} / {session.queue.length}
              {currentItem.custom ? " · my word" : isReview ? " · review" : " · new"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={goToPrevWord}
              disabled={isFirst}
              aria-label="Previous word"
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: isFirst ? 0.35 : 1,
                cursor: isFirst ? "default" : "pointer",
              }}
            >
              <ChevronLeft size={18} color={COLORS.text} />
            </button>

            <div
              className="rounded-2xl p-8 flex-1 flex flex-col items-center justify-center relative"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border, minHeight: "260px" }}
            >
              <button
                onClick={() => toggleHard(currentItem.i)}
                className="absolute top-4 right-4 p-1.5 rounded-full transition-colors"
                style={{ background: isHard ? COLORS.hardSoft : "transparent" }}
                aria-label="Mark as hard"
              >
                <Flag size={16} color={isHard ? COLORS.hard : COLORS.muted} fill={isHard ? COLORS.hard : "none"} />
              </button>

              <div className="flex flex-col items-center justify-center text-center">
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: "1.9rem", lineHeight: 1.25 }}>
                  {promptText}
                </div>

                {currentItem.dir === "FE" && !revealed && (
                  <button
                    onClick={() => speak(currentItem.f)}
                    className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                    style={{ color: COLORS.muted }}
                  >
                    <Volume2 size={13} />
                    Replay
                  </button>
                )}

                <div
                  className="w-full mt-5 pt-5 transition-opacity duration-300"
                  style={{
                    borderTop: revealed ? "1px solid " + COLORS.border : "1px solid transparent",
                    opacity: revealed ? 1 : 0,
                    minHeight: revealed ? "auto" : 0,
                  }}
                >
                  {revealed && (
                    <div className="flex items-center justify-center gap-2">
                      <span style={{ fontFamily: "'Fraunces', serif", fontSize: "1.5rem" }}>{answerText}</span>
                      {currentItem.dir === "EF" && (
                        <button onClick={() => speak(currentItem.f)} aria-label="Play pronunciation">
                          <Volume2 size={16} color={COLORS.muted} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={goToNextWord}
              aria-label={isLast ? "Finish day" : "Next word"}
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: COLORS.accent }}
            >
              {isLast ? (
                <Check size={18} color={COLORS.onAccent} />
              ) : (
                <ChevronRight size={18} color={COLORS.onAccent} />
              )}
            </button>
          </div>

          <button
            onClick={handleShowAnswer}
            disabled={revealed}
            className="w-full mt-4 py-3.5 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2"
            style={{
              background: "transparent",
              color: revealed ? COLORS.muted : COLORS.text,
              border: "1px solid " + COLORS.border,
              opacity: revealed ? 0.5 : 1,
              cursor: revealed ? "default" : "pointer",
            }}
          >
            {revealed ? "Answer shown" : "Show answer"}
          </button>
        </div>
      </div>

      {ResetControl}
    </div>
  );
}
