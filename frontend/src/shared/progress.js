import { todayKey } from "./storage";

// What a module's saved progress looks like before anything is done.
export const FRESH_PROGRESS = {
  current_day: 1,
  completed_days: [],
  last_activity_date: null,
  streak_count: 0,
  longest_streak: 0,
};

const DAY_MS = 86400000;

// Marks `dayNumber` complete and moves on to the next day. The streak counts
// real-world days, not curriculum days: the first completion of a calendar day
// adds one if you were active yesterday, otherwise starts again at 1; more
// completions on the same day leave it alone.
// Returns { progress, streak } and never changes the progress it was given.
export function progressAfterCompleting(progress, dayNumber, today = todayKey(), now = Date.now()) {
  let streak = progress.streak_count;
  let longest = progress.longest_streak;
  if (progress.last_activity_date !== today) {
    const yesterday = new Date(now - DAY_MS).toDateString();
    streak = progress.last_activity_date === yesterday ? streak + 1 : 1;
    longest = Math.max(longest, streak);
  }
  return {
    progress: {
      current_day: progress.current_day + 1,
      completed_days: [...progress.completed_days, dayNumber],
      last_activity_date: today,
      streak_count: streak,
      longest_streak: longest,
    },
    streak,
  };
}
