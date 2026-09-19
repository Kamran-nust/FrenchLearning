import { Tv } from "lucide-react";
import LessonDayModule from "./LessonDayModule.jsx";
import { TV5_DAYS } from "../data/tv5Days";
import { splitLessonChips } from "../shared/textHelpers";

// Many TV5 days start with the level name ("Première classe: ..."); the level
// is shown as a badge, so it is dropped from the lesson chips.
const LEVEL_PREFIX = /^(Première classe|A1-A2|A2-B1|B1-B2|A1|A2|B1|B2)\s*:\s*/;

const TV5_CONFIG = {
  title: "TV5MONDE",
  storageKey: "tv5-progress",
  days: TV5_DAYS,
  lessonModule: "tv5",
  searchUrl: (text) => "https://www.google.com/search?q=" + encodeURIComponent("site:tv5monde.com " + text),
  chipIcon: () => Tv,
  prepare: (day) => {
    const chips = splitLessonChips(day.x.replace(LEVEL_PREFIX, ""));
    return { chips, body: chips.length > 0 ? chips.join(" · ") : day.x, badge: day.l || null };
  },
};

export default function Tv5Module(props) {
  return <LessonDayModule config={TV5_CONFIG} {...props} />;
}
