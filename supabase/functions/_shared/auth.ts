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

export { unauthorized };
