-- Daily limits on downloading a day's plan as a PDF, per tier, over a rolling
-- 24 hours. Same design as the AI feedback limit:
--   update pdf_limits set downloads_per_day = 2 where tier = 'premium';
-- A NULL limit means unlimited. Free is 0 (also blocked in the UI).
-- The PDF itself is built in the browser; the browser must first get a
-- "ticket" from claim_pdf_download(), which is where the limit is enforced.

create table if not exists pdf_limits (
  tier text primary key check (tier in ('free', 'premium', 'super')),
  downloads_per_day int check (downloads_per_day is null or downloads_per_day >= 0)
);

insert into pdf_limits (tier, downloads_per_day) values
  ('free', 0),
  ('premium', 1),
  ('super', null)
on conflict (tier) do nothing;

alter table pdf_limits enable row level security;
create policy "Anyone signed in can read the pdf limits"
  on pdf_limits for select to authenticated using (true);

-- One row per download. No policies: only the functions below touch it.
create table if not exists pdf_downloads (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day int not null check (day between 1 and 301),
  used_at timestamptz not null default now()
);
create index if not exists pdf_downloads_user_time_idx on pdf_downloads (user_id, used_at desc);
alter table pdf_downloads enable row level security;

-- Where the given user stands (consumes nothing). resets_at is when the oldest
-- counted download ages out and frees a slot.
create or replace function pdf_download_status(p_user uuid)
returns json as $$
declare
  v_tier text;
  v_limit int;
  v_has_limit_row boolean;
  v_used int;
  v_resets timestamptz;
begin
  select coalesce((select tier from public.user_tiers where user_id = p_user), 'free') into v_tier;
  select downloads_per_day, true into v_limit, v_has_limit_row from public.pdf_limits where tier = v_tier;
  if v_has_limit_row is null then v_limit := 0; end if;   -- no row for the tier: deny, never allow

  select count(*), min(used_at) + interval '24 hours' into v_used, v_resets
  from public.pdf_downloads
  where user_id = p_user and used_at > now() - interval '24 hours';

  return json_build_object(
    'tier', v_tier,
    'allowed', v_limit is null or v_used < v_limit,
    'resets_at', case when v_limit is not null and v_used >= v_limit and v_limit > 0 then v_resets else null end
  );
end;
$$ language plpgsql security definer set search_path = public stable;

-- Signed-in users ask about themselves.
create or replace function pdf_quota()
returns json as $$
  select public.pdf_download_status(auth.uid());
$$ language sql security definer set search_path = public stable;

-- Reserve one download for the caller, atomically (the lock stops two
-- simultaneous requests from both slipping under the limit).
create or replace function claim_pdf_download(p_day int)
returns json as $$
declare
  v_user uuid := auth.uid();
  st json;
  v_id bigint;
begin
  if v_user is null then
    return json_build_object('ok', false, 'status', json_build_object('allowed', false));
  end if;
  perform pg_advisory_xact_lock(hashtext('pdf:' || v_user::text));
  delete from public.pdf_downloads where user_id = v_user and used_at < now() - interval '2 days';

  st := public.pdf_download_status(v_user);
  if not (st->>'allowed')::boolean or p_day is null or p_day < 1 or p_day > 301 then
    return json_build_object('ok', false, 'status', st);
  end if;

  insert into public.pdf_downloads (user_id, day) values (v_user, p_day) returning id into v_id;
  return json_build_object('ok', true, 'id', v_id, 'status', public.pdf_download_status(v_user));
end;
$$ language plpgsql security definer set search_path = public;

-- Give the download back if building the PDF failed. Only your own, and only
-- within two minutes of claiming it.
create or replace function refund_pdf_download(p_id bigint)
returns void as $$
  delete from public.pdf_downloads
  where id = p_id and user_id = auth.uid() and used_at > now() - interval '2 minutes';
$$ language sql security definer set search_path = public;

revoke all on function pdf_download_status(uuid) from public, anon, authenticated;
grant execute on function pdf_download_status(uuid) to service_role;

revoke all on function pdf_quota() from public, anon;
revoke all on function claim_pdf_download(int) from public, anon;
revoke all on function refund_pdf_download(bigint) from public, anon;
grant execute on function pdf_quota() to authenticated;
grant execute on function claim_pdf_download(int) to authenticated;
grant execute on function refund_pdf_download(bigint) to authenticated;
