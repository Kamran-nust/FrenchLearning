import { supabase } from "./supabaseClient";

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Calls the `grammar-pages` Edge Function and returns the extracted PDF as
// a Blob, ready for URL.createObjectURL().
export async function fetchGrammarPages(book, chapters) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token || ANON_KEY;

  const res = await fetch(FUNCTIONS_URL + "/grammar-pages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ book, chapters }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json()).error || "";
    } catch (e) {
      // Error response wasn't JSON (e.g. a proxy/gateway error page) -
      // fall back to the generic message below, nothing to recover here.
    }
    throw new Error("grammar-pages request failed" + (detail ? ": " + detail : ""));
  }

  return res.blob();
}
