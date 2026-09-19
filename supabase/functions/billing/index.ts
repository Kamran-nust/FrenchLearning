// Billing (Stripe) - PLACEHOLDER until a Stripe account exists.
//
// The web app's Plans page calls this with
//   { action: "checkout", plan: "monthly" | "yearly" }  -> should return { url } of a Stripe Checkout page
//   { action: "portal" }                                  -> should return { url } of the customer portal
//
// For now it checks the caller and the request, then answers 503 with
// code "not_configured" so the page can say payments aren't switched on yet.
// Nothing here talks to Stripe and no card or bank detail ever passes through it.
//
// When Stripe is ready, set these Supabase secrets (never paste them in chat or commit them):
//   STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY
// and replace the two TODO blocks below. A second function (stripe-webhook) must then set
// user_tiers to 'premium' when a payment succeeds and back to 'free' when the subscription
// ends - the tier is only ever changed on the server, never by the browser.

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

  let body: { action?: string; plan?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Send a JSON body." }, 400);
  }

  if (body.action === "checkout") {
    if (body.plan !== "monthly" && body.plan !== "yearly") {
      return json({ error: "plan must be 'monthly' or 'yearly'." }, 400);
    }
    // TODO(stripe): create a Checkout Session in subscription mode for the chosen price,
    // with client_reference_id = userId, and return { url: session.url }.
  } else if (body.action === "portal") {
    // TODO(stripe): create a billing-portal session for this user's Stripe customer
    // and return { url: session.url }.
  } else {
    return json({ error: "Unknown action." }, 400);
  }

  if (!Deno.env.get("STRIPE_SECRET_KEY")) {
    return json({ error: "Payments aren't switched on yet.", code: "not_configured" }, 503);
  }
  return json({ error: "Stripe isn't connected to this function yet.", code: "not_configured" }, 503);
});
