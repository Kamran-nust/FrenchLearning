-- Usernames. Supabase Auth only knows email + password, so the username
-- lives in its own table, keyed to the auth user.

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[A-Za-z0-9_]{3,20}$')
);

-- "Kamran" and "kamran" are the same name.
create unique index if not exists profiles_username_lower_idx on profiles (lower(username));

-- A person can read their own profile. There are deliberately no insert/
-- update/delete policies: profiles are only ever written by the trigger
-- below, so nobody can change or claim a name from the browser.
alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = user_id);

-- Creates the profile when an account is created, from the username the
-- signup form sends as user metadata. Accounts without one (created before
-- this migration, or via the dashboard) simply get no profile.
create or replace function handle_new_user()
returns trigger as $$
begin
  if coalesce(new.raw_user_meta_data->>'username', '') <> '' then
    insert into public.profiles (user_id, username)
    values (new.id, new.raw_user_meta_data->>'username');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Lets the signup form say "that name is taken" before creating the account.
-- Reveals only whether a name exists, not who owns it.
create or replace function username_available(name text)
returns boolean as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(name));
$$ language sql security definer set search_path = public stable;

grant execute on function username_available(text) to anon, authenticated;
