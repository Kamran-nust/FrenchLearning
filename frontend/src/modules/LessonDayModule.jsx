import { useState, useEffect } from "react";
import { Flame, RotateCcw, Check, ChevronLeft, ChevronRight, ExternalLink, BookOpen } from "lucide-react";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { waitForStorage, diagnoseStorage, readSaved } from "../shared/storage";
import StorageNotice from "../shared/StorageNotice.jsx";
import { FRESH_PROGRESS, progressAfterCompleting } from "../shared/progress";
import { useLessonLinks } from "../lib/lessonLinks";

// One screen for the day-by-day lesson-list modules (Kwiziq, TV5MONDE). Each
// wrapper passes a config describing what differs:
//   title          shown in the header and the finished screen
//   storageKey     where this module's progress is saved
//   days           the 301-day plan data
//   lessonModule   which lesson_links rows premium users get ("kwiziq" | "tv5")
//   searchUrl      Google-search fallback for a chip with no direct link
//   chipIcon(hasDirectLink)   icon component for a chip
//   prepare(day)   { chips, body, badge } - the day's chips, main text, optional badge
export default function LessonDayModule({ config, onBack, startDay }) {
  const { title, storageKey, days, lessonModule, searchUrl, chipIcon, prepare } = config;
  const total = days.length;
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(FRESH_PROGRESS);
  const [storageOk, setStorageOk] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);
  const [viewDay, setViewDay] = useState(1);
  const { links: lessonLinks, extras: extraLinks } = useLessonLinks(lessonModule);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      let p = null;
      let failed = false;
      const present = await waitForStorage(10, 300);
      if (present) {
        const res = await readSaved(storageKey);
        if (res.ok) p = res.value;
        else failed = true;
      }
      const diag = present
        ? await diagnoseStorage()
        : { ok: false, message: "window.storage is not present in this environment." };
      if (cancelled) return;
      const finalProgress = p || FRESH_PROGRESS;
      setProgress(finalProgress);
      setStorageOk(diag.ok);
      setLoadFailed(failed);
      setViewDay(startDay ? Math.max(1, Math.min(startDay, total)) : Math.min(finalProgress.current_day, total));
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
  const viewed = viewIdx >= 0 && viewIdx < total ? days[viewIdx] : null;
  const isPendingDay = viewDay === progress.current_day && progress.current_day <= total;

  function goPrevPage() {
    setViewDay((d) => Math.max(1, d - 1));
  }

  function goNextPage() {
    setViewDay((d) => Math.min(total, d + 1));
  }

  function completeDay() {
    const { progress: newProgress, streak } = progressAfterCompleting(progress, viewed.d);
    const newCompleted = newProgress.completed_days;
    setProgress(newProgress);
    persist(storageKey, newProgress);
    setCompletionInfo({ day: viewed.d, remaining: total - newCompleted.length, streak });
    setPhase(newProgress.current_day > total ? "finished" : "complete");
  }

  function continueNext() {
    if (progress.current_day > total) {
      setPhase("finished");
      return;
    }
    setViewDay(progress.current_day);
    setPhase("day");
  }

  function doReset() {
    setProgress(FRESH_PROGRESS);
    persist(storageKey, FRESH_PROGRESS);
    setConfirmingReset(false);
    setViewDay(1);
    setPhase("day");
  }

  const totalDone = progress.completed_days.length;
  const pct = Math.round((totalDone / total) * 100);

  const Header = (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            {phase === "finished" ? title + " plan complete" : "Day " + viewDay + " of " + total}
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
        {totalDone} days done · {total - totalDone} to go
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
            All {total} days done
          </div>
          <div className="text-sm max-w-xs" style={{ color: COLORS.muted }}>
            Longest streak: {progress.longest_streak} days. The {title} module is finished.
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

  const { chips, body, badge } = prepare(viewed);

  return (
    <div style={wrapStyle} className="min-h-screen flex flex-col">
      <GlobalStyle />
      {Header}

      <StorageNotice storageOk={storageOk} loadFailed={loadFailed} />

      <div className="flex-1 flex flex-col items-center px-5 pt-2">
        <div className="w-full max-w-md">
          {viewDay !== progress.current_day && (
            <div className="text-xs mb-2 px-1" style={{ color: COLORS.muted }}>
              Reading only — your current day is Day {Math.min(progress.current_day, total)}
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
              {badge && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: COLORS.accentSoft, color: COLORS.link }}
                >
                  {badge}
                </span>
              )}

              <div className="text-sm leading-relaxed text-center w-full">{body}</div>

              <div className="w-full flex flex-col gap-2">
                {chips.map((chip, i) => {
                  const ChipIcon = chipIcon(lessonLinks.has(chip));
                  return (
                    <a
                      key={i}
                      href={lessonLinks.get(chip) || searchUrl(chip)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                      style={{ background: COLORS.accentSoft, color: COLORS.link }}
                    >
                      <ChipIcon size={12} className="shrink-0" />
                      <span className="flex-1 truncate">{chip}</span>
                      <ExternalLink size={12} className="shrink-0" />
                    </a>
                  );
                })}
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
              disabled={viewDay >= total}
              aria-label="Next page"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: viewDay >= total ? 0.35 : 1,
                cursor: viewDay >= total ? "default" : "pointer",
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
