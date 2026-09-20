import { DAILY_WORD_LIMITS } from "./ankiLimits";

// Premium pricing and the Free-versus-Premium comparison shown on the Plans page.
// Sent by the top-bar "Go Premium" pill to ask the app to open the Plans page.
export const OPEN_PLANS_EVENT = "open-plans";

// Prices are display text only: what a customer is actually charged is set by the
// Stripe prices (see supabase/functions/billing), never by anything in the browser.
export const PRICES = {
  monthly: { amount: 12, label: "$12", per: "/ month" },
  yearly: { amount: 120, label: "$120", per: "/ year" },
};

// Yearly compared with paying monthly for a year.
export const YEARLY_SAVING = PRICES.monthly.amount * 12 - PRICES.yearly.amount; // 24
export const YEARLY_PER_MONTH = PRICES.yearly.amount / 12; // 10
export const YEARLY_FREE_MONTHS = Math.round(YEARLY_SAVING / PRICES.monthly.amount); // 2

// Daily AI writing feedback allowance per tier (the database table tier_limits enforces these).
export const AI_FEEDBACK_PER_DAY = { free: 1, premium: 5 };

// value: true = included, false = not included, string = shown as text.
export const FEATURE_GROUPS = [
  {
    title: "Study",
    rows: [
      { label: "Anki, Grammar, Kwiziq, TV5MONDE, Writing", free: true, premium: true },
      { label: "Progress and streaks", free: true, premium: true },
      { label: "Word Bank (your own words in Anki)", free: false, premium: "Up to 500 of your own" },
    ],
  },
  {
    title: "Lessons and links",
    rows: [{ label: "Direct Kwiziq and TV5MONDE lesson links", free: "Search only", premium: true }],
  },
  {
    title: "Downloads and AI",
    rows: [
      {
        label: "Anki words per day",
        free: DAILY_WORD_LIMITS.free + " per day",
        premium: DAILY_WORD_LIMITS.premium + " per day",
      },
      { label: "Grammar chapter PDFs", free: false, premium: true },
      { label: "Day-plan PDF", free: false, premium: "1 per day" },
      {
        label: "Writing AI feedback",
        free: AI_FEEDBACK_PER_DAY.free + " per day",
        premium: AI_FEEDBACK_PER_DAY.premium + " per day",
      },
    ],
  },
];
