import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useTier } from "../TierContext.jsx";

const EMPTY = { links: new Map(), extras: new Map() };

// Direct lesson links for a module ("kwiziq" | "tv5"):
//   links  - Map of chip text -> URL (replaces that chip's Google search)
//   extras - Map of day number -> [{ label, url }] (additional links on that day)
// Only premium and super users can read either table (enforced in the
// database), so free users get empty results and the modules fall back to
// their normal Google-search links.
export function useLessonLinks(module) {
  const { loading, can } = useTier();
  const [data, setData] = useState(EMPTY);
  const allowed = !loading && can("directLessonLinks");

  useEffect(() => {
    if (!allowed) {
      setData(EMPTY);
      return;
    }
    let cancelled = false;
    Promise.all([
      supabase.from("lesson_links").select("chip,url").eq("module", module).eq("approved", true),
      supabase.from("lesson_extra_links").select("day,label,url,sort").eq("module", module).eq("approved", true).order("sort"),
    ]).then(([chipRes, extraRes]) => {
      if (cancelled) return;
      const links = chipRes.error || !chipRes.data ? new Map() : new Map(chipRes.data.map((r) => [r.chip, r.url]));
      const extras = new Map();
      if (!extraRes.error && extraRes.data) {
        extraRes.data.forEach((r) => {
          if (!extras.has(r.day)) extras.set(r.day, []);
          extras.get(r.day).push({ label: r.label, url: r.url });
        });
      }
      setData({ links, extras });
    });
    return () => {
      cancelled = true;
    };
  }, [allowed, module]);

  return data;
}
