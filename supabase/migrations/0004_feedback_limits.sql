-- Daily limits on AI writing feedback, per tier, over a rolling 24 hours.
-- Limits live in a table so they can be changed without touching code:
--   update tier_limits set feedback_per_day = 10 where tier = 'premium';
-- A NULL limit means unlimited.

create table if not exists tier_limits (
  tier text primary key check (tier in ('free', 'premium', 'super')),
  feedback_per_day int check (feedback_per_day is null or feedback_per_day >= 0)
);

insert into tier_limits (tier, feedback_per_day) values
  ('free', 1),
  ('premium', 5),
  ('super', null)
on conflict (tier) do nothing;

alter table tier_limits enable row level security;
create policy "Anyone signed in can read the limits"
  on tier_limits for select to authenticated using (true);

-- One row per AI feedback used. No policies: only the functions below touch it.
create table if not exists feedback_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  used_at timestamptz not null default now()
);
create index if not exists feedback_usage_user_time_idx on feedback_usage (user_id, used_at desc);
alter table feedback_usage enable row level security;

-- Where a user stands right now (does not consume anything).
-- resets_at is when the oldest counted use ages out and frees a slot.
create or replace function feedback_status(p_user uuid)
returns json as $$
declare
  v_tier text;
  v_limit int;
  v_has_limit_row boolean;
  v_used int;
  v_resets timestamptz;
begin
  select coalesce((select tier from public.user_tiers where user_id = p_user), 'free') into v_tier;
  select feedback_per_day, true into v_limit, v_has_limit_row from public.tier_limits where tier = v_tier;
  if v_has_limit_row is null then v_limit := 0; end if;   -- no row for the tier: deny, never allow

  select count(*), min(used_at) + interval '24 hours' into v_used, v_resets
  from public.feedback_usage
  where user_id = p_user and used_at > now() - interval '24 hours';

  return json_build_object(
    'tier', v_tier,
    'limit', v_limit,
    'used', v_used,
    'remaining', case when v_limit is null then null else greatest(v_limit - v_used, 0) end,
    'resets_at', case when v_limit is not null and v_used >= v_limit then v_resets else null end
  );
end;
$$ language plpgsql security definer set search_path = public stable;

-- Signed-in users ask about themselves.
create or replace function feedback_quota()
returns json as $$
  select public.feedback_status(auth.uid());
$$ language sql security definer set search_path = public stable;

-- Called by the Edge Function (service role only): reserve one use, atomically.
-- The per-user lock stops two simultaneous requests from both slipping under
-- the limit. If the AI call then fails, the function refunds the reservation.
create or replace function try_use_feedback(p_user uuid)
returns json as $$
declare
  st json;
  v_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('feedback:' || p_user::text));
  delete from public.feedback_usage where user_id = p_user and used_at < now() - interval '2 days';

  st := public.feedback_status(p_user);
  if (st->>'limit') is not null and (st->>'used')::int >= (st->>'limit')::int then
    return json_build_object('allowed', false, 'status', st);
  end if;

  insert into public.feedback_usage (user_id) values (p_user) returning id into v_id;
  return json_build_object('allowed', true, 'usage_id', v_id, 'status', public.feedback_status(p_user));
end;
$$ language plpgsql security definer set search_path = public;

create or replace function refund_feedback(p_user uuid, p_usage_id bigint)
returns void as $$
  delete from public.feedback_usage where id = p_usage_id and user_id = p_user;
$$ language sql security definer set search_path = public;

-- Functions are executable by everyone by default; lock the sensitive ones down.
revoke all on function feedback_status(uuid) from public, anon, authenticated;
revoke all on function try_use_feedback(uuid) from public, anon, authenticated;
revoke all on function refund_feedback(uuid, bigint) from public, anon, authenticated;
grant execute on function feedback_status(uuid) to service_role;
grant execute on function try_use_feedback(uuid) to service_role;
grant execute on function refund_feedback(uuid, bigint) to service_role;

revoke all on function feedback_quota() from public, anon;
grant execute on function feedback_quota() to authenticated;
