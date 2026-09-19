import { supabase } from "./supabaseClient";

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Signs in via the `sign-in` Edge Function (which resolves username -> email
// server-side) and installs the returned session. Returns an error message
// string, or null on success.
export async function signInWithUsername(username, password) {
  let res;
  try {
    res = await fetch(FUNCTIONS_URL + "/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON_KEY, Authorization: "Bearer " + ANON_KEY },
      body: JSON.stringify({ username, password }),
    });
  } catch (e) {
    return "Couldn't reach the server. Check your connection.";
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return body.error || "Sign-in failed.";
  const { error } = await supabase.auth.setSession({
    access_token: body.access_token,
    refresh_token: body.refresh_token,
  });
  return error ? error.message : null;
}
