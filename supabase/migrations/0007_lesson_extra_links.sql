-- Extra links shown on a given day, in addition to the plan's own chips
-- (premium and super only). Same access rules as lesson_links: premium/super
-- read approved rows, super reads everything and is the only one who can write.
--   insert into lesson_extra_links (module, day, label, url) values ('kwiziq', 1, 'Some lesson', 'https://...');

create table if not exists lesson_extra_links (
  id bigint generated always as identity primary key,
  module text not null check (module in ('kwiziq', 'tv5')),
  day int not null check (day between 1 and 301),
  label text not null,
  url text not null check (url ~ '^https://'),
  sort int not null default 0,
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  unique (module, day, url)
);

alter table lesson_extra_links enable row level security;

create policy "Premium and super read approved extra links"
  on lesson_extra_links for select to authenticated
  using ((approved and public.current_tier() in ('premium', 'super')) or public.current_tier() = 'super');
create policy "Super users insert extra links"
  on lesson_extra_links for insert to authenticated
  with check (public.current_tier() = 'super');
create policy "Super users update extra links"
  on lesson_extra_links for update to authenticated
  using (public.current_tier() = 'super') with check (public.current_tier() = 'super');
create policy "Super users delete extra links"
  on lesson_extra_links for delete to authenticated
  using (public.current_tier() = 'super');
