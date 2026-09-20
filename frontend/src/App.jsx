import { useState, useEffect } from "react";
import GrammarModule from "./modules/GrammarModule.jsx";
import KwiziqModule from "./modules/KwiziqModule.jsx";
import Tv5Module from "./modules/Tv5Module.jsx";
import WritingModule from "./modules/WritingModule.jsx";
import AnkiModule from "./modules/AnkiModule.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import LevelsScreen from "./screens/LevelsScreen.jsx";
import LevelDetailScreen from "./screens/LevelDetailScreen.jsx";
import DayJumpScreen from "./screens/DayJumpScreen.jsx";
import AdminScreen from "./screens/AdminScreen.jsx";
import PlansScreen from "./screens/PlansScreen.jsx";
import WordBankModule from "./modules/WordBankModule.jsx";
import { OPEN_PLANS_EVENT } from "./shared/plans";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [returnScreen, setReturnScreen] = useState("home");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [jumpDay, setJumpDay] = useState(null);
  // The day picked on the "Jump to a day" screen, kept so that coming back from a section shows that day again.
  const [jumpChosenDay, setJumpChosenDay] = useState(null);

  // The "Go Premium" pill in the top bar (outside this component) asks for the Plans page with an event.
  useEffect(() => {
    const open = () => setScreen("plans");
    window.addEventListener(OPEN_PLANS_EVENT, open);
    return () => window.removeEventListener(OPEN_PLANS_EVENT, open);
  }, []);

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
        onOpenAdmin={() => setScreen("admin")}
        onOpenPlans={() => setScreen("plans")}
        onOpenWordBank={() => setScreen("wordbank")}
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
        initialDay={jumpChosenDay}
        onDayChosen={setJumpChosenDay}
        onBack={() => {
          setJumpChosenDay(null); // leaving for Home starts the next visit fresh
          setScreen("home");
        }}
        onSelectSection={(id, day) => openSection(id, "day-jump", day)}
      />
    );
  }
  if (screen === "wordbank") {
    return <WordBankModule onBack={() => setScreen("home")} onOpenPlans={() => setScreen("plans")} />;
  }
  if (screen === "plans") {
    return <PlansScreen onBack={() => setScreen("home")} />;
  }
  if (screen === "admin") {
    return <AdminScreen onBack={() => setScreen("home")} />;
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
