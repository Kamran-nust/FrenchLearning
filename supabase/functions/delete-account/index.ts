// Delete the signed-in person's own account.
//
// The app sends { password }. This function:
//   1. checks the caller is signed in (their token),
//   2. refuses Super users (their accounts can't be deleted from the app),
//   3. checks the password again, so a stolen or left-open session alone can't delete an account,
//   4. deletes the user from Supabase Auth. Everything tied to the account (saved progress, tier, Word Bank,
//      profile, usage records) is removed with it: those tables all reference auth.users "on delete cascade".
//
// The service-role key stays on the server; the app never sees it.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getUserId, unauthorized } from "../_shared/auth.ts";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const userId = await getUserId(req);
  if (!userId) return unauthorized();

  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return json({ error: "Send a JSON body." }, 400);
  }
  if (!password) return json({ error: "Enter your password.", code: "wrong_password" }, 400);

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: tierRow } = await admin.from("user_tiers").select("tier").eq("user_id", userId).maybeSingle();
    if (tierRow?.tier === "super") {
      return json({ error: "Super accounts can't be deleted here.", code: "super_not_allowed" }, 403);
    }

    const { data: found, error: lookupError } = await admin.auth.admin.getUserById(userId);
    const email = found?.user?.email;
    if (lookupError || !email) return json({ error: "Couldn't delete the account." }, 500);

    // Check the password by signing in with it. The session this creates is thrown away.
    const check = await fetch(Deno.env.get("SUPABASE_URL")! + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
      body: JSON.stringify({ email, password }),
    });
    if (!check.ok) return json({ error: "That password isn't right.", code: "wrong_password" }, 403);

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("delete-account failed", deleteError.message);
      return json({ error: "Couldn't delete the account." }, 500);
    }
    return json({ ok: true });
  } catch (e) {
    console.error("delete-account error", e);
    return json({ error: "Couldn't delete the account." }, 500);
  }
});
