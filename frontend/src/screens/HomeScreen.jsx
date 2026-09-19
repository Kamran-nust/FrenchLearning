import { useState, useEffect } from "react";
import { ArrowRight, Lock, Layers, Calendar, Check, Users } from "lucide-react";
import Gate from "../Gate.jsx";
import { COLORS, GlobalStyle } from "../shared/theme.jsx";
import { SECTIONS } from "../shared/navigationConfig";
import { DAYS } from "../data/ankiDays";
import { loadFullyCompletedThrough } from "../lib/overallProgress";

const TOTAL_DAYS = DAYS.length;

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
        stroke={COLORS.stripe}
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
          <ellipse
            cx="18"
            cy="9"
            rx="7"
            ry="3.2"
            transform="rotate(28 18 9)"
            fill={COLORS.gold}
            opacity="0.7"
            stroke="none"
          />
          <ellipse
            cx="28"
            cy="16"
            rx="6.4"
            ry="3"
            transform="rotate(35 28 16)"
            fill={COLORS.gold}
            opacity="0.55"
            stroke="none"
          />
          <ellipse
            cx="37"
            cy="26"
            rx="5.6"
            ry="2.6"
            transform="rotate(42 37 26)"
            fill={COLORS.gold}
            opacity="0.4"
            stroke="none"
          />
        </g>
      ) : (
        <g
          stroke={COLORS.accent}
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        >
          <path d="M60 6 L64 20 L58 18 L56 30 L50 20 L44 24 L52 10 L56 14 Z" />
        </g>
      )}
    </svg>
  );
}

export default function HomeScreen({ onSelectSection, onBrowseLevels, onJumpToDay, onOpenAdmin }) {
  const [completedThrough, setCompletedThrough] = useState(null); // null = loading or unavailable

  useEffect(() => {
    let cancelled = false;
    loadFullyCompletedThrough(TOTAL_DAYS).then((n) => {
      if (!cancelled) setCompletedThrough(n);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'IBM Plex Sans', sans-serif" }}
      className="min-h-screen"
    >
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
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "2.1rem", lineHeight: 1.15 }}>
            French NCLC 7
            <br />
            Preparation Plan
          </h1>
          <p className="text-sm mt-3" style={{ color: COLORS.muted }}>
            From absolute beginner to confident exam readiness
          </p>

          {completedThrough !== null && (
            <div className="flex flex-col items-center mt-5">
              {completedThrough > 0 && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-2.5"
                  style={{ background: COLORS.accentSoft }}
                >
                  <Check size={14} color={COLORS.success} />
                  <span className="text-xs font-medium" style={{ color: COLORS.text }}>
                    {"Day " + completedThrough + " complete"}
                  </span>
                </div>
              )}
              <div
                className="w-full h-1 rounded-full overflow-hidden"
                style={{ background: COLORS.border, maxWidth: "200px" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: Math.round((completedThrough / TOTAL_DAYS) * 100) + "%", background: COLORS.accent }}
                />
              </div>
              <div className="mt-1.5 text-xs" style={{ color: COLORS.muted }}>
                {completedThrough} / {TOTAL_DAYS} days
              </div>
            </div>
          )}
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
          <Gate feature="adminPanel">
            <button
              onClick={onOpenAdmin}
              className="w-full mt-2.5 flex items-center justify-center gap-2 p-3 rounded-2xl text-sm font-medium"
              style={{ background: COLORS.card, border: "1px dashed " + COLORS.border, color: COLORS.muted }}
            >
              <Users size={16} color={COLORS.accent} />
              Admin: manage users
            </button>
          </Gate>
        </div>

        <div className="text-center text-xs mt-8" style={{ color: COLORS.muted }}>
          ~90 minutes a day · Listening · Speaking · Reading · Writing
        </div>
      </div>
    </div>
  );
}
