-- Account tiers: free < premium < super.
-- The tier lives server-side and can't be changed from the browser: there
-- are no insert/update/delete policies, so the only ways to change one are
-- the dashboard/SQL, or set_user_tier() below (super users only).

create table if not exists user_tiers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'premium', 'super')),
  updated_at timestamptz not null default now()
);

alter table user_tiers enable row level security;

create policy "Users can read their own tier"
  on user_tiers for select
  using (auth.uid() = user_id);

-- Everyone who already has an account starts on the free tier.
insert into user_tiers (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- New accounts start on the free tier.
create or replace function handle_new_user_tier()
returns trigger as $$
begin
  insert into public.user_tiers (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created_tier on auth.users;
create trigger on_auth_user_created_tier
  after insert on auth.users
  for each row execute function handle_new_user_tier();

-- The signed-in caller's tier (free if they somehow have no row).
create or replace function current_tier()
returns text as $$
  select coalesce((select tier from public.user_tiers where user_id = auth.uid()), 'free');
$$ language sql security definer set search_path = public stable;

-- Lets a super user change someone's tier (for a future in-app admin page).
-- Refuses to remove the last super user so the app can't lock itself out.
create or replace function set_user_tier(target uuid, new_tier text)
returns void as $$
begin
  if public.current_tier() <> 'super' then
    raise exception 'Only super users can change tiers.' using errcode = '42501';
  end if;
  if new_tier not in ('free', 'premium', 'super') then
    raise exception 'Unknown tier: %', new_tier;
  end if;
  if new_tier <> 'super'
     and (select tier from public.user_tiers where user_id = target) = 'super'
     and (select count(*) from public.user_tiers where tier = 'super') <= 1 then
    raise exception 'Cannot remove the last super user.';
  end if;
  insert into public.user_tiers (user_id, tier) values (target, new_tier)
  on conflict (user_id) do update set tier = excluded.tier, updated_at = now();
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function current_tier() to authenticated;
grant execute on function set_user_tier(uuid, text) to authenticated;
