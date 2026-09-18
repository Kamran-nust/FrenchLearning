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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, draft } = await req.json();

    if (!task || typeof task !== "string" || !task.trim()) {
      return new Response(JSON.stringify({ error: "Request body must include non-empty 'task'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!draft || typeof draft !== "string" || !draft.trim()) {
      return new Response(JSON.stringify({ error: "Request body must include non-empty 'draft'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (task.length > MAX_INPUT_CHARS || draft.length > MAX_INPUT_CHARS) {
      return new Response(JSON.stringify({ error: "Input too long for a single feedback request." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY secret." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiResponse = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(task, draft) }] }],
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return new Response(JSON.stringify({ error: "Gemini request failed", detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await geminiResponse.json();
    const feedback = ((data.candidates || [])[0]?.content?.parts || [])
      .map((part: { text?: string }) => part.text || "")
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!feedback) {
      return new Response(JSON.stringify({ error: "Empty response from Gemini" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected server error", detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
