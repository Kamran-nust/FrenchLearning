// Writing-feedback proxy.
//
// The frontend sends { task: string, draft: string } - the day's writing
// prompt and what the person wrote. This function builds the tutoring
// prompt server-side, calls the Gemini API with a server-held key, and
// returns the feedback text.
//
// Requires a Supabase secret GEMINI_API_KEY (from
// https://aistudio.google.com/apikey - free tier, well within this app's
// usage pattern of at most a couple of requests per day). The frontend
// never sees the key, it only ever talks to this proxy.

import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getUserId, unauthorized } from "../_shared/auth.ts";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";
const MAX_INPUT_CHARS = 4000; // sanity cap - the longest writing task/draft on this plan is nowhere near this

function buildPrompt(task: string, draft: string): string {
  return (
    "You are a supportive French tutor helping a CLB7/NCLC7 exam candidate practice writing. " +
    'The task they were given was: "' +
    task +
    '"\n\nHere is what they wrote:\n"' +
    draft +
    '"\n\nGive concise, encouraging feedback in English: (1) briefly note whether they met the content and length target, ' +
    "(2) address the specific grammar checkpoint mentioned in the task if there is one, quoting their exact phrase and the correction, " +
    "(3) point out up to two other notable errors the same way, (4) end with one short tip for next time. " +
    "Keep the whole reply under 150 words. Be warm but direct."
  );
}

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

  const userId = await getUserId(req);
  if (!userId) return unauthorized();

  // Service-role client, used only to reserve/refund the daily quota.
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let usageId: number | null = null;

  try {
    const { task, draft } = await req.json();

    if (!task || typeof task !== "string" || !task.trim()) {
      return json({ error: "Request body must include non-empty 'task'." }, 400);
    }
    if (!draft || typeof draft !== "string" || !draft.trim()) {
      return json({ error: "Request body must include non-empty 'draft'." }, 400);
    }
    if (task.length > MAX_INPUT_CHARS || draft.length > MAX_INPUT_CHARS) {
      return json({ error: "Input too long for a single feedback request." }, 400);
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return json({ error: "Missing GEMINI_API_KEY secret." }, 500);

    // Reserve one use of the daily allowance (limits per tier: see tier_limits).
    // Done only after the request is known to be valid, so bad requests cost nothing.
    const { data: quota, error: quotaError } = await admin.rpc("try_use_feedback", { p_user: userId });
    if (quotaError || !quota) return json({ error: "Could not check your daily limit." }, 500);
    if (!quota.allowed) {
      return json({ error: "Daily AI feedback limit reached.", code: "limit_reached", status: quota.status }, 429);
    }
    usageId = quota.usage_id;

    const geminiResponse = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: buildPrompt(task, draft) }] }] }),
    });
    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      await refund();
      console.error("writing-feedback: Gemini request failed:", errText);
      return json({ error: "Gemini request failed" }, 502);
    }

    const data = await geminiResponse.json();
    const feedback = ((data.candidates || [])[0]?.content?.parts || [])
      .map((part: { text?: string }) => part.text || "")
      .filter(Boolean)
      .join("\n")
      .trim();
    if (!feedback) {
      await refund();
      return json({ error: "Empty response from Gemini" }, 502);
    }

    const { data: after } = await admin.rpc("feedback_status", { p_user: userId });
    return json({ feedback, quota: after ?? quota.status });
  } catch (err) {
    await refund();
    console.error("writing-feedback: unexpected error:", err);
    return json({ error: "Unexpected server error" }, 500);
  }

  // A failed AI call must not use up the person's daily allowance.
  async function refund() {
    if (usageId !== null) {
      await admin.rpc("refund_feedback", { p_user: userId, p_usage_id: usageId });
      usageId = null;
    }
  }
});
