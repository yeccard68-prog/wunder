-- "Wie hast du von uns gehört?" – an optional answer in the onboarding (one of a fixed list, never free text),
-- so the team can see which channel works without any tracker. Editors only see totals per answer.
alter table public.profiles add column heard_from text
  check (heard_from in ('friends', 'tiktok', 'instagram', 'youtube', 'store', 'press', 'school', 'other'));
-- players may set (and read) only this one new column of their own row; the row policy stays as it is
grant select (heard_from), update (heard_from) on public.profiles to authenticated;

create function public.admin_heard_from() returns table (heard_from text, players bigint, last_30_days bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select coalesce(p.heard_from, 'none'), count(*), count(*) filter (where p.created_at > now() - interval '30 days')
    from public.profiles p where p.onboarded
    group by 1 order by 2 desc;
end $$;
revoke execute on function public.admin_heard_from() from public, anon;
grant execute on function public.admin_heard_from() to authenticated;
