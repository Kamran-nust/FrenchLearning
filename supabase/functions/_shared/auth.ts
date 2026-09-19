import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";

// Returns null if the request carries a valid signed-in user's token,
// otherwise a ready-to-return 401 response. The public anon key is a valid
// JWT but not a user, so it is rejected here - only signed-in users can
// spend the shared Gemini / Google TTS / PDF-processing quota.
export async function requireUser(req: Request): Promise<Response | null> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (token) {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data?.user) return null;
  }
  return new Response(JSON.stringify({ error: "Sign in required." }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
