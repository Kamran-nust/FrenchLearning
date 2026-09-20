-- Database tests for the Word Bank (access by tier, starter lists, limits, hiding and resetting).
-- Run against the linked project after applying migration 0010:
--   npx supabase db query --linked -f supabase/tests/word_bank_test.sql
-- Everything happens inside one block that always ends in an exception, so nothing is ever saved:
-- success is the message "ALL WORD BANK TESTS PASSED". Any other message names the check that failed.

do $$
declare
  u uuid;
  n int;
  premium_n int;
  super_n int;
  w uuid;
  failed boolean;
begin
  select id into u from auth.users limit 1;
  if u is null then raise exception 'FAILED: need at least one user in auth.users'; end if;

  select count(*) into premium_n from word_bank_starter where tier_min = 'premium';
  select count(*) into super_n from word_bank_starter;
  if premium_n <> 45 then raise exception 'FAILED: expected 45 premium starter words, found %', premium_n; end if;
  if super_n <> 148 then raise exception 'FAILED: expected 148 starter words in total, found %', super_n; end if;

  perform set_config('request.jwt.claim.sub', u::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', u)::text, true);
  delete from user_tiers where user_id = u;
  delete from word_bank_words where user_id = u;

  ---------------------------------------------------------------- free: nothing
  select count(*) into n from word_bank_list();
  if n <> 0 then raise exception 'FAILED: free user got % words', n; end if;
  select count(*) into n from word_bank_words where user_id = u;
  if n <> 0 then raise exception 'FAILED: free user got starter words copied in'; end if;

  ---------------------------------------------------------------- premium: small list
  insert into user_tiers(user_id, tier) values (u, 'premium');
  select count(*) into n from word_bank_list();
  if n <> premium_n then raise exception 'FAILED: premium should get % words, got %', premium_n, n; end if;
  select count(*) into n from word_bank_list();
  if n <> premium_n then raise exception 'FAILED: listing twice duplicated words (%)', n; end if;

  -- add an own word
  insert into word_bank_words (user_id, french, english, added_day) values (u, 'le fromage', 'cheese', 12) returning id into w;
  select count(*) into n from word_bank_words where user_id = u and starter_id is null;
  if n <> 1 then raise exception 'FAILED: own word not saved'; end if;

  -- the app sends no user id: the row must default to the signed-in user
  insert into word_bank_words (french, english) values ('sans id', 'without an id');
  select count(*) into n from word_bank_words where user_id = u and french = 'sans id';
  if n <> 1 then raise exception 'FAILED: a word added without a user id was not given to the signed-in user'; end if;
  delete from word_bank_words where french = 'sans id' and user_id = u;

  -- hide a starter word: it stays hidden after listing again (does not come back)
  update word_bank_words set hidden = true where user_id = u and french = 'bonjour';
  perform word_bank_list();
  select count(*) into n from word_bank_words where user_id = u and french = 'bonjour' and hidden;
  if n <> 1 then raise exception 'FAILED: hidden starter word came back'; end if;

  -- edit a starter word, then reset: text restored and unhidden
  update word_bank_words set english = 'edited' where user_id = u and french = 'ou';
  perform word_bank_reset_starter();
  select count(*) into n from word_bank_words where user_id = u and french = 'bonjour' and not hidden;
  if n <> 1 then raise exception 'FAILED: reset did not unhide bonjour'; end if;
  select count(*) into n from word_bank_words where user_id = u and french = 'ou' and english = 'Or';
  if n <> 1 then raise exception 'FAILED: reset did not restore the edited starter word'; end if;
  select count(*) into n from word_bank_words where id = w;
  if n <> 1 then raise exception 'FAILED: reset removed an own word'; end if;

  -- premium limit: 500 own words (starter words do not count)
  insert into word_bank_words (user_id, french, english)
  select u, 'mot ' || g, 'word ' || g from generate_series(1, 499) g;   -- 1 + 499 = 500 own words
  failed := false;
  begin
    insert into word_bank_words (user_id, french, english) values (u, 'un de trop', 'one too many');
  exception when check_violation then failed := true;
  end;
  if not failed then raise exception 'FAILED: premium exceeded 500 own words'; end if;

  -- premium does not get the super-only words
  select count(*) into n from word_bank_words where user_id = u and starter_id is not null;
  if n <> premium_n then raise exception 'FAILED: premium has % starter rows', n; end if;

  ---------------------------------------------------------------- upgrade to super: whole list, no 500 cap
  update user_tiers set tier = 'super' where user_id = u;
  perform word_bank_list();
  select count(*) into n from word_bank_words where user_id = u and starter_id is not null;
  if n <> super_n then raise exception 'FAILED: super should have % starter words, has %', super_n, n; end if;
  insert into word_bank_words (user_id, french, english) values (u, 'le 501e', 'the 501st');

  ---------------------------------------------------------------- lapse: back to free
  update user_tiers set tier = 'free' where user_id = u;
  select count(*) into n from word_bank_list();
  if n <> 0 then raise exception 'FAILED: lapsed user can still list words'; end if;
  failed := false;
  begin
    insert into word_bank_words (user_id, french, english) values (u, 'non', 'no');
  exception when others then failed := true;
  end;
  if not failed then raise exception 'FAILED: free user could add a word'; end if;

  -- words are kept and return on resubscribe
  update user_tiers set tier = 'premium' where user_id = u;
  select count(*) into n from word_bank_words where user_id = u and starter_id is null;
  if n <> 501 then raise exception 'FAILED: own words were not kept (found %)', n; end if;

  raise exception 'ALL WORD BANK TESTS PASSED';
end
$$;
