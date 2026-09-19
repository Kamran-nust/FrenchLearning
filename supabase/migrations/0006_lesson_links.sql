-- Direct lesson links for the Kwiziq and TV5MONDE modules (premium and super).
-- Free users keep the Google-search links built into the app; premium/super
-- get the real page for any chip that has a row here.
--
-- Rows are keyed by (module, chip) where chip is the exact text the app shows.
-- Anything not listed simply falls back to the Google search. `approved`
-- lets candidate links sit here for review without anyone seeing them yet:
--   update lesson_links set approved = true where module = 'kwiziq' and chip = '...';

create table if not exists lesson_links (
  module text not null check (module in ('kwiziq', 'tv5')),
  chip text not null,
  url text not null check (url ~ '^https://'),
  title text,                                   -- what the page is called, to help review
  approved boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (module, chip)
);

alter table lesson_links enable row level security;

-- Premium and super can read approved links; super can also read unapproved ones.
create policy "Premium and super read approved lesson links"
  on lesson_links for select to authenticated
  using ((approved and public.current_tier() in ('premium', 'super')) or public.current_tier() = 'super');

-- Only super users can add, change or remove links.
create policy "Super users insert lesson links"
  on lesson_links for insert to authenticated
  with check (public.current_tier() = 'super');
create policy "Super users update lesson links"
  on lesson_links for update to authenticated
  using (public.current_tier() = 'super')
  with check (public.current_tier() = 'super');
create policy "Super users delete lesson links"
  on lesson_links for delete to authenticated
  using (public.current_tier() = 'super');

create or replace function touch_lesson_links_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists lesson_links_touch on lesson_links;
create trigger lesson_links_touch before update on lesson_links
  for each row execute function touch_lesson_links_updated_at();
