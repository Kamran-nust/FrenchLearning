import { supabase } from "./supabaseClient";

// Why a feedback request failed, so the screen can say something useful:
//   "limit_reached" - today's allowance is used up (quota holds the details)
//   "busy"          - the AI service is rate-limiting; nothing was used up
//   "other"         - anything else
export class FeedbackError extends Error {
  constructor(code, quota) {
    super(code);
    this.code = code;
    this.quota = quota || null;
  }
}

// Calls the `writing-feedback` Edge Function. Returns { feedback, quota }.
export async function fetchWritingFeedback(task, draft) {
  const { data, error } = await supabase.functions.invoke("writing-feedback", {
    body: { task, draft },
  });
  if (error) {
    const res = error.context;
    const body = res && typeof res.json === "function" ? await res.json().catch(() => ({})) : {};
    if (res && res.status === 429 && body.code === "limit_reached")
      throw new FeedbackError("limit_reached", body.status);
    if (res && res.status === 502) throw new FeedbackError("busy");
    throw new FeedbackError("other");
  }
  if (!data || !data.feedback) throw new FeedbackError("other");
  return { feedback: data.feedback, quota: data.quota || null };
}

// Where the signed-in user stands today: { tier, limit, used, remaining, resets_at }.
// limit/remaining are null when unlimited. Returns null if it can't be read.
export async function fetchFeedbackQuota() {
  const { data, error } = await supabase.rpc("feedback_quota");
  return error ? null : data;
}
