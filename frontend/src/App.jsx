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
import Tv5Module from "./modules/Tv5Module.jsx";
import WritingModule from "./modules/WritingModule.jsx";
import AnkiModule from "./modules/AnkiModule.jsx";

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
