import { supabase } from "./supabaseClient";

// Why a billing request failed:
//   "not_configured" - payments aren't switched on yet (no Stripe keys on the server)
//   "sign_in"        - not signed in
//   "other"          - anything else
export class BillingError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

async function callBilling(body) {
  const { data, error } = await supabase.functions.invoke("billing", { body });
  if (error) {
    const res = error.context;
    const payload = res && typeof res.json === "function" ? await res.json().catch(() => ({})) : {};
    if (payload.code === "not_configured") throw new BillingError("not_configured");
    if (res && res.status === 401) throw new BillingError("sign_in");
    throw new BillingError("other");
  }
  if (!data || typeof data.url !== "string") throw new BillingError("other");
  return data.url;
}

// Returns the Stripe Checkout address to send the browser to. plan: "monthly" | "yearly".
export function startCheckout(plan) {
  return callBilling({ action: "checkout", plan });
}

// Returns the Stripe customer-portal address (change card, cancel, invoices).
export function openBillingPortal() {
  return callBilling({ action: "portal" });
}
