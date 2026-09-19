import { useTier } from "./TierContext.jsx";

// <Gate feature="writingFeedback" fallback={<UpgradeNote />}>...</Gate>
// Shows its children only if the user's tier allows the feature (see
// FEATURES in shared/tiers.js). Shows nothing while the tier is loading so
// restricted content never flashes up for a moment.
export default function Gate({ feature, fallback = null, children }) {
  const { loading, can } = useTier();
  if (loading) return null;
  return can(feature) ? children : fallback;
}
