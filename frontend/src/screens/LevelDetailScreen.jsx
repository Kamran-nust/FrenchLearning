import { ChevronLeft, ArrowRight } from "lucide-react";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { SECTIONS } from "../shared/navigationConfig";

export default function LevelDetailScreen({ level, onBack, onSelectSection }) {
  return (
    <div
      style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }}
      className="min-h-screen"
    >
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
