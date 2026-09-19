// Sign in by username.
//
// Supabase Auth only signs in with email + password, so this function
// looks the username up server-side, signs in with that account's email,
// and hands the session back. The email never reaches the browser, and an
// unknown username and a wrong password return the same error (with a
// dummy sign-in for unknown names so response time doesn't give it away).
//
// Public by design (the caller isn't signed in yet). Email sign-in does not
// use this function.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const GENERIC_ERROR = "Invalid username or password.";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();
    if (typeof username !== "string" || typeof password !== "string" || !password || password.length > 200) {
      return json({ error: "Username and password are required." }, 400);
    }
    if (!USERNAME_RE.test(username)) {
      return json({ error: GENERIC_ERROR }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ilike for case-insensitive match; "_" is a wildcard in LIKE, so escape it.
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .ilike("username", username.replace(/_/g, "\\_"))
      .maybeSingle();

    let email = "nobody@invalid.example";
    if (profile) {
      const { data: userData } = await admin.auth.admin.getUserById(profile.user_id);
      if (userData?.user?.email) email = userData.user.email;
    }

    const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data, error } = await anon.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return json({ error: GENERIC_ERROR }, 401);
    }

    return json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    return json({ error: "Unexpected server error", detail: String(err) }, 500);
  }
});
