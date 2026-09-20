-- Hardening: bound how much a signed-in user can store in their own app_state rows.
--
-- RLS already stops anyone reading or writing another person's rows, but nothing capped how large a
-- value could be. A user could PATCH one key with a multi-megabyte (or larger) body and run up the
-- database - a self-service storage-abuse / cost vector. These checks bound it without affecting any
-- real use: the largest legitimate value today is ~1 KB, and even a full 301-day plan of writing
-- entries (all held under one key) is well under the 4 MB cap. Keys are short fixed identifiers.

alter table app_state
  add constraint app_state_key_len check (length(key) <= 64),
  add constraint app_state_value_size check (octet_length(value::text) <= 4 * 1024 * 1024);
