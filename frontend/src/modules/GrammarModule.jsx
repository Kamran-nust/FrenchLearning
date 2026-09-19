import { useState, useEffect } from "react";
import { Flame, RotateCcw, Check, ChevronLeft, ChevronRight, BookOpen, Lock } from "lucide-react";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { todayKey, waitForStorage, diagnoseStorage, readSaved } from "../shared/storage";
import StorageNotice from "../shared/StorageNotice.jsx";
import { GRAMMAR_DAYS } from "../data/grammarDays";
import { fetchGrammarPages } from "../lib/grammarPages";
import Gate from "../Gate.jsx";

const GRAMMAR_TOTAL = GRAMMAR_DAYS.length;

const GRAMMAR_FRESH_PROGRESS = {
  current_day: 1,
  completed_days: [],
  last_activity_date: null,
  streak_count: 0,
  longest_streak: 0,
};

export default function GrammarModule({ onBack, startDay }) {
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(GRAMMAR_FRESH_PROGRESS);
  const [storageOk, setStorageOk] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);
  const [viewDay, setViewDay] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pdfView, setPdfView] = useState(null); // { url, label } while viewing a PDF in-app

  useEffect(() => {
    let cancelled = false;
    async function init() {
      let p = null;
      let failed = false;
      const present = await waitForStorage(10, 300);
      if (present) {
        const res = await readSaved("grammar-progress");
        if (res.ok) p = res.value;
        else failed = true;
      }
      const diag = present
        ? await diagnoseStorage()
        : { ok: false, message: "window.storage is not present in this environment." };
      if (cancelled) return;
      const finalProgress = p || GRAMMAR_FRESH_PROGRESS;
      setProgress(finalProgress);
      setStorageOk(diag.ok);
      setLoadFailed(failed);
      setViewDay(
        startDay ? Math.max(1, Math.min(startDay, GRAMMAR_TOTAL)) : Math.min(finalProgress.current_day, GRAMMAR_TOTAL),
      );
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
  const viewed = viewIdx >= 0 && viewIdx < GRAMMAR_TOTAL ? GRAMMAR_DAYS[viewIdx] : null;
  const isPendingDay = viewDay === progress.current_day && progress.current_day <= GRAMMAR_TOTAL;

  const bookGroups = viewed
    ? Object.values(
        viewed.e.reduce((acc, entry) => {
          if (!acc[entry.b]) acc[entry.b] = { book: entry.b, chapters: [] };
          acc[entry.b].chapters.push(...entry.c);
          return acc;
        }, {}),
      )
    : [];

  async function openChapterPages(book, chapters) {
    setPdfLoading(true);
    setPdfError("");
    try {
      const blob = await fetchGrammarPages(book, chapters);
      const url = URL.createObjectURL(blob);
      setPdfView({ url, label: book + " ch. " + chapters.join(", ") });
    } catch (e) {
      setPdfError(
        e.code === "tier_required"
          ? "Grammar chapter PDFs are a Premium feature."
          : "Couldn't load those pages. Try again.",
      );
    } finally {
      setPdfLoading(false);
    }
  }

  function closePdfView() {
    if (pdfView) URL.revokeObjectURL(pdfView.url);
    setPdfView(null);
  }

  function goPrevPage() {
    setViewDay((d) => Math.max(1, d - 1));
  }

  function goNextPage() {
    setViewDay((d) => Math.min(GRAMMAR_TOTAL, d + 1));
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
    persist("grammar-progress", newProgress);
    setCompletionInfo({ day: viewed.d, remaining: GRAMMAR_TOTAL - newCompleted.length, streak });
    setPhase(newProgress.current_day > GRAMMAR_TOTAL ? "finished" : "complete");
  }

  function continueNext() {
    if (progress.current_day > GRAMMAR_TOTAL) {
      setPhase("finished");
      return;
    }
    setViewDay(progress.current_day);
    setPhase("day");
  }

  function doReset() {
    setProgress(GRAMMAR_FRESH_PROGRESS);
    persist("grammar-progress", GRAMMAR_FRESH_PROGRESS);
    setConfirmingReset(false);
    setViewDay(1);
    setPhase("day");
  }

  const totalDone = progress.completed_days.length;
  const pct = Math.round((totalDone / GRAMMAR_TOTAL) * 100);

  const Header = (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back to home" className="p-1 -ml-1 rounded-full">
            <ChevronLeft size={16} color={COLORS.muted} />
          </button>
          <div className="text-xs" style={{ color: COLORS.muted }}>
            {phase === "finished" ? "Grammar plan complete" : "Day " + viewDay + " of " + GRAMMAR_TOTAL}
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
        {totalDone} days done · {GRAMMAR_TOTAL - totalDone} to go
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

  if (pdfView) {
    return (
      <div style={wrapStyle} className="min-h-screen flex flex-col">
        <GlobalStyle />
        <div
          className="flex items-center gap-2 px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid " + COLORS.border }}
        >
          <button
            onClick={closePdfView}
            aria-label="Back to grammar day"
            className="flex items-center gap-1 -ml-1 px-1 py-1 rounded-full"
            style={{ color: COLORS.text }}
          >
            <ChevronLeft size={18} color={COLORS.text} />
            <span className="text-sm">Back</span>
          </button>
          <span className="text-xs" style={{ color: COLORS.muted }}>
            {pdfView.label}
          </span>
        </div>
        <iframe title="Grammar chapter pages" src={pdfView.url} className="flex-1 w-full" style={{ border: "none" }} />
      </div>
    );
  }

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
            All {GRAMMAR_TOTAL} days done
          </div>
          <div className="text-sm max-w-xs" style={{ color: COLORS.muted }}>
            Longest streak: {progress.longest_streak} days. The grammar module is finished.
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

      <div className="flex-1 flex flex-col items-center px-5 pt-2">
        <div className="w-full max-w-md">
          {viewDay !== progress.current_day && (
            <div className="text-xs mb-2 px-1" style={{ color: COLORS.muted }}>
              Reading only — your current day is Day {Math.min(progress.current_day, GRAMMAR_TOTAL)}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={goPrevPage}
              disabled={viewDay <= 1}
              aria-label="Previous page"
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
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
              className="rounded-2xl p-8 flex-1 flex items-center justify-center"
              style={{ background: COLORS.card, border: "1px solid " + COLORS.border, minHeight: "220px" }}
            >
              <div className="text-sm leading-relaxed text-center">{viewed.x}</div>
            </div>

            <button
              onClick={goNextPage}
              disabled={viewDay >= GRAMMAR_TOTAL}
              aria-label="Next page"
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: COLORS.card,
                border: "1px solid " + COLORS.border,
                opacity: viewDay >= GRAMMAR_TOTAL ? 0.35 : 1,
                cursor: viewDay >= GRAMMAR_TOTAL ? "default" : "pointer",
              }}
            >
              <ChevronRight size={18} color={COLORS.text} />
            </button>
          </div>

          {bookGroups.length > 0 && (
            <Gate
              feature="grammarPdf"
              fallback={
                <div
                  className="w-full mt-3 py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2"
                  style={{ background: COLORS.card, border: "1px dashed " + COLORS.border, color: COLORS.muted }}
                >
                  <Lock size={13} />
                  Grammar chapter PDFs are a Premium feature
                </div>
              }
            >
              <div className="w-full mt-3 flex flex-col gap-2">
                {bookGroups.map((g) => (
                  <button
                    key={g.book}
                    onClick={() => openChapterPages(g.book, g.chapters)}
                    disabled={pdfLoading}
                    className="w-full py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
                    style={{ background: COLORS.accentSoft, color: COLORS.link, opacity: pdfLoading ? 0.6 : 1 }}
                  >
                    <BookOpen size={14} />
                    {pdfLoading ? "Loading pages…" : "Open " + g.book + " ch. " + g.chapters.join(", ")}
                  </button>
                ))}
                {pdfError && (
                  <div className="text-xs text-center" style={{ color: COLORS.danger }}>
                    {pdfError}
                  </div>
                )}
              </div>
            </Gate>
          )}

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
