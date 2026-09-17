import { supabase } from "./supabaseClient";

// Shims the artifact's `window.storage.get/set(key, value, shared)` API on
// top of Supabase, so App.jsx's existing storage calls work completely
// unmodified. `value` is always treated as an opaque string (App.jsx does
// its own JSON.stringify/parse around these calls) - this layer just stores
// and returns it verbatim via a jsonb column, the same way the original
// artifact storage API behaved.
export function installWindowStorage(userId) {
  window.storage = {
    async get(key) {
      const { data, error } = await supabase
        .from("app_state")
        .select("value")
        .eq("user_id", userId)
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return { value: data ? data.value : null };
    },

    async set(key, value) {
      const { error } = await supabase
        .from("app_state")
        .upsert({ user_id: userId, key, value }, { onConflict: "user_id,key" });
      if (error) throw error;
      return { ok: true };
    },
  };
}
