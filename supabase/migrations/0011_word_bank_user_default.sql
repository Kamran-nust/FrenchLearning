-- The app inserts Word Bank words without sending a user id, so the row's owner must default to the
-- signed-in user. (The row-level-security policy still rejects any row whose user_id is not the caller's.)
alter table word_bank_words alter column user_id set default auth.uid();
