-- Database tests for the per-tier limits (AI feedback and PDF downloads).
-- Run against the linked project:
--   npx supabase db query --linked -f supabase/tests/limits_test.sql
-- Everything happens inside one block that always ends in an exception, so
-- nothing is ever saved: success is the message "ALL DATABASE TESTS PASSED".
-- Any other message names the check that failed.

do $$
declare
  u uuid;
  r json;
  n int;
begin
  select id into u from auth.users limit 1;
  if u is null then raise exception 'FAILED: need at least one user in auth.users'; end if;

  -- act as that user for auth.uid()
  perform set_config('request.jwt.claim.sub', u::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', u)::text, true);
  delete from user_tiers where user_id = u;
  delete from pdf_downloads where user_id = u;
  delete from feedback_usage where user_id = u;

  ---------------------------------------------------------------- PDF downloads
  -- free: never allowed
  r := claim_pdf_download(5);
  if (r->>'ok')::boolean then raise exception 'FAILED: free user got a PDF download'; end if;

  -- premium: one per 24h
  insert into user_tiers(user_id, tier) values (u, 'premium');
  r := claim_pdf_download(5);
  if not (r->>'ok')::boolean then raise exception 'FAILED: premium first PDF download was refused'; end if;
  r := claim_pdf_download(6);
  if (r->>'ok')::boolean then raise exception 'FAILED: premium got a second PDF download inside 24h'; end if;
  if (r->'status'->>'resets_at') is null then raise exception 'FAILED: premium at the limit has no reset time'; end if;

  -- refund gives it back; a second refund is harmless
  select id into n from pdf_downloads where user_id = u limit 1;
  perform refund_pdf_download(n);
  perform refund_pdf_download(n);
  r := claim_pdf_download(7);
  if not (r->>'ok')::boolean then raise exception 'FAILED: refund did not free the premium slot'; end if;

  -- an old refund (older than 2 minutes) is ignored
  update pdf_downloads set used_at = now() - interval '5 minutes' where user_id = u;
  select id into n from pdf_downloads where user_id = u limit 1;
  perform refund_pdf_download(n);
  select count(*) into n from pdf_downloads where user_id = u;
  if n <> 1 then raise exception 'FAILED: refund worked outside the 2-minute window'; end if;

  -- the slot returns after 24 hours
  update pdf_downloads set used_at = now() - interval '25 hours' where user_id = u;
  r := claim_pdf_download(8);
  if not (r->>'ok')::boolean then raise exception 'FAILED: premium slot did not return after 24h'; end if;

  -- super: unlimited, but only real days
  update user_tiers set tier = 'super' where user_id = u;
  for i in 1..5 loop r := claim_pdf_download(i); end loop;
  if not (r->>'ok')::boolean then raise exception 'FAILED: super hit a PDF limit'; end if;
  r := claim_pdf_download(0);
  if (r->>'ok')::boolean then raise exception 'FAILED: day 0 accepted'; end if;
  r := claim_pdf_download(302);
  if (r->>'ok')::boolean then raise exception 'FAILED: day 302 accepted'; end if;

  -- a tier with no row in pdf_limits is denied, never allowed
  delete from pdf_limits where tier = 'premium';
  update user_tiers set tier = 'premium' where user_id = u;
  delete from pdf_downloads where user_id = u;
  r := claim_pdf_download(3);
  if (r->>'ok')::boolean then raise exception 'FAILED: missing limit row allowed a download'; end if;

  ------------------------------------------------------------ AI writing feedback
  update user_tiers set tier = 'free' where user_id = u;
  r := try_use_feedback(u);
  if not (r->>'allowed')::boolean then raise exception 'FAILED: free first feedback refused'; end if;
  r := try_use_feedback(u);
  if (r->>'allowed')::boolean then raise exception 'FAILED: free got a second feedback in 24h'; end if;

  -- refund frees it
  delete from feedback_usage where user_id = u;
  r := try_use_feedback(u);
  perform refund_feedback(u, (r->>'usage_id')::bigint);
  r := try_use_feedback(u);
  if not (r->>'allowed')::boolean then raise exception 'FAILED: feedback refund did not free the slot'; end if;

  -- premium: 5
  delete from feedback_usage where user_id = u;
  update user_tiers set tier = 'premium' where user_id = u;
  for i in 1..5 loop r := try_use_feedback(u); end loop;
  if not (r->>'allowed')::boolean then raise exception 'FAILED: premium 5th feedback refused'; end if;
  r := try_use_feedback(u);
  if (r->>'allowed')::boolean then raise exception 'FAILED: premium got a 6th feedback'; end if;

  -- super: unlimited
  delete from feedback_usage where user_id = u;
  update user_tiers set tier = 'super' where user_id = u;
  for i in 1..12 loop r := try_use_feedback(u); end loop;
  if not (r->>'allowed')::boolean then raise exception 'FAILED: super hit a feedback limit'; end if;

  raise exception 'ALL DATABASE TESTS PASSED';
end $$;
