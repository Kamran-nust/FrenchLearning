import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Sign in required." }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Validates the caller's token with Supabase Auth. Returns the signed-in
// user's id, or null. The public anon key is a valid JWT but not a user, so
// it yields null.
export async function getUserId(req: Request): Promise<string | null> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data, error } = await supabase.auth.getUser(token);
  return !error && data?.user ? data.user.id : null;
}

// Returns null if the request carries a valid signed-in user's token,
// otherwise a ready-to-return 401 response. Only signed-in users can spend
// the shared Gemini / Google TTS / PDF-processing quota.
export async function requireUser(req: Request): Promise<Response | null> {
  return (await getUserId(req)) ? null : unauthorized();
}

const TIER_ORDER = ["free", "premium", "super"];

// Requires a signed-in user whose tier is at least `minimum`. Returns null if
// allowed, otherwise a 401 (not signed in) or 403 (tier too low) response.
// If the tier can't be read it counts as free, so it fails closed.
export async function requireTier(req: Request, minimum: "premium" | "super"): Promise<Response | null> {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await admin.from("user_tiers").select("tier").eq("user_id", userId).maybeSingle();
  const tier = data?.tier ?? "free";

  if (TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(minimum) && TIER_ORDER.indexOf(tier) >= 0) return null;
  return new Response(JSON.stringify({ error: "This is a " + minimum + " feature.", code: "tier_required", required: minimum }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export { unauthorized };
