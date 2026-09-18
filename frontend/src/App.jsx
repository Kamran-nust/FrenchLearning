import { useState, useEffect, useCallback, useRef } from "react";
import { Flame, Flag, Volume2, RotateCcw, X, Check, ChevronLeft, ChevronRight, BookOpen, GraduationCap, Tv, PenLine, Lock, ArrowRight, ExternalLink, Search, Sparkles, Loader2, FileEdit, Layers, Calendar } from "lucide-react";
import { fetchGrammarPages } from "./lib/grammarPages";
import { DAYS } from "./data/ankiDays";
import { GRAMMAR_DAYS } from "./data/grammarDays";
import { KWIZIQ_DAYS } from "./data/kwiziqDays";
import { WRITING_DAYS } from "./data/writingDays";
import { TV5_DAYS } from "./data/tv5Days";
import GrammarModule from "./modules/GrammarModule.jsx";
import KwiziqModule from "./modules/KwiziqModule.jsx";

const TOTAL_DAYS = DAYS.length;



const COLORS = {
  bg: "#0B1220",
  card: "#131C2E",
  cardHover: "#182238",
  border: "#25314A",
  accent: "#3B82F6",
  accentSoft: "rgba(59,130,246,0.14)",
  hard: "#F59E0B",
  hardSoft: "rgba(245,158,11,0.14)",
  gold: "#F5B841",
  goldSoft: "rgba(245,184,65,0.14)",
  frBlue: "#2E4A9E",
  frRed: "#B23A48",
  text: "#E8EDF6",
  muted: "#8291AB",
  success: "#22C55E",
  successSoft: "rgba(34,197,94,0.14)",
};

const GLOBAL_CSS =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&display=swap'); html, body { height: 100%; margin: 0; background: " +
  COLORS.bg +
  "; } input[type='number']::-webkit-inner-spin-button, input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } input[type='number'] { -moz-appearance: textfield; appearance: textfield; }";

function GlobalStyle() {
  return <style>{GLOBAL_CSS}</style>;
}

function todayKey() {
  return new Date().toDateString();
}

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

function waitForStorage(maxAttempts, intervalMs) {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      if (typeof window !== "undefined" && window.storage) {
        resolve(true);
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        resolve(false);
        return;
      }
      setTimeout(check, intervalMs);
    };
    check();
  });
}

async function diagnoseStorage() {
  if (typeof window === "undefined" || !window.storage) {
    return { ok: false, message: "window.storage is not present in this environment." };
  }
  try {
    await window.storage.set("__diag__", "ok", false);
  } catch (e) {
    return { ok: false, message: "storage.set failed: " + (e && e.message ? e.message : String(e)) };
  }
  try {
    const r = await window.storage.get("__diag__", false);
    if (!r || r.value !== "ok") {
      return { ok: false, message: "storage.get returned unexpected value: " + JSON.stringify(r) };
    }
  } catch (e) {
    return { ok: false, message: "storage.get failed: " + (e && e.message ? e.message : String(e)) };
  }
  return { ok: true, message: "" };
}

function weightedSample(pool, hardSet, count) {
  const arr = pool.map((c) => ({ ...c, weight: hardSet.has(c.i) ? 5 : 1 }));
  const out = [];
  for (let n = 0; n < count && arr.length > 0; n++) {
    const total = arr.reduce((s, c) => s + c.weight, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < arr.length; idx++) {
      r -= arr[idx].weight;
      if (r <= 0) break;
    }
    idx = Math.min(idx, arr.length - 1);
    out.push(arr[idx]);
    arr.splice(idx, 1);
  }
  return out;
}

function buildSession(progress, hardWordsSet) {
  const dayIdx = progress.current_day - 1;
  if (dayIdx < 0 || dayIdx >= TOTAL_DAYS) return null;
  const dayObj = DAYS[dayIdx];
  const newWords = dayObj.c.map((c) => ({ ...c, sourceDay: dayObj.d }));
  const completedCount = progress.completed_days.length;
  const reviewPool = [];
  for (const d of DAYS) {
    if (d.d < dayObj.d) {
      for (const c of d.c) reviewPool.push({ ...c, sourceDay: d.d });
    }
  }
  const target = Math.round(5 + (35 / 300) * completedCount);
  const reviewCount = Math.min(target, reviewPool.length);
  const reviewSelected = weightedSample(reviewPool, hardWordsSet, reviewCount);

  // New words: always French -> English, one card each, no reverse pass.
  const newItems = newWords.map((w) => ({
    ...w,
    dir: "FE",
    key: w.i + "-new-" + dayObj.d,
  }));

  // Review words: one card each, direction chosen at random per card.
  const reviewItems = reviewSelected.map((w) => ({
    ...w,
    dir: Math.random() < 0.5 ? "EF" : "FE",
    key: w.i + "-rev-" + w.sourceDay + "-" + dayObj.d,
  }));

  const words = [...newItems, ...reviewItems];
  return { dayObj, words, queue: words, reviewCount };
}

const FRESH_PROGRESS = {
  current_day: 1,
  completed_days: [],
  last_activity_date: null,
  streak_count: 0,
  longest_streak: 0,
};

const GRAMMAR_TOTAL = GRAMMAR_DAYS.length;

const KWIZIQ_TOTAL = KWIZIQ_DAYS.length;

const WRITING_TOTAL = WRITING_DAYS.length;

const TV5_TOTAL = TV5_DAYS.length;




const GRAMMAR_FRESH_PROGRESS = {
  current_day: 1,
  completed_days: [],
  last_activity_date: null,
  streak_count: 0,
  longest_streak: 0,
};

function buildGoogleSearchUrl(lessonText) {
  const q = "site:french.kwiziq.com " + lessonText;
  return "https://www.google.com/search?q=" + encodeURIComponent(q);
}

function splitLessonChips(text) {
  return text
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const KWIZIQ_FRESH_PROGRESS = {
  current_day: 1,
  completed_days: [],
  last_activity_date: null,
  streak_count: 0,
  longest_streak: 0,
};

function extractWordTarget(text) {
  const m = text.match(/(\d+)[\s-]*words?\b/i);
  return m ? parseInt(m[1], 10) : null;
}

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

const WRITING_FRESH_PROGRESS = {
  current_day: 1,
  completed_days: [],
  last_activity_date: null,
  streak_count: 0,
  longest_streak: 0,
};

function WritingModule({ onBack, startDay }) {
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(WRITING_FRESH_PROGRESS);
  const [entries, setEntries] = useState({});
  const [storageOk, setStorageOk] = useState(true);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);
  const [viewDay, setViewDay] = useState(1);
  const [draft, setDraft] = useState("");
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [feedbackState, setFeedbackState] = useState("idle"); // idle | loading | error
  const saveTimer = useRef(null);
  const entriesRef = useRef({});

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      let p = null;
      let ent = {};
      const present = await waitForStorage(10, 300);
      if (present) {
        try {
          const r = await window.storage.get("writing-progress", false);
          if (r && r.value) p = JSON.parse(r.value);
        } catch (e) {}
        try {
          const r = await window.storage.get("writing-entries", false);
          if (r && r.value) ent = JSON.parse(r.value);
        } catch (e) {}
      }
      const diag = present ? await diagnoseStorage() : { ok: false, message: "window.storage is not present in this environment." };
      if (cancelled) return;
      const finalProgress = p || WRITING_FRESH_PROGRESS;
      setProgress(finalProgress);
      setEntries(ent);
      setStorageOk(diag.ok);
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
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, JSON.stringify(value), false);
      }
    } catch (e) {
      setStorageOk(false);
    }
  }

  const viewIdx = viewDay - 1;
  const viewed = viewIdx >= 0 && viewIdx < WRITING_TOTAL ? WRITING_DAYS[viewIdx] : null;
  const isPendingDay = viewDay === progress.current_day && progress.current_day <= WRITING_TOTAL;
  const wordTarget = viewed ? extractWordTarget(viewed.x) : null;
  const wordCount = countWords(draft);
  const currentFeedback = entries[viewDay] && entries[viewDay].feedback;

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

  function handleDraftChange(text) {
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
    try {
      const prompt =
        "You are a supportive French tutor helping a CLB7/NCLC7 exam candidate practice writing. " +
        "The task they were given was: \"" +
        viewed.x +
        "\"\n\nHere is what they wrote:\n\"" +
        draft +
        "\"\n\nGive concise, encouraging feedback in English: (1) briefly note whether they met the content and length target, " +
        "(2) address the specific grammar checkpoint mentioned in the task if there is one, quoting their exact phrase and the correction, " +
        "(3) point out up to two other notable errors the same way, (4) end with one short tip for next time. " +
        "Keep the whole reply under 150 words. Be warm but direct.";

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const text = (data.content || [])
        .map((block) => (block.type === "text" ? block.text : ""))
        .filter(Boolean)
        .join("\n")
        .trim();
      if (!text) throw new Error("empty response");
      const next = { ...entriesRef.current, [viewDay]: { ...(entriesRef.current[viewDay] || {}), text: draft, feedback: text } };
      entriesRef.current = next;
      setEntries(next);
      persist("writing-entries", next);
      setFeedbackState("idle");
    } catch (e) {
      setFeedbackState("error");
    }
  }

  function completeDay() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      persist("writing-entries", entriesRef.current);
    }
    const todayKeyStr = todayKey();
    let streak = progress.streak_count;
    let longest = progress.longest_streak;
    if (progress.last_activity_date !== todayKeyStr) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      streak = progress.last_activity_date === yesterday ? streak + 1 : 1;
      longest = Math.max(longest, streak);
    }
    const newCompleted = [...progress.completed_days, viewed.d];
    const newProgress = {
      current_day: progress.current_day + 1,
      completed_days: newCompleted,
      last_activity_date: todayKeyStr,
      streak_count: streak,
      longest_streak: longest,
    };
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
    setProgress(WRITING_FRESH_PROGRESS);
    setEntries({});
    entriesRef.current = {};
    persist("writing-progress", WRITING_FRESH_PROGRESS);
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
          <Flame size={14} color={progress.streak_count > 0 ? "#F59E0B" : COLORS.muted} />
          <span className="text-xs font-medium" style={{ color: progress.streak_count > 0 ? COLORS.text : COLORS.muted }}>
            {progress.streak_count}
          </span>
        </div>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + "%", background: COLORS.accent }} />
      </div>
      <div className="mt-1.5 text-xs" style={{ color: COLORS.muted }}>
        {totalDone} days done · {WRITING_TOTAL - totalDone} to go
      </div>
    </div>
  );

  const ResetControl = (
    <div className="w-full max-w-md mx-auto px-5 pb-6 pt-2">
      {!confirmingReset ? (
        <button onClick={() => setConfirmingReset(true)} className="text-xs flex items-center gap-1.5 mx-auto" style={{ color: COLORS.muted }}>
          <RotateCcw size={12} />
          Reset progress
        </button>
      ) : (
        <div className="flex items-center justify-center gap-3 text-xs p-3 rounded-xl" style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}>
          <span style={{ color: COLORS.text }}>Erase all saved progress and writing?</span>
          <button onClick={doReset} className="font-medium" style={{ color: "#F87171" }}>
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
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: COLORS.successSoft }}>
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
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: COLORS.successSoft }}>
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
            Day {completionInfo.day} done
          </div>
          <div className="text-sm mb-6" style={{ color: COLORS.muted }}>
            {completionInfo.remaining} days left · streak {completionInfo.streak}
          </div>
          <button onClick={continueNext} className="px-6 py-3 rounded-xl text-sm font-medium" style={{ background: COLORS.accent, color: "#0B1220" }}>
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

      {!storageOk && (
        <div className="w-full max-w-md mx-auto px-5 mb-2">
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: COLORS.hardSoft, color: "#F5C77E" }}>
            Progress isn't saving right now — it may be lost if you reload.
          </div>
        </div>
      )}

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
                disabled={!draft.trim() || feedbackState === "loading"}
                className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                style={{
                  background: COLORS.goldSoft,
                  color: COLORS.gold,
                  opacity: !draft.trim() ? 0.5 : 1,
                  cursor: !draft.trim() ? "default" : "pointer",
                }}
              >
                {feedbackState === "loading" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                {feedbackState === "loading" ? "Getting feedback…" : "Get feedback"}
              </button>

              {feedbackState === "error" && (
                <div className="text-xs text-center" style={{ color: "#F87171" }}>
                  Couldn't get feedback — check your connection and try again.
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
              style={{ background: COLORS.accent, color: "#0B1220" }}
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


function buildTv5SearchUrl(text) {
  const q = "site:tv5monde.com " + text;
  return "https://www.google.com/search?q=" + encodeURIComponent(q);
}

const TV5_FRESH_PROGRESS = {
  current_day: 1,
  completed_days: [],
  last_activity_date: null,
  streak_count: 0,
  longest_streak: 0,
};

function Tv5Module({ onBack, startDay }) {
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(TV5_FRESH_PROGRESS);
  const [storageOk, setStorageOk] = useState(true);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);
  const [viewDay, setViewDay] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      let p = null;
      const present = await waitForStorage(10, 300);
      if (present) {
        try {
          const r = await window.storage.get("tv5-progress", false);
          if (r && r.value) p = JSON.parse(r.value);
        } catch (e) {}
      }
      const diag = present ? await diagnoseStorage() : { ok: false, message: "window.storage is not present in this environment." };
      if (cancelled) return;
      const finalProgress = p || TV5_FRESH_PROGRESS;
      setProgress(finalProgress);
      setStorageOk(diag.ok);
      setViewDay(startDay ? Math.max(1, Math.min(startDay, TV5_TOTAL)) : Math.min(finalProgress.current_day, TV5_TOTAL));
      setPhase("day");
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persist(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, JSON.stringify(value), false);
      }
    } catch (e) {
      setStorageOk(false);
    }
  }

  const viewIdx = viewDay - 1;
  const viewed = viewIdx >= 0 && viewIdx < TV5_TOTAL ? TV5_DAYS[viewIdx] : null;
  const isPendingDay = viewDay === progress.current_day && progress.current_day <= TV5_TOTAL;

  function goPrevPage() {
    setViewDay((d) => Math.max(1, d - 1));
  }

  function goNextPage() {
    setViewDay((d) => Math.min(TV5_TOTAL, d + 1));
  }

  function completeDay() {
    const todayKeyStr = todayKey();
    let streak = progress.streak_count;
    let longest = progress.longest_streak;
    if (progress.last_activity_date !== todayKeyStr) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      streak = progress.last_activity_date === yesterday ? streak + 1 : 1;
      longest = Math.max(longest, streak);
    }
    const newCompleted = [...progress.completed_days, viewed.d];
    const newProgress = {
      current_day: progress.current_day + 1,
      completed_days: newCompleted,
      last_activity_date: todayKeyStr,
      streak_count: streak,
      longest_streak: longest,
    };
    setProgress(newProgress);
    persist("tv5-progress", newProgress);
    setCompletionInfo({ day: viewed.d, remaining: TV5_TOTAL - newCompleted.length, streak });
    setPhase(newProgress.current_day > TV5_TOTAL ? "finished" : "complete");
  }

  function continueNext() {
    if (progress.current_day > TV5_TOTAL) {
      setPhase("finished");
      return;
    }
    setViewDay(progress.current_day);
    setPhase("day");
  }

  function doReset() {
    setProgress(TV5_FRESH_PROGRESS);
    persist("tv5-progress", TV5_FRESH_PROGRESS);
    setConfirmingReset(false);
    setViewDay(1);
    setPhase("day");
  }

  const totalDone = progress.completed_days.length;
  const pct = Math.round((totalDone / TV5_TOTAL) * 100);

  const Header = (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            {phase === "finished" ? "TV5MONDE plan complete" : "Day " + viewDay + " of " + TV5_TOTAL}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: COLORS.accentSoft }}>
          <Flame size={14} color={progress.streak_count > 0 ? "#F59E0B" : COLORS.muted} />
          <span className="text-xs font-medium" style={{ color: progress.streak_count > 0 ? COLORS.text : COLORS.muted }}>
            {progress.streak_count}
          </span>
        </div>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + "%", background: COLORS.accent }} />
      </div>
      <div className="mt-1.5 text-xs" style={{ color: COLORS.muted }}>
        {totalDone} days done · {TV5_TOTAL - totalDone} to go
      </div>
    </div>
  );

  const ResetControl = (
    <div className="w-full max-w-md mx-auto px-5 pb-6 pt-2">
      {!confirmingReset ? (
        <button onClick={() => setConfirmingReset(true)} className="text-xs flex items-center gap-1.5 mx-auto" style={{ color: COLORS.muted }}>
          <RotateCcw size={12} />
          Reset progress
        </button>
      ) : (
        <div className="flex items-center justify-center gap-3 text-xs p-3 rounded-xl" style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}>
          <span style={{ color: COLORS.text }}>Erase all saved progress?</span>
          <button onClick={doReset} className="font-medium" style={{ color: "#F87171" }}>
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
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: COLORS.successSoft }}>
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            All {TV5_TOTAL} days done
          </div>
          <div className="text-sm max-w-xs" style={{ color: COLORS.muted }}>
            Longest streak: {progress.longest_streak} days. The TV5MONDE module is finished.
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
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: COLORS.successSoft }}>
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
            Day {completionInfo.day} done
          </div>
          <div className="text-sm mb-6" style={{ color: COLORS.muted }}>
            {completionInfo.remaining} days left · streak {completionInfo.streak}
          </div>
          <button onClick={continueNext} className="px-6 py-3 rounded-xl text-sm font-medium" style={{ background: COLORS.accent, color: "#0B1220" }}>
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

  const chips = splitLessonChips(viewed.x.replace(/^(Première classe|A1-A2|A2-B1|B1-B2|A1|A2|B1|B2)\s*:\s*/, ""));

  return (
    <div style={wrapStyle} className="min-h-screen flex flex-col">
      <GlobalStyle />
      {Header}

      {!storageOk && (
        <div className="w-full max-w-md mx-auto px-5 mb-2">
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: COLORS.hardSoft, color: "#F5C77E" }}>
            Progress isn't saving right now — it may be lost if you reload.
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center px-5 pt-2">
        <div className="w-full max-w-md">
          {viewDay !== progress.current_day && (
            <div className="text-xs mb-2 px-1" style={{ color: COLORS.muted }}>
              Reading only — your current day is Day {Math.min(progress.current_day, TV5_TOTAL)}
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
              className="rounded-2xl p-6 w-full flex flex-col items-center justify-center gap-4"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border, minHeight: "220px" }}
            >
              {viewed.l && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: COLORS.accentSoft, color: "#93C5FD" }}
                >
                  {viewed.l}
                </span>
              )}

              <div className="text-sm leading-relaxed text-center w-full">{chips.length > 0 ? chips.join(" · ") : viewed.x}</div>

              <div className="w-full flex flex-col gap-2">
                {chips.map((chip, i) => (
                  <a
                    key={i}
                    href={buildTv5SearchUrl(chip)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                    style={{ background: COLORS.accentSoft, color: "#93C5FD" }}
                  >
                    <Tv size={12} className="shrink-0" />
                    <span className="flex-1 truncate">{chip}</span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            <button
              onClick={goNextPage}
              disabled={viewDay >= TV5_TOTAL}
              aria-label="Next page"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: viewDay >= TV5_TOTAL ? 0.35 : 1,
                cursor: viewDay >= TV5_TOTAL ? "default" : "pointer",
              }}
            >
              <ChevronRight size={18} color={COLORS.text} />
            </button>
          </div>

          {isPendingDay && (
            <button
              onClick={completeDay}
              className="w-full mt-4 py-3.5 rounded-xl text-sm font-medium"
              style={{ background: COLORS.accent, color: "#0B1220" }}
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


function AnkiModule({ onBack, startDay }) {
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(FRESH_PROGRESS);
  const [hardWords, setHardWords] = useState(new Set());
  const [cardStats, setCardStats] = useState({});
  const [session, setSession] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);
  const [storageOk, setStorageOk] = useState(true);
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
    let cancelled = false;
    async function init() {
      let p = null;
      let hw = [];
      let cs = {};
      const present = await waitForStorage(10, 300);
      const diag = present ? await diagnoseStorage() : { ok: false, message: "window.storage is not present in this environment." };
      if (diag.ok) {
        try {
          const r = await window.storage.get("progress", false);
          if (r && r.value) p = JSON.parse(r.value);
        } catch (e) {}
        try {
          const r = await window.storage.get("hard-words", false);
          if (r && r.value) hw = JSON.parse(r.value);
        } catch (e) {}
        try {
          const r = await window.storage.get("card-stats", false);
          if (r && r.value) cs = JSON.parse(r.value);
        } catch (e) {}
      }
      if (cancelled) return;
      const finalProgress = p || FRESH_PROGRESS;
      setProgress(finalProgress);
      setHardWords(new Set(hw));
      setCardStats(cs);
      setStorageOk(diag.ok);
      setStorageDiag(diag.message);
      if (startDay) {
        // Opened from Level/Day browsing: launch a bonus practice session for
        // that specific day, leaving real progress/streak untouched.
        const clamped = Math.max(1, Math.min(startDay, TOTAL_DAYS));
        const sess = buildSession({ ...finalProgress, current_day: clamped }, new Set(hw));
        setSession(sess);
        setIsPracticeSession(true);
        setQIndex(0);
        setRevealed(false);
        setPhase("session");
      } else if (finalProgress.current_day > TOTAL_DAYS) {
        setPhase("finished");
      } else {
        const sess = buildSession(finalProgress, new Set(hw));
        setSession(sess);
        setQIndex(0);
        setRevealed(false);
        setPhase("session");
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const speak = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-FR";
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch (e) {}
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
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, JSON.stringify(value), false);
      }
    } catch (e) {
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

  function goToNextWord() {
    if (!currentItem) return;
    const nextIndex = qIndex + 1;
    if (nextIndex >= session.queue.length) {
      finishSession();
    } else {
      setQIndex(nextIndex);
      setRevealed(false);
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
    const sess = buildSession({ ...progress, current_day: day }, hardWords);
    setSession(sess);
    setIsPracticeSession(true);
    setQIndex(0);
    setRevealed(false);
    setPhase("session");
  }

  function continueToNextDay() {
    if (progress.current_day > TOTAL_DAYS) {
      setPhase("finished");
      return;
    }
    const sess = buildSession(progress, hardWords);
    setSession(sess);
    setQIndex(0);
    setRevealed(false);
    setPhase("session");
  }

  function doReset() {
    setProgress(FRESH_PROGRESS);
    setHardWords(new Set());
    setCardStats({});
    persist("progress", FRESH_PROGRESS);
    persist("hard-words", []);
    persist("card-stats", {});
    const sess = buildSession(FRESH_PROGRESS, new Set());
    setSession(sess);
    setQIndex(0);
    setRevealed(false);
    setConfirmingReset(false);
    setPhase("session");
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
          <Flame size={14} color={progress.streak_count > 0 ? "#F59E0B" : COLORS.muted} />
          <span className="text-xs font-medium" style={{ color: progress.streak_count > 0 ? COLORS.text : COLORS.muted }}>
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
          <button onClick={doReset} className="font-medium" style={{ color: "#F87171" }}>
            Yes, reset
          </button>
          <button onClick={() => setConfirmingReset(false)} style={{ color: COLORS.muted }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );

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
            style={{ background: COLORS.accent, color: "#0B1220" }}
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
  const isReview = currentItem.sourceDay !== session.dayObj.d;

  return (
    <div style={wrapStyle} className="min-h-screen flex flex-col">
      {fontImport}
      {Header}

      {!storageOk && (
        <div className="w-full max-w-md mx-auto px-5 mb-2">
          <div
            className="text-xs px-3 py-2 rounded-lg"
            style={{ background: COLORS.hardSoft, color: "#F5C77E" }}
          >
            <div className="flex items-center justify-between gap-2">
              <span>Progress isn't saving right now — it may be lost if you reload.</span>
              <button
                onClick={async () => {
                  const present = await waitForStorage(6, 250);
                  const diag = present ? await diagnoseStorage() : { ok: false, message: "window.storage is not present in this environment." };
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
          <div className="flex items-center justify-between mb-2 px-1">
            <span
              className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: COLORS.accentSoft, color: "#93C5FD" }}
            >
              {directionLabel}
            </span>
            <span className="text-xs" style={{ color: COLORS.muted }}>
              {qIndex + 1} / {session.queue.length}
              {isReview ? " · review" : " · new"}
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
                      <span style={{ fontFamily: "'Fraunces', serif", fontSize: "1.5rem" }}>
                        {answerText}
                      </span>
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
              {isLast ? <Check size={18} color="#0B1220" /> : <ChevronRight size={18} color="#0B1220" />}
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

const LEVELS = [
  {
    id: "A0",
    label: "A0",
    title: "Absolute-beginner foundations",
    weeks: "Week 1",
    startDay: 1,
    endDay: 7,
    description:
      "Start from zero and build the minimum language needed to introduce yourself and participate in very simple exchanges.",
    goals: [
      "Use basic greetings, the French alphabet and essential classroom expressions.",
      "Say your name, location, nationality and profession in short sentences.",
    ],
  },
  {
    id: "A1",
    label: "A1",
    title: "Basic everyday communication",
    weeks: "Weeks 2–10",
    startDay: 8,
    endDay: 70,
    description:
      "Develop reliable beginner communication for familiar people, routines, shopping, travel, health, services, work and study.",
    goals: [
      "Understand and produce short, predictable everyday exchanges.",
      "Use present-tense basics, articles, agreement, questions, negation and common verbs.",
    ],
  },
  {
    id: "A2",
    label: "A2",
    title: "Independent everyday communication",
    weeks: "Weeks 11–20",
    startDay: 71,
    endDay: 140,
    description:
      "Move beyond memorized phrases and handle routine situations with longer descriptions, explanations and narratives.",
    goals: [
      "Compare choices, negotiate arrangements and resolve common practical problems.",
      "Describe past situations using passé composé and imparfait with growing control.",
    ],
  },
  {
    id: "B1",
    label: "B1",
    title: "Structured independent communication",
    weeks: "Weeks 21–35",
    startDay: 141,
    endDay: 245,
    description:
      "Build sustained, organized communication for professional, social and public-life topics while preparing for exam-style interaction.",
    goals: [
      "State, support, qualify and defend opinions with reasons and examples.",
      "Narrate experiences clearly and manage workplace or administrative situations.",
    ],
  },
  {
    id: "B2",
    label: "B2 / NCLC 7",
    title: "Exam performance and readiness",
    weeks: "Weeks 36–43",
    startDay: 246,
    endDay: 301,
    description:
      "Convert upper-intermediate French into stable NCLC 7-oriented performance under realistic time, interaction and stamina demands.",
    goals: [
      "Understand stance, structure, detail and supported implications in B2 material.",
      "Gather information, persuade and defend a position through sustained interaction.",
    ],
  },
];

const SECTIONS = [
  {
    id: "anki",
    name: "Anki vocabulary",
    tagline: "Daily flashcards, both directions",
    icon: BookOpen,
    active: true,
  },
  {
    id: "grammar",
    name: "Grammar book",
    tagline: "Grammaire Progressive du Français",
    icon: GraduationCap,
    active: true,
  },
  {
    id: "kwiziq",
    name: "Kwiziq",
    tagline: "Daily lesson links",
    icon: PenLine,
    active: true,
  },
  {
    id: "tv5monde",
    name: "TV5MONDE",
    tagline: "Daily listening links",
    icon: Tv,
    active: true,
  },
  {
    id: "writing",
    name: "Writing",
    tagline: "Daily writing task",
    icon: FileEdit,
    active: true,
  },
];

function RibbonDivider() {
  return (
    <svg viewBox="0 0 400 40" className="w-full" style={{ maxWidth: "280px" }} aria-hidden="true">
      <path
        d="M0 30 C 80 10, 140 34, 200 18 S 340 4, 400 20"
        fill="none"
        stroke={COLORS.frBlue}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M0 24 C 80 4, 140 28, 200 12 S 340 -2, 400 14"
        fill="none"
        stroke="#EDE7DA"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M0 18 C 80 -2, 140 22, 200 6 S 340 -8, 400 8"
        fill="none"
        stroke={COLORS.frRed}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

function CornerFlourish({ side }) {
  const isLeft = side === "left";
  return (
    <svg
      width="72"
      height="56"
      viewBox="0 0 72 56"
      style={{ position: "absolute", top: 18, [isLeft ? "left" : "right"]: 18, opacity: 0.5 }}
      aria-hidden="true"
    >
      {isLeft ? (
        <g stroke={COLORS.gold} strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M4 4 C 20 10, 34 20, 44 34" />
          <ellipse cx="18" cy="9" rx="7" ry="3.2" transform="rotate(28 18 9)" fill={COLORS.gold} opacity="0.7" stroke="none" />
          <ellipse cx="28" cy="16" rx="6.4" ry="3" transform="rotate(35 28 16)" fill={COLORS.gold} opacity="0.55" stroke="none" />
          <ellipse cx="37" cy="26" rx="5.6" ry="2.6" transform="rotate(42 37 26)" fill={COLORS.gold} opacity="0.4" stroke="none" />
        </g>
      ) : (
        <g stroke={COLORS.accent} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
          <path d="M60 6 L64 20 L58 18 L56 30 L50 20 L44 24 L52 10 L56 14 Z" />
        </g>
      )}
    </svg>
  );
}

function HomeScreen({ onSelectSection, onBrowseLevels, onJumpToDay }) {
  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }} className="min-h-screen">
      <GlobalStyle />
      <div className="w-full max-w-md mx-auto px-6 pt-10 pb-10 relative">
        <CornerFlourish side="left" />
        <CornerFlourish side="right" />

        <div className="text-center pt-6">
          <div
            className="text-xs font-semibold tracking-wide mb-3"
            style={{ color: COLORS.gold, letterSpacing: "0.08em" }}
          >
            A DAILY LANGUAGE JOURNEY
          </div>
          <h1
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "2.1rem", lineHeight: 1.15 }}
          >
            French NCLC 7
            <br />
            Preparation Plan
          </h1>
          <p className="text-sm mt-3" style={{ color: COLORS.muted }}>
            From absolute beginner to confident exam readiness
          </p>
        </div>

        <div className="flex justify-center my-7">
          <RibbonDivider />
        </div>

        <div
          className="grid grid-cols-3 rounded-xl overflow-hidden mb-8"
          style={{ border: "1px solid " + COLORS.border }}
        >
          {[
            { value: "301", label: "daily plans" },
            { value: "43", label: "weeks" },
            { value: "5", label: "sections" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="py-3 text-center"
              style={{
                background: COLORS.card,
                borderLeft: i > 0 ? "1px solid " + COLORS.border : "none",
              }}
            >
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: "1.15rem" }}>{stat.value}</div>
              <div className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => s.active && onSelectSection(s.id)}
                disabled={!s.active}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left transition-colors"
                style={{
                  background: s.active ? COLORS.card : "transparent",
                  border: "1px solid " + (s.active ? COLORS.accent : COLORS.border),
                  opacity: s.active ? 1 : 0.55,
                  cursor: s.active ? "pointer" : "default",
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: s.active ? COLORS.accentSoft : COLORS.card }}
                >
                  <Icon size={18} color={s.active ? COLORS.accent : COLORS.muted} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                    {s.tagline}
                  </div>
                </div>
                {s.active ? (
                  <ArrowRight size={16} color={COLORS.accent} />
                ) : (
                  <div className="flex items-center gap-1 text-xs shrink-0" style={{ color: COLORS.muted }}>
                    <Lock size={12} />
                    Soon
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="text-xs mb-2 px-1" style={{ color: COLORS.muted }}>
            Other ways to navigate
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onBrowseLevels}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}
            >
              <Layers size={18} color={COLORS.accent} />
              <div className="text-sm font-medium">Browse by level</div>
              <div className="text-xs" style={{ color: COLORS.muted }}>
                A0 to B2 / NCLC 7
              </div>
            </button>
            <button
              onClick={onJumpToDay}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}
            >
              <Calendar size={18} color={COLORS.accent} />
              <div className="text-sm font-medium">Jump to a day</div>
              <div className="text-xs" style={{ color: COLORS.muted }}>
                Any day, 1–301
              </div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs mt-8" style={{ color: COLORS.muted }}>
          ~90 minutes a day · Listening · Speaking · Reading · Writing
        </div>
      </div>
    </div>
  );
}

function LevelsScreen({ onBack, onSelectLevel }) {
  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }} className="min-h-screen">
      <GlobalStyle />
      <div className="w-full max-w-md mx-auto px-5 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            Browse by level
          </div>
        </div>

        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.5rem" }} className="mb-1">
          Pick a level
        </h2>
        <p className="text-xs mb-6" style={{ color: COLORS.muted }}>
          Straight from the plan's own A0 → B2 / NCLC 7 roadmap.
        </p>

        <div className="space-y-2.5">
          {LEVELS.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => onSelectLevel(lvl)}
              className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ background: COLORS.accentSoft }}
              >
                <span className="text-xs font-semibold" style={{ color: COLORS.accent }}>
                  {lvl.id}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{lvl.title}</div>
                <div className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                  {lvl.weeks}
                </div>
              </div>
              <ArrowRight size={16} color={COLORS.accent} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LevelDetailScreen({ level, onBack, onSelectSection }) {
  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }} className="min-h-screen">
      <GlobalStyle />
      <div className="w-full max-w-md mx-auto px-5 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBack} aria-label="Back to levels" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            Browse by level
          </div>
        </div>

        <div className="text-xs font-semibold mb-2" style={{ color: COLORS.gold, letterSpacing: "0.06em" }}>
          {level.label.toUpperCase()} · {level.weeks.toUpperCase()}
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.6rem" }} className="mb-3">
          {level.title}
        </h2>
        <p className="text-sm mb-4" style={{ color: COLORS.muted }}>
          {level.description}
        </p>

        <div className="rounded-2xl p-4 mb-6" style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}>
          <div className="text-xs font-medium mb-2" style={{ color: COLORS.muted }}>
            Goals for this level
          </div>
          <ul className="space-y-1.5">
            {level.goals.map((g, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span style={{ color: COLORS.accent }}>◆</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs mb-2 px-1" style={{ color: COLORS.muted }}>
          Jump into a section at Day {level.startDay} — the start of this level
        </div>
        <div className="space-y-2.5">
          {SECTIONS.filter((s) => s.active).map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => onSelectSection(s.id, level.startDay)}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left"
                style={{ background: COLORS.card, border: "1px solid " + COLORS.accent }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: COLORS.accentSoft }}
                >
                  <Icon size={18} color={COLORS.accent} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{s.name}</div>
                </div>
                <ArrowRight size={16} color={COLORS.accent} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayJumpScreen({ onBack, onSelectSection }) {
  const [dayInput, setDayInput] = useState("");
  const [chosenDay, setChosenDay] = useState(null);

  function go() {
    const n = parseInt(dayInput, 10);
    if (n >= 1 && n <= TOTAL_DAYS) setChosenDay(n);
  }

  const ankiDay = chosenDay ? DAYS[chosenDay - 1] : null;
  const grammarDay = chosenDay ? GRAMMAR_DAYS[chosenDay - 1] : null;
  const kwiziqDay = chosenDay ? KWIZIQ_DAYS[chosenDay - 1] : null;
  const tv5Day = chosenDay ? TV5_DAYS[chosenDay - 1] : null;
  const writingDay = chosenDay ? WRITING_DAYS[chosenDay - 1] : null;

  const previewRow = (icon, label, id, body) => {
    const Icon = icon;
    return (
      <div className="rounded-2xl p-4" style={{ background: COLORS.card, border: "1px solid " + COLORS.border }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon size={14} color={COLORS.accent} />
            <span className="text-xs font-medium">{label}</span>
          </div>
          <button onClick={() => onSelectSection(id, chosenDay)} className="text-xs font-medium" style={{ color: COLORS.accent }}>
            Open
          </button>
        </div>
        <div className="text-xs leading-relaxed" style={{ color: COLORS.muted }}>
          {body}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }} className="min-h-screen">
      <GlobalStyle />
      <div className="w-full max-w-md mx-auto px-5 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            Jump to a day
          </div>
        </div>

        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.5rem" }} className="mb-4">
          Which day?
        </h2>

        <div className="flex gap-2 mb-6">
          <input
            type="number"
            min="1"
            max={TOTAL_DAYS}
            value={dayInput}
            onChange={(e) => setDayInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder={"1–" + TOTAL_DAYS}
            className="flex-1 text-sm rounded-lg px-3 py-2.5"
            style={{ background: COLORS.card, border: "1px solid " + COLORS.border, color: COLORS.text }}
          />
          <button onClick={go} className="px-5 rounded-lg text-sm font-medium" style={{ background: COLORS.accent, color: "#0B1220" }}>
            Go
          </button>
        </div>

        {chosenDay && (
          <div className="space-y-3">
            <div className="text-xs mb-1 px-1" style={{ color: COLORS.muted }}>
              Day {chosenDay} · Week {Math.ceil(chosenDay / 7)}
            </div>

            {previewRow(BookOpen, "Anki", "anki", ankiDay.c.length + " new cards — " + ankiDay.c.slice(0, 3).map((c) => c.f).join(", ") + (ankiDay.c.length > 3 ? "…" : ""))}
            {previewRow(GraduationCap, "Grammar book", "grammar", grammarDay.x)}
            {previewRow(PenLine, "Kwiziq", "kwiziq", kwiziqDay.x)}
            {previewRow(Tv, "TV5MONDE", "tv5monde", (tv5Day.l ? tv5Day.l + " — " : "") + tv5Day.x.replace(/^(Première classe|A1-A2|A2-B1|B1-B2|A1|A2|B1|B2)\s*:\s*/, ""))}
            {previewRow(FileEdit, "Writing", "writing", writingDay.x)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [returnScreen, setReturnScreen] = useState("home");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [jumpDay, setJumpDay] = useState(null);

  function openSection(id, fromScreen, day) {
    setJumpDay(day || null);
    setReturnScreen(fromScreen);
    setScreen(id);
  }

  if (screen === "home") {
    return (
      <HomeScreen
        onSelectSection={(id) => openSection(id, "home", null)}
        onBrowseLevels={() => setScreen("levels")}
        onJumpToDay={() => setScreen("day-jump")}
      />
    );
  }
  if (screen === "levels") {
    return (
      <LevelsScreen
        onBack={() => setScreen("home")}
        onSelectLevel={(lvl) => {
          setSelectedLevel(lvl);
          setScreen("level-detail");
        }}
      />
    );
  }
  if (screen === "level-detail" && selectedLevel) {
    return (
      <LevelDetailScreen
        level={selectedLevel}
        onBack={() => setScreen("levels")}
        onSelectSection={(id, day) => openSection(id, "level-detail", day)}
      />
    );
  }
  if (screen === "day-jump") {
    return (
      <DayJumpScreen
        onBack={() => setScreen("home")}
        onSelectSection={(id, day) => openSection(id, "day-jump", day)}
      />
    );
  }
  if (screen === "grammar") {
    return <GrammarModule onBack={() => setScreen(returnScreen)} startDay={jumpDay} />;
  }
  if (screen === "kwiziq") {
    return <KwiziqModule onBack={() => setScreen(returnScreen)} startDay={jumpDay} />;
  }
  if (screen === "writing") {
    return <WritingModule onBack={() => setScreen(returnScreen)} startDay={jumpDay} />;
  }
  if (screen === "tv5monde") {
    return <Tv5Module onBack={() => setScreen(returnScreen)} startDay={jumpDay} />;
  }
  return <AnkiModule onBack={() => setScreen(returnScreen)} startDay={jumpDay} />;
}
