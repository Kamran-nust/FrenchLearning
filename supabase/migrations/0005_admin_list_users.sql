-- Admin page support: list every user with their tier and recent activity.
-- Super users only - checked here in the database, so the restriction holds
-- no matter what the app shows. Changing a tier reuses set_user_tier()
-- (also super-only, and it protects the last super user).

create or replace function admin_list_users()
returns table (
  user_id uuid,
  email text,
  username text,
  tier text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  feedback_used_24h int
) as $$
begin
  if public.current_tier() <> 'super' then
    raise exception 'Only super users can list users.' using errcode = '42501';
  end if;

  return query
    select u.id,
           u.email::text,
           p.username,
           coalesce(t.tier, 'free'),
           u.created_at,
           u.last_sign_in_at,
           (select count(*)::int from public.feedback_usage f
             where f.user_id = u.id and f.used_at > now() - interval '24 hours')
    from auth.users u
    left join public.user_tiers t on t.user_id = u.id
    left join public.profiles p on p.user_id = u.id
    order by u.created_at;
end;
$$ language plpgsql security definer set search_path = public stable;

revoke all on function admin_list_users() from public, anon;
grant execute on function admin_list_users() to authenticated;
