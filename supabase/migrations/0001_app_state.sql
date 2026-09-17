-- App state table: mirrors the existing window.storage.get/set(key, value)
-- pattern the app already uses (progress, hard-words, card-stats,
-- grammar-progress, kwiziq-progress, tv5-progress, writing-progress,
-- writing-entries). One generic table means the frontend's storage
-- layer swaps out almost 1:1, instead of redesigning per module.

create table if not exists app_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Row-level security: a person can only ever read or write their own rows.
alter table app_state enable row level security;

create policy "Users can read their own state"
  on app_state for select
  using (auth.uid() = user_id);

create policy "Users can insert their own state"
  on app_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own state"
  on app_state for update
  using (auth.uid() = user_id);

create policy "Users can delete their own state"
  on app_state for delete
  using (auth.uid() = user_id);

-- Keep updated_at current on every write.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger app_state_set_updated_at
  before update on app_state
  for each row
  execute function set_updated_at();
