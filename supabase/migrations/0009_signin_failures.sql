-- Failed username sign-ins, so the `sign-in` function can slow down password
-- guessing: too many failures from one place (or against one name from one
-- place) within 15 minutes and further attempts are refused for a while.
-- Only the function touches this table (service role); no policies, so
-- signed-in users and the public can't read or write it.

create table if not exists signin_failures (
  id bigint generated always as identity primary key,
  username text not null,
  ip text not null,
  failed_at timestamptz not null default now()
);

create index if not exists signin_failures_ip_time_idx on signin_failures (ip, failed_at desc);
create index if not exists signin_failures_name_ip_time_idx on signin_failures (username, ip, failed_at desc);

alter table signin_failures enable row level security;
