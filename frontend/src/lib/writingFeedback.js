import { supabase } from "./supabaseClient";

// Calls the `writing-feedback` Edge Function and returns the feedback text.
export async function fetchWritingFeedback(task, draft) {
  const { data, error } = await supabase.functions.invoke("writing-feedback", {
    body: { task, draft },
  });
  if (error) throw error;
  if (!data || !data.feedback) throw new Error("No feedback in response");
  return data.feedback;
}
