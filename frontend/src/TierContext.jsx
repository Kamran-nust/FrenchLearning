import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./lib/supabaseClient";
import { canUse } from "./shared/tiers";

export const TierContext = createContext({ tier: "free", loading: true, can: () => false, refresh: () => {} });

export function useTier() {
  return useContext(TierContext);
}

// Loads the signed-in user's tier. If it can't be read, the user is treated as
// free - failing closed, never open.
export function TierProvider({ userId, children }) {
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from("user_tiers").select("tier").eq("user_id", userId).maybeSingle();
    setTier(!error && data ? data.tier : "free");
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const value = { tier, loading, can: (feature) => !loading && canUse(tier, feature), refresh };
  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}
