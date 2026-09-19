import { Search, BookOpen } from "lucide-react";
import LessonDayModule from "./LessonDayModule.jsx";
import { KWIZIQ_DAYS } from "../data/kwiziqDays";
import { splitLessonChips } from "../shared/textHelpers";

const KWIZIQ_CONFIG = {
  title: "Kwiziq",
  storageKey: "kwiziq-progress",
  days: KWIZIQ_DAYS,
  lessonModule: "kwiziq",
  searchUrl: (text) => "https://www.google.com/search?q=" + encodeURIComponent("site:french.kwiziq.com " + text),
  chipIcon: (hasDirectLink) => (hasDirectLink ? BookOpen : Search),
  prepare: (day) => ({ chips: splitLessonChips(day.x), body: day.x, badge: null }),
};

export default function KwiziqModule(props) {
  return <LessonDayModule config={KWIZIQ_CONFIG} {...props} />;
}
