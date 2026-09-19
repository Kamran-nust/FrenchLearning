import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useTier } from "../TierContext.jsx";

// Direct lesson links for a module ("kwiziq" | "tv5"), as a Map of chip text -> URL.
// Only premium and super users can read the table (enforced in the database),
// so free users get an empty Map and the modules fall back to Google search.
export function useLessonLinks(module) {
  const { loading, can } = useTier();
  const [links, setLinks] = useState(() => new Map());
  const allowed = !loading && can("directLessonLinks");

  useEffect(() => {
    if (!allowed) {
      setLinks(new Map());
      return;
    }
    let cancelled = false;
    supabase
      .from("lesson_links")
      .select("chip,url")
      .eq("module", module)
      .eq("approved", true)
      .then(({ data, error }) => {
        if (!cancelled) setLinks(error || !data ? new Map() : new Map(data.map((r) => [r.chip, r.url])));
      });
    return () => {
      cancelled = true;
    };
  }, [allowed, module]);

  return links;
}
