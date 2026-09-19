import { supabase } from "./supabaseClient";

// Where the signed-in user stands: { tier, allowed, resets_at } or null if
// it can't be read. resets_at is set only when a limited tier has used up
// its allowance (when the next download frees up).
export async function fetchPdfQuota() {
  const { data, error } = await supabase.rpc("pdf_quota");
  return error ? null : data;
}

// Reserves one download (the limit is enforced in the database).
// Returns { ok, id, status }; ok is false when the allowance is used up.
export async function claimPdfDownload(day) {
  const { data, error } = await supabase.rpc("claim_pdf_download", { p_day: day });
  if (error || !data) return { ok: false, status: null };
  return data;
}

// Hands the download back if building the PDF failed.
export async function refundPdfDownload(id) {
  await supabase.rpc("refund_pdf_download", { p_id: id });
}
