import { useState } from "react";
import { ChevronLeft, BookOpen, GraduationCap, PenLine, Tv, FileEdit } from "lucide-react";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { DAYS } from "../data/ankiDays";
import { GRAMMAR_DAYS } from "../data/grammarDays";
import { KWIZIQ_DAYS } from "../data/kwiziqDays";
import { TV5_DAYS } from "../data/tv5Days";
import { WRITING_DAYS } from "../data/writingDays";
import DayPlanDownload from "../DayPlanDownload.jsx";

const TOTAL_DAYS = DAYS.length;

// initialDay: the day picked earlier, so coming back from a section shows that day again.
// onDayChosen: told whenever a day is picked, so the app can remember it.
export default function DayJumpScreen({ onBack, onSelectSection, initialDay = null, onDayChosen = () => {} }) {
  const [dayInput, setDayInput] = useState(initialDay ? String(initialDay) : "");
  const [chosenDay, setChosenDay] = useState(initialDay);

  function go() {
    const n = parseInt(dayInput, 10);
    if (n >= 1 && n <= TOTAL_DAYS) {
      setChosenDay(n);
      onDayChosen(n);
    }
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
          <button
            onClick={() => onSelectSection(id, chosenDay)}
            className="text-xs font-medium"
            style={{ color: COLORS.accent }}
          >
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
          <button
            onClick={go}
            className="px-5 rounded-lg text-sm font-medium"
            style={{ background: COLORS.accent, color: COLORS.onAccent }}
          >
            Go
          </button>
        </div>

        {chosenDay && (
          <div className="space-y-3">
            <div className="text-xs mb-1 px-1" style={{ color: COLORS.muted }}>
              Day {chosenDay} · Week {Math.ceil(chosenDay / 7)}
            </div>

            {previewRow(
              BookOpen,
              "Anki",
              "anki",
              ankiDay.c.length +
                " new cards — " +
                ankiDay.c
                  .slice(0, 3)
                  .map((c) => c.f)
                  .join(", ") +
                (ankiDay.c.length > 3 ? "…" : ""),
            )}
            {previewRow(GraduationCap, "Grammar book", "grammar", grammarDay.x)}
            {previewRow(PenLine, "Kwiziq", "kwiziq", kwiziqDay.x)}
            {previewRow(
              Tv,
              "TV5MONDE",
              "tv5monde",
              (tv5Day.l ? tv5Day.l + " — " : "") +
                tv5Day.x.replace(/^(Première classe|A1-A2|A2-B1|B1-B2|A1|A2|B1|B2)\s*:\s*/, ""),
            )}
            {previewRow(FileEdit, "Writing", "writing", writingDay.x)}
            <DayPlanDownload
              day={chosenDay}
              plan={{ anki: ankiDay, grammar: grammarDay, kwiziq: kwiziqDay, tv5: tv5Day, writing: writingDay }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
