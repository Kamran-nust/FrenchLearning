import { supabase } from "./supabaseClient";
import { cleanWord } from "../shared/wordBank";

// Why a Word Bank request failed:
//   "limit" - the person has reached their own-words limit
//   "other" - anything else
export class WordBankError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function fail(error) {
  const text = (error && (error.message || "")) + " " + (error && error.details ? error.details : "");
  throw new WordBankError(text.includes("word_bank_limit") ? "limit" : "other");
}

// The person's words. The database first copies in any starter words they don't have yet, and returns
// nothing for free accounts. Throws WordBankError if it can't be read.
export async function fetchWordBank() {
  const { data, error } = await supabase.rpc("word_bank_list");
  if (error) fail(error);
  return data || [];
}

export async function addWord(fields, addedDay) {
  const w = cleanWord(fields);
  const { data, error } = await supabase
    .from("word_bank_words")
    .insert({ french: w.french, english: w.english, note: w.note, added_day: addedDay })
    .select()
    .single();
  if (error) fail(error);
  return data;
}

export async function updateWord(id, fields) {
  const w = cleanWord(fields);
  const { data, error } = await supabase
    .from("word_bank_words")
    .update({ french: w.french, english: w.english, note: w.note })
    .eq("id", id)
    .select()
    .single();
  if (error) fail(error);
  return data;
}

// Their own words are deleted; a starter word is only hidden, so it stays gone and can be brought back.
export async function removeWord(word) {
  const { error } = word.starter_id
    ? await supabase.from("word_bank_words").update({ hidden: true }).eq("id", word.id)
    : await supabase.from("word_bank_words").delete().eq("id", word.id);
  if (error) fail(error);
}

// Brings back hidden starter words and undoes edits to them.
export async function resetStarterWords() {
  const { error } = await supabase.rpc("word_bank_reset_starter");
  if (error) fail(error);
}
