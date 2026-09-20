-- Word Bank: a personal vocabulary list for Premium and Super users.
--   * word_bank_starter: the lists provided by the app owner (Premium gets the small list, Super all of it).
--   * word_bank_words:   each user's own copy - starter words copied in on first use, plus words they add.
-- The words feed the random review cards in the Anki section (the app reads them when Anki opens).
-- Access is enforced here, not just in the app: free users can neither read nor write.
-- Limits: Premium may add up to 500 of their own words. Super has no limit in practice; a very high
-- ceiling stops a bug or a runaway paste filling the database. Starter words never count towards the limit.
-- Change a limit by editing word_bank_own_limit() below.

create table if not exists word_bank_starter (
  id int generated always as identity primary key,
  tier_min text not null check (tier_min in ('premium', 'super')),
  position int not null,
  french text not null,
  english text not null,
  note text,
  unique (french, english)
);
-- No policies: only the functions below read it.
alter table word_bank_starter enable row level security;
revoke all on table word_bank_starter from public, anon, authenticated;

create table if not exists word_bank_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  french text not null check (char_length(btrim(french)) between 1 and 200),
  english text not null check (char_length(btrim(english)) between 1 and 200),
  note text check (note is null or char_length(note) <= 300),
  starter_id int references word_bank_starter(id) on delete set null,
  hidden boolean not null default false,
  added_day int not null default 1 check (added_day between 1 and 301),
  created_at timestamptz not null default now(),
  unique (user_id, starter_id)
);
create index if not exists word_bank_words_user_idx on word_bank_words (user_id);
alter table word_bank_words enable row level security;

-- The signed-in user's tier ('free' if unknown, so it fails closed).
create or replace function word_bank_tier(p_user uuid)
returns text as $$
  select coalesce((select tier from public.user_tiers where user_id = p_user), 'free');
$$ language sql security definer set search_path = public stable;

create or replace function word_bank_has_access(p_user uuid)
returns boolean as $$
  select public.word_bank_tier(p_user) in ('premium', 'super');
$$ language sql security definer set search_path = public stable;

-- How many of their own words a tier may have (0 = none).
create or replace function word_bank_own_limit(p_tier text)
returns int as $$
  select case p_tier when 'premium' then 500 when 'super' then 20000 else 0 end;
$$ language sql immutable;

revoke all on function word_bank_tier(uuid) from public, anon, authenticated;
revoke all on function word_bank_has_access(uuid) from public, anon;
grant execute on function word_bank_has_access(uuid) to authenticated;
revoke all on function word_bank_own_limit(text) from public, anon;
grant execute on function word_bank_own_limit(text) to authenticated;

drop policy if exists "Word bank: read own" on word_bank_words;
drop policy if exists "Word bank: add own" on word_bank_words;
drop policy if exists "Word bank: change own" on word_bank_words;
drop policy if exists "Word bank: delete own" on word_bank_words;
create policy "Word bank: read own" on word_bank_words for select to authenticated
  using (user_id = auth.uid() and public.word_bank_has_access(auth.uid()));
create policy "Word bank: add own" on word_bank_words for insert to authenticated
  with check (user_id = auth.uid() and public.word_bank_has_access(auth.uid()));
create policy "Word bank: change own" on word_bank_words for update to authenticated
  using (user_id = auth.uid() and public.word_bank_has_access(auth.uid()))
  with check (user_id = auth.uid() and public.word_bank_has_access(auth.uid()));
create policy "Word bank: delete own" on word_bank_words for delete to authenticated
  using (user_id = auth.uid() and public.word_bank_has_access(auth.uid()));
grant select, insert, update, delete on table word_bank_words to authenticated;

-- Enforces the limit on people's own (non-starter) words. The per-user lock stops two simultaneous
-- adds from both slipping under it.
create or replace function word_bank_enforce_limit()
returns trigger as $$
declare
  v_limit int;
  v_count int;
begin
  if new.starter_id is not null then return new; end if;
  perform pg_advisory_xact_lock(hashtext('word_bank:' || new.user_id::text));
  v_limit := public.word_bank_own_limit(public.word_bank_tier(new.user_id));
  select count(*) into v_count from public.word_bank_words where user_id = new.user_id and starter_id is null;
  if v_count >= v_limit then
    raise exception 'word_bank_limit' using errcode = 'check_violation';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists word_bank_limit_trg on word_bank_words;
create trigger word_bank_limit_trg before insert on word_bank_words
  for each row execute function word_bank_enforce_limit();

-- Copies any starter words the user is entitled to and doesn't have yet, then returns all their words.
-- Words they removed stay as hidden rows, so they don't come back on their own. Returns nothing for
-- free users. Safe to call any number of times.
create or replace function word_bank_list()
returns setof word_bank_words as $$
declare
  v_user uuid := auth.uid();
  v_tier text;
begin
  if v_user is null then return; end if;
  v_tier := public.word_bank_tier(v_user);
  if v_tier not in ('premium', 'super') then return; end if;

  insert into public.word_bank_words (user_id, french, english, note, starter_id)
  select v_user, s.french, s.english, s.note, s.id
  from public.word_bank_starter s
  where s.tier_min = 'premium' or v_tier = 'super'
  on conflict (user_id, starter_id) do nothing;

  return query
    select * from public.word_bank_words w where w.user_id = v_user order by w.created_at, w.french;
end;
$$ language plpgsql security definer set search_path = public;

-- Brings back starter words the user hid and undoes edits to them. Their own added words are untouched.
create or replace function word_bank_reset_starter()
returns void as $$
declare
  v_user uuid := auth.uid();
  v_tier text;
begin
  if v_user is null then return; end if;
  v_tier := public.word_bank_tier(v_user);
  if v_tier not in ('premium', 'super') then return; end if;

  update public.word_bank_words w
     set hidden = false, french = s.french, english = s.english, note = s.note
    from public.word_bank_starter s
   where w.user_id = v_user and w.starter_id = s.id
     and (s.tier_min = 'premium' or v_tier = 'super');

  insert into public.word_bank_words (user_id, french, english, note, starter_id)
  select v_user, s.french, s.english, s.note, s.id
  from public.word_bank_starter s
  where s.tier_min = 'premium' or v_tier = 'super'
  on conflict (user_id, starter_id) do nothing;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function word_bank_list() from public, anon;
grant execute on function word_bank_list() to authenticated;
revoke all on function word_bank_reset_starter() from public, anon;
grant execute on function word_bank_reset_starter() to authenticated;

-- The starter lists (Premium words are in the Super list too; Super gets every row).
insert into word_bank_starter (tier_min, position, french, english) values
  ('super', 1, 'le thé', 'Tea'),
  ('super', 2, 'le café', 'Coffee'),
  ('super', 3, 's’il vous plaît', 'Please'),
  ('super', 4, 'merci', 'Thank you'),
  ('premium', 5, 'bonjour', 'Hello'),
  ('super', 6, 'bonsoir', 'Good evening'),
  ('super', 7, 'oui', 'Yes'),
  ('premium', 8, 'je', 'I'),
  ('super', 9, 'non', 'No'),
  ('premium', 10, 'ou', 'Or'),
  ('premium', 11, 'et', 'And'),
  ('super', 12, 'Madame', 'Madam'),
  ('super', 13, 'Monsieur', 'Sir'),
  ('super', 14, 'au revoir', 'Goodbye'),
  ('super', 15, 'et toi ? / et vous ?', 'And you?'),
  ('super', 16, 'moi aussi', 'Me too'),
  ('super', 17, 'bon/bonne; bien', 'Good'),
  ('super', 18, 'enchanté(e)', 'Nice to meet you'),
  ('super', 19, 'à bientôt', 'See you soon'),
  ('premium', 20, 'un fils', 'Son'),
  ('super', 21, 'une fille', 'Daughter'),
  ('premium', 22, 'une sœur', 'Sister'),
  ('premium', 23, 'un oncle', 'Uncle'),
  ('super', 24, 'une tante', 'Aunt'),
  ('super', 25, 'maintenant', 'Now'),
  ('super', 26, 'un neveu', 'Nephew'),
  ('super', 27, 'une nièce', 'Niece'),
  ('premium', 28, 'aimer', 'Like'),
  ('super', 29, 'vouloir', 'Want'),
  ('super', 30, 'manger', 'Eat'),
  ('super', 31, 'salut', 'Hi'),
  ('premium', 32, 'avec', 'With'),
  ('super', 33, 'd’accord', 'OK'),
  ('premium', 34, 'très', 'Very'),
  ('super', 35, 'toujours', 'Always'),
  ('super', 36, 'prendre', 'Take'),
  ('super', 37, 'bien sûr', 'Of course'),
  ('super', 38, 'amusant(e)', 'Funny'),
  ('super', 39, 'intéressant(e)', 'Interesting'),
  ('super', 40, 'intelligent(e)', 'Intelligent'),
  ('super', 41, 'mais', 'But'),
  ('premium', 42, 'parce que', 'Because'),
  ('super', 43, 'les études / il-elle étudie', 'Studies'),
  ('super', 44, 'l’université', 'University'),
  ('super', 45, 'journaliste', 'Journalist'),
  ('super', 46, 'pas du tout', 'Not at all'),
  ('premium', 47, 'le lait', 'Milk'),
  ('super', 48, 'comprendre', 'Understand'),
  ('premium', 49, 'une chemise', 'Shirt'),
  ('super', 50, 'un manteau', 'Coat'),
  ('super', 51, 'un chapeau', 'Hat'),
  ('super', 52, 'un pull', 'Sweater'),
  ('super', 53, 'vert/verte', 'Green'),
  ('super', 54, 'bleu/bleue', 'Blue'),
  ('super', 55, 'rouge', 'Red'),
  ('premium', 56, 'noir/noire', 'Black'),
  ('super', 57, 'blanc/blanche', 'White'),
  ('premium', 58, 'une cravate', 'Tie'),
  ('premium', 59, 'une ceinture', 'Belt'),
  ('super', 60, 'une voiture', 'Car'),
  ('super', 61, 'une valise', 'Suitcase'),
  ('super', 62, 'une gare', 'Train station'),
  ('premium', 63, 'ici', 'Here'),
  ('super', 64, 'les vêtements', 'Clothes'),
  ('super', 65, 'une mère', 'Mother'),
  ('super', 66, 'un père', 'Father'),
  ('premium', 67, 'parle', 'Speaks'),
  ('super', 68, 'un mari / un époux', 'Husband'),
  ('premium', 69, 'une femme / une épouse', 'Wife'),
  ('super', 70, 'un garçon', 'Boy'),
  ('super', 71, 'une fille', 'Girl'),
  ('super', 72, 'allemand/allemande', 'German'),
  ('premium', 73, 'espagnol/espagnole', 'Spanish'),
  ('super', 74, 'tard / en retard', 'Late'),
  ('premium', 75, 'un peu', 'A little'),
  ('super', 76, 'vite / rapide', 'Fast'),
  ('super', 77, 'on y va', 'Let''s go'),
  ('super', 78, 'vite / rapide', 'Quick'),
  ('premium', 79, 'une clé', 'Key'),
  ('premium', 80, 'une poche', 'Pocket'),
  ('premium', 81, 'un portefeuille', 'Wallet'),
  ('premium', 82, 'dans / en', 'In'),
  ('super', 83, 'lourd/lourde', 'Heavy'),
  ('super', 84, 'une maison', 'House'),
  ('super', 85, 'une cour / un jardin', 'Yard'),
  ('super', 86, 'heureux/heureuse', 'Happy'),
  ('super', 87, 'le salon', 'Living room'),
  ('super', 88, 'joli/jolie', 'Pretty'),
  ('premium', 89, 'petit/petite', 'Small'),
  ('super', 90, 'grand/grande', 'Big'),
  ('super', 91, 'la cuisine', 'Kitchen'),
  ('premium', 92, 'une chaise', 'Chair'),
  ('super', 93, 'une table', 'Table'),
  ('super', 94, 'fatigué(e)', 'Tired'),
  ('super', 95, 'un chien', 'Dog'),
  ('super', 96, 'un chat', 'Cat'),
  ('super', 97, 'le travail / travailler', 'Work'),
  ('super', 98, 'un/une', 'One'),
  ('premium', 99, 'deux', 'Two'),
  ('premium', 100, 'trois', 'Three'),
  ('super', 101, 'quatre', 'Four'),
  ('premium', 102, 'cinq', 'Five'),
  ('super', 103, 'six', 'Six'),
  ('super', 104, 'sept', 'Seven'),
  ('super', 105, 'huit', 'Eight'),
  ('super', 106, 'neuf', 'Nine'),
  ('premium', 107, 'dix', 'Ten'),
  ('premium', 108, 'souvent', 'Often'),
  ('super', 109, 'une boulangerie', 'Bakery'),
  ('premium', 110, 'loyal(e) / fidèle', 'Loyal'),
  ('super', 111, 'joyeux/joyeuse', 'Joyful'),
  ('super', 112, 'intelligent(e) / malin(e)', 'Smart'),
  ('super', 113, 'marcher', 'Walk'),
  ('super', 114, 'jouer', 'Play'),
  ('super', 115, 'spécialiste', 'Specialist'),
  ('super', 116, 'bienvenue', 'Welcome'),
  ('super', 117, 'désolé(e) / pardon', 'Sorry'),
  ('super', 118, 'parfait(e)', 'Perfect'),
  ('super', 119, 'copine', 'Girlfriend'),
  ('super', 120, 'copain', 'Boyfriend'),
  ('premium', 121, 'rencontrer', 'Meet'),
  ('premium', 122, 'tous les jours / quotidien(ne)', 'Everyday'),
  ('super', 123, 'avoir faim', 'Hungry'),
  ('super', 124, 'quoi / que / quel(le)', 'What'),
  ('premium', 125, 'où', 'Where'),
  ('super', 126, 'beau/belle', 'Beautiful'),
  ('super', 127, 'qui', 'Who'),
  ('super', 128, 'lycéen/lycéenne', 'High school student'),
  ('super', 129, 'marié(e)', 'Married'),
  ('super', 130, 'voisin/voisine', 'Neighbour'),
  ('premium', 131, 'souriant(e)', 'Smiling'),
  ('premium', 132, 'gai(e) / joyeux/joyeuse', 'Cheerful'),
  ('premium', 133, 'précis(e) / exact(e) / correct(e)', 'Accurate'),
  ('super', 134, 'agriculteur/agricultrice', 'Farmer'),
  ('super', 135, 'facteur/factrice', 'Postman'),
  ('super', 136, 'infirmier/infirmière', 'Nurse'),
  ('super', 137, 'la nuit', 'Night'),
  ('super', 138, 'la mer', 'Sea'),
  ('super', 139, 'jumeaux/jumelles', 'Twins'),
  ('super', 140, 'vieux/vieille', 'Old'),
  ('premium', 141, 'triste', 'Sad'),
  ('premium', 142, 'seul/seule', 'Alone'),
  ('premium', 143, 'froid/froide', 'Cold'),
  ('super', 144, 'un livre', 'Book'),
  ('premium', 145, 'les bijoux', 'Jewellery'),
  ('premium', 146, 'le prénom', 'First name'),
  ('premium', 147, 'une pomme', 'Apple'),
  ('super', 148, 'caché/cachée', 'Hidden')
on conflict (french, english) do nothing;
