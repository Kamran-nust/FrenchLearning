// Text-to-speech proxy.
//
// The frontend sends { text: string }. This function authenticates to
// Google Cloud using a SERVICE ACCOUNT (not a plain API key - Google's
// console pushed this project toward service accounts for this API), then
// calls Google Cloud Text-to-Speech and returns the generated audio as
// base64 MP3 so the frontend can play it directly, e.g.:
//
//   const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
//   audio.play();
//
// Requires a Supabase secret GOOGLE_SERVICE_ACCOUNT_JSON containing the
// *entire contents* of the downloaded service-account JSON key file,
// pasted as one value.
//
// Voice: fr-FR-Neural2-C, a natural-sounding French female voice on
// Google's Neural2 tier (falls under the ~1M-characters/month free tier,
// not the newer Gemini TTS pricing). Swap the name below for a different
// one from https://cloud.google.com/text-to-speech/docs/voices if wanted.

import { GoogleAuth } from "npm:google-auth-library@9";
import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";

const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";
const VOICE_NAME = "fr-FR-Neural2-C";

let cachedAuth: GoogleAuth | null = null;
function getAuth(): GoogleAuth {
  if (cachedAuth) return cachedAuth;
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON secret.");
  const credentials = JSON.parse(raw);
  cachedAuth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  return cachedAuth;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const unauthorized = await requireUser(req);
  if (unauthorized) return unauthorized;

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "Request body must include non-empty 'text'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > 500) {
      // Sanity cap - a single French word/phrase should never approach this,
      // and it keeps any one request cheap regardless of client behaviour.
      return new Response(JSON.stringify({ error: "Text too long for a single flashcard request." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken: string | null | undefined;
    try {
      const auth = getAuth();
      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      accessToken = tokenResponse?.token;
    } catch (authErr) {
      console.error("text-to-speech: Google auth failed:", authErr);
      return new Response(JSON.stringify({ error: "Google auth failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Could not obtain a Google access token." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const googleResponse = await fetch(GOOGLE_TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accessToken,
      },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "fr-FR", name: VOICE_NAME },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.95 },
      }),
    });

    if (!googleResponse.ok) {
      const errText = await googleResponse.text();
      console.error("text-to-speech: Google TTS request failed:", errText);
      return new Response(JSON.stringify({ error: "Google TTS request failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const googleData = await googleResponse.json();
    // googleData.audioContent is already base64-encoded MP3 audio.
    return new Response(JSON.stringify({ audioContent: googleData.audioContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("text-to-speech: unexpected error:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
