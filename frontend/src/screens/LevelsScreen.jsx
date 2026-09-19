import { ChevronLeft, ArrowRight } from "lucide-react";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { LEVELS } from "../shared/navigationConfig";

export default function LevelsScreen({ onBack, onSelectLevel }) {
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
