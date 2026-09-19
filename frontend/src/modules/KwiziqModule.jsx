import { useState, useEffect } from "react";
import { Flame, RotateCcw, Check, ChevronLeft, ChevronRight, Search, ExternalLink, BookOpen } from "lucide-react";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { todayKey, waitForStorage, diagnoseStorage } from "../shared/storage";
import { splitLessonChips } from "../shared/textHelpers";
import { useLessonLinks } from "../lib/lessonLinks";
import { KWIZIQ_DAYS } from "../data/kwiziqDays";

const KWIZIQ_TOTAL = KWIZIQ_DAYS.length;

const KWIZIQ_FRESH_PROGRESS = {
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

export default function KwiziqModule({ onBack, startDay }) {
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(KWIZIQ_FRESH_PROGRESS);
  const [storageOk, setStorageOk] = useState(true);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);
  const [viewDay, setViewDay] = useState(1);
  const { links: lessonLinks, extras: extraLinks } = useLessonLinks("kwiziq");

  useEffect(() => {
    let cancelled = false;
    async function init() {
      let p = null;
      const present = await waitForStorage(10, 300);
      if (present) {
        try {
          const r = await window.storage.get("kwiziq-progress", false);
          if (r && r.value) p = JSON.parse(r.value);
        } catch (e) {}
      }
      const diag = present ? await diagnoseStorage() : { ok: false, message: "window.storage is not present in this environment." };
      if (cancelled) return;
      const finalProgress = p || KWIZIQ_FRESH_PROGRESS;
      setProgress(finalProgress);
      setStorageOk(diag.ok);
      setViewDay(startDay ? Math.max(1, Math.min(startDay, KWIZIQ_TOTAL)) : Math.min(finalProgress.current_day, KWIZIQ_TOTAL));
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
  const viewed = viewIdx >= 0 && viewIdx < KWIZIQ_TOTAL ? KWIZIQ_DAYS[viewIdx] : null;
  const isPendingDay = viewDay === progress.current_day && progress.current_day <= KWIZIQ_TOTAL;

  function goPrevPage() {
    setViewDay((d) => Math.max(1, d - 1));
  }

  function goNextPage() {
    setViewDay((d) => Math.min(KWIZIQ_TOTAL, d + 1));
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
    persist("kwiziq-progress", newProgress);
    setCompletionInfo({ day: viewed.d, remaining: KWIZIQ_TOTAL - newCompleted.length, streak });
    setPhase(newProgress.current_day > KWIZIQ_TOTAL ? "finished" : "complete");
  }

  function continueNext() {
    if (progress.current_day > KWIZIQ_TOTAL) {
      setPhase("finished");
      return;
    }
    setViewDay(progress.current_day);
    setPhase("day");
  }

  function doReset() {
    setProgress(KWIZIQ_FRESH_PROGRESS);
    persist("kwiziq-progress", KWIZIQ_FRESH_PROGRESS);
    setConfirmingReset(false);
    setViewDay(1);
    setPhase("day");
  }

  const totalDone = progress.completed_days.length;
  const pct = Math.round((totalDone / KWIZIQ_TOTAL) * 100);

  const Header = (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            {phase === "finished" ? "Kwiziq plan complete" : "Day " + viewDay + " of " + KWIZIQ_TOTAL}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: COLORS.accentSoft }}>
          <Flame size={14} color={progress.streak_count > 0 ? COLORS.hard : COLORS.muted} />
          <span className="text-xs font-medium" style={{ color: progress.streak_count > 0 ? COLORS.text : COLORS.muted }}>
            {progress.streak_count}
          </span>
        </div>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + "%", background: COLORS.accent }} />
      </div>
      <div className="mt-1.5 text-xs" style={{ color: COLORS.muted }}>
        {totalDone} days done · {KWIZIQ_TOTAL - totalDone} to go
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
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: COLORS.successSoft }}>
            <Check size={28} color={COLORS.success} />
          </div>
          <div className="text-2xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            All {KWIZIQ_TOTAL} days done
          </div>
          <div className="text-sm max-w-xs" style={{ color: COLORS.muted }}>
            Longest streak: {progress.longest_streak} days. The Kwiziq module is finished.
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
          <button onClick={continueNext} className="px-6 py-3 rounded-xl text-sm font-medium" style={{ background: COLORS.accent, color: COLORS.onAccent }}>
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

  const chips = splitLessonChips(viewed.x);

  return (
    <div style={wrapStyle} className="min-h-screen flex flex-col">
      <GlobalStyle />
      {Header}

      {!storageOk && (
        <div className="w-full max-w-md mx-auto px-5 mb-2">
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: COLORS.hardSoft, color: COLORS.warnText }}>
            Progress isn't saving right now — it may be lost if you reload.
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center px-5 pt-2">
        <div className="w-full max-w-md">
          {viewDay !== progress.current_day && (
            <div className="text-xs mb-2 px-1" style={{ color: COLORS.muted }}>
              Reading only — your current day is Day {Math.min(progress.current_day, KWIZIQ_TOTAL)}
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
              <div className="text-sm leading-relaxed text-center w-full">{viewed.x}</div>

              <div className="w-full flex flex-col gap-2">
                {chips.map((chip, i) => (
                  <a
                    key={i}
                    href={lessonLinks.get(chip) || buildGoogleSearchUrl(chip)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                    style={{ background: COLORS.accentSoft, color: COLORS.link }}
                  >
                    {lessonLinks.has(chip) ? <BookOpen size={12} className="shrink-0" /> : <Search size={12} className="shrink-0" />}
                    <span className="flex-1 truncate">{chip}</span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                ))}
                {(extraLinks.get(viewed.d) || []).map((e) => (
                  <a
                    key={e.url}
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                    style={{ background: COLORS.accentSoft, color: COLORS.link }}
                  >
                    <BookOpen size={12} className="shrink-0" />
                    <span className="flex-1 truncate">{e.label}</span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            <button
              onClick={goNextPage}
              disabled={viewDay >= KWIZIQ_TOTAL}
              aria-label="Next page"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: viewDay >= KWIZIQ_TOTAL ? 0.35 : 1,
                cursor: viewDay >= KWIZIQ_TOTAL ? "default" : "pointer",
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
