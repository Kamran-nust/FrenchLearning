// Shared CORS headers. The frontend (running on your Vercel/Netlify domain)
// calls these functions cross-origin, so every response needs these headers,
// including the OPTIONS preflight response.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
