// Account tiers, lowest to highest. A higher tier can do everything a lower
// one can. The tier itself is stored server-side (user_tiers table) and only
// changes via the dashboard/SQL or a super user - never from the browser.
export const TIER_ORDER = ["free", "premium", "super"];

export const TIER_LABELS = { free: "Free", premium: "Premium", super: "Super" };

// feature name -> the lowest tier allowed to use it, e.g.
//   writingFeedback: "premium",
// Filled in as features are assigned to tiers. NOTE: hiding something here
// only hides it in the UI. Anything that must really be restricted (an Edge
// Function, stored data) also has to be enforced on the server.
export const FEATURES = {
  grammarPdf: "premium", // grammar chapter-excerpt PDFs
  adminPanel: "super", // user/tier management page
};

export function tierAtLeast(tier, minimum) {
  const have = TIER_ORDER.indexOf(tier);
  const need = TIER_ORDER.indexOf(minimum);
  return have >= 0 && need >= 0 && have >= need;
}

// Unknown feature names are denied rather than allowed, so a typo can never
// accidentally unlock something.
export function canUse(tier, feature) {
  const minimum = FEATURES[feature];
  if (!minimum) {
    console.warn("Unknown feature (denied): " + feature);
    return false;
  }
  return tierAtLeast(tier, minimum);
}
