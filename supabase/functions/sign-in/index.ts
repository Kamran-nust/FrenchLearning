// Sign in by username.
//
// Supabase Auth only signs in with email + password, so this function
// looks the username up server-side, signs in with that account's email,
// and hands the session back. The email never reaches the browser, and an
// unknown username and a wrong password return the same error (with a
// dummy sign-in for unknown names so response time doesn't give it away).
//
// Password guessing is slowed down: after too many failures from the same
// place (see the limits below) further attempts are refused with 429 until
// the window passes. Email sign-in does not use this function.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const GENERIC_ERROR = "Invalid username or password.";

const WINDOW_MINUTES = 15;
const MAX_FAILS_PER_NAME_AND_IP = 5; // one name, tried from one place
const MAX_FAILS_PER_IP = 30; // any names, from one place

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clientIp(req: Request): string {
  const forwarded = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  return forwarded || req.headers.get("cf-connecting-ip") || "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let parsed: { username?: unknown; password?: unknown };
    try {
      parsed = await req.json();
    } catch {
      return json({ error: "Invalid request." }, 400);
    }
    const { username, password } = parsed ?? {};
    if (typeof username !== "string" || typeof password !== "string" || !password || password.length > 200) {
      return json({ error: "Username and password are required." }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const ip = clientIp(req);
    const name = username.toLowerCase().slice(0, 40);
    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

    // Already locked out? Refuse before doing any real work.
    const [byName, byIp] = await Promise.all([
      admin.from("signin_failures").select("id", { count: "exact", head: true }).eq("username", name).eq("ip", ip).gt("failed_at", since),
      admin.from("signin_failures").select("id", { count: "exact", head: true }).eq("ip", ip).gt("failed_at", since),
    ]);
    if ((byName.count ?? 0) >= MAX_FAILS_PER_NAME_AND_IP || (byIp.count ?? 0) >= MAX_FAILS_PER_IP) {
      return json({ error: "Too many failed attempts. Please wait " + WINDOW_MINUTES + " minutes and try again.", code: "rate_limited" }, 429);
    }

    async function fail() {
      await admin.from("signin_failures").insert({ username: name, ip });
      // keep the table small: nothing older than a day matters
      await admin.from("signin_failures").delete().lt("failed_at", new Date(Date.now() - 86_400_000).toISOString());
      return json({ error: GENERIC_ERROR }, 401);
    }

    if (!USERNAME_RE.test(username)) return await fail();

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
    if (error || !data.session) return await fail();

    // A correct sign-in clears this person's failure count.
    await admin.from("signin_failures").delete().eq("username", name).eq("ip", ip);

    return json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    console.error("sign-in: unexpected error:", err);
    return json({ error: "Unexpected server error" }, 500);
  }
});
