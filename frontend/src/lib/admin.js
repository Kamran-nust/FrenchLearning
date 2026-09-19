import { supabase } from "./supabaseClient";

// Both calls are checked in the database: they only work for super users,
// whatever the app shows.

// All users with tier and recent activity, oldest account first.
export async function fetchAdminUsers() {
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw error;
  return data || [];
}

export async function changeUserTier(userId, tier) {
  const { error } = await supabase.rpc("set_user_tier", { target: userId, new_tier: tier });
  if (error) throw error;
}
