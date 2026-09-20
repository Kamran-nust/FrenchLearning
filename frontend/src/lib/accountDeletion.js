import { supabase } from "./supabaseClient";

// Why deleting the account failed:
//   "wrong_password"    - the password typed isn't the account's
//   "super_not_allowed" - Super accounts can't be deleted from the app
//   "sign_in"           - not signed in any more
//   "other"             - anything else
export class AccountDeletionError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

// The word a person types to confirm, and the check that both confirmations are filled in.
export const DELETE_WORD = "DELETE";

export function canConfirmDelete(typedWord, password) {
  return typedWord.trim() === DELETE_WORD && password.length > 0;
}

// Calls the `delete-account` Edge Function, which re-checks the password and removes the account and all its
// data. Resolves when it is gone; the caller then signs out.
export async function deleteAccount(password) {
  const { error } = await supabase.functions.invoke("delete-account", { body: { password } });
  if (!error) return;
  const res = error.context;
  const body = res && typeof res.json === "function" ? await res.json().catch(() => ({})) : {};
  if (body.code === "wrong_password") throw new AccountDeletionError("wrong_password");
  if (body.code === "super_not_allowed") throw new AccountDeletionError("super_not_allowed");
  if (res && res.status === 401) throw new AccountDeletionError("sign_in");
  throw new AccountDeletionError("other");
}
