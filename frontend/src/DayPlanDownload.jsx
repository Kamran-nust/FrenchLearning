import { useState, useEffect, useCallback } from "react";
import { FileDown, Lock, Loader2 } from "lucide-react";
import Gate from "./Gate.jsx";
import { COLORS } from "./shared/theme.jsx";
import { splitLessonChips } from "./shared/textHelpers";
import { fetchPdfQuota, claimPdfDownload, refundPdfDownload } from "./lib/pdfDownloads";
import { buildDayPlanPdf } from "./lib/dayPlanPdf";

function waitText(resetsAt) {
  const mins = Math.max(1, Math.ceil((new Date(resetsAt).getTime() - Date.now()) / 60000));
  const h = Math.floor(mins / 60);
  return h > 0 ? h + "h " + (mins % 60) + "m" : mins + "m";
}

function Inner({ day, plan }) {
  const [quota, setQuota] = useState(null); // null = loading or unreadable
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [, tick] = useState(0);

  const load = useCallback(async () => setQuota(await fetchPdfQuota()), []);
  useEffect(() => {
    load();
  }, [load]);
  // Keep the "available again in" countdown fresh
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  // When the wait is over, re-read the status so the button comes back
  useEffect(() => {
    if (!quota || !quota.resets_at) return undefined;
    const ms = new Date(quota.resets_at).getTime() - Date.now();
    const t = setTimeout(load, Math.max(ms, 0) + 1000);
    return () => clearTimeout(t);
  }, [quota, load]);

  const usedUp = quota && !quota.allowed;

  async function download() {
    setError("");
    setBusy(true);
    const claim = await claimPdfDownload(day);
    if (!claim.ok) {
      if (claim.status) setQuota(claim.status);
      else setError("Couldn't check your download allowance. Please try again.");
      setBusy(false);
      return;
    }
    try {
      const chips = (text) => splitLessonChips(text).map((c) => ({ label: c }));
      await buildDayPlanPdf({
        day,
        week: Math.ceil(day / 7),
        sections: [
          { title: "Anki", note: plan.anki.c.length + " new cards", cards: plan.anki.c },
          { title: "Grammar book", text: plan.grammar.x },
          { title: "Kwiziq", links: chips(plan.kwiziq.x) },
          { title: "TV5MONDE", links: [...(plan.tv5.l ? [{ label: plan.tv5.l }] : []), ...chips(plan.tv5.x)] },
          { title: "Writing", text: plan.writing.x },
        ],
      });
      setQuota(claim.status);
    } catch (e) {
      console.error("Day plan PDF failed", e);
      await refundPdfDownload(claim.id);
      setError("Couldn't create the PDF. Your download was not used - please try again.");
    }
    setBusy(false);
  }

  const disabled = busy || usedUp || quota === null;
  return (
    <div className="mt-5">
      <button
        onClick={download}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium"
        style={{
          background: disabled ? COLORS.card : COLORS.accent,
          color: disabled ? COLORS.muted : COLORS.onAccent,
          border: "1px solid " + (disabled ? COLORS.border : COLORS.accent),
        }}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
        {busy ? "Preparing PDF…" : "Download Day " + day + " plan (PDF)"}
      </button>
      {usedUp && (
        <div className="text-xs text-center mt-2" style={{ color: COLORS.muted }}>
          {quota.resets_at ? "Available again in " + waitText(quota.resets_at) : "Not available right now."}
        </div>
      )}
      {error && (
        <div className="text-xs text-center mt-2" style={{ color: COLORS.danger }}>
          {error}
        </div>
      )}
    </div>
  );
}

// Premium and super only; free users see a locked note instead.
export default function DayPlanDownload({ day, plan }) {
  return (
    <Gate
      feature="dayPlanPdf"
      fallback={
        <div
          className="mt-5 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs"
          style={{ background: COLORS.card, border: "1px dashed " + COLORS.border, color: COLORS.muted }}
        >
          <Lock size={13} />
          Day plan PDF download is a Premium feature
        </div>
      }
    >
      <Inner day={day} plan={plan} />
    </Gate>
  );
}
