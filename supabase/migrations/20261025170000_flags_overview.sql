-- Switches for features that can be turned off without a new app version (chat, groups), enforced on the server:
-- when off, the functions refuse and the app hides the feature. Plus an overview for editors: players per day.
-- At launch chat and groups are OFF (decided 21.10.2026: they bring the most legal duties – terms of use,
-- moderation – and can be switched on in the review screen later).

create table private.app_flags (
  key   text primary key check (key in ('chat', 'groups')),
  on_   boolean not null,
  changed_at timestamptz not null default now()
);
insert into private.app_flags (key, on_) values ('chat', false), ('groups', false);

create function private.flag(p_key text) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select on_ from private.app_flags where key = p_key), false)
$$;

-- for everyone (also anon): which features are on
create function public.app_flags() returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(key, on_), '{}'::jsonb) from private.app_flags
$$;

create function public.admin_set_flag(p_key text, p_on boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  update private.app_flags set on_ = p_on, changed_at = now() where key = p_key;
  if not found then raise exception 'unknown flag'; end if;
end $$;

-- chat: closed while the flag is off (reading included – nothing is shown)
create or replace function private.chat_place_ok(p_user uuid, p_duel uuid, p_group uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select private.flag('chat') and private.chat_age_ok(p_user) and case
    when p_duel is not null then exists (
      select 1 from public.duels d where d.id = p_duel and d.kind <> 'bot' and d.player_b is not null
        and (d.player_a = p_user or d.player_b = p_user)
        and private.chat_age_ok(case when d.player_a = p_user then d.player_b else d.player_a end)
        and not private.duel_blocked(d.player_a, d.player_b))
    when p_group is not null then private.group_member(p_group, p_user) and private.flag('groups')
    else false end
$$;

-- groups: no new groups, no joining and no new rounds while off (existing data stays untouched)
create function private.groups_on() returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.flag('groups') then raise exception 'groups are switched off' using errcode = '42501'; end if;
end $$;

-- group_create and group_join refuse while groups are off
create or replace function public.group_create(p_name text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_id uuid;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  perform private.groups_on();
  if not private.duel_allowed(v_user) then raise exception 'groups are not available for this age' using errcode = '42501'; end if;
  if not private.name_allowed(p_name) then raise exception 'name not allowed' using errcode = '22023'; end if;
  if (select count(*) from public.group_members where user_id = v_user) >= 20 then raise exception 'too many groups' using errcode = '54000'; end if;
  loop
    begin
      insert into public.groups (name, code, owner) values (btrim(p_name), private.duel_code(), v_user) returning id into v_id;
      exit;
    exception when unique_violation then null;
    end;
  end loop;
  insert into public.group_members (group_id, user_id) values (v_id, v_user);
  return jsonb_build_object('id', v_id, 'code', (select code from public.groups where id = v_id));
end $$;


create or replace function public.group_join(p_code text) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  g public.groups%rowtype;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  perform private.groups_on();
  if not private.duel_allowed(v_user) then raise exception 'groups are not available for this age' using errcode = '42501'; end if;
  select * into g from public.groups where code = upper(btrim(p_code));
  if not found then raise exception 'group not found' using errcode = 'P0002'; end if;
  if private.group_member(g.id, v_user) then return g.id; end if;
  if (select count(*) from public.group_members where group_id = g.id) >= 50 then raise exception 'group full' using errcode = '54000'; end if;
  if (select count(*) from public.group_members where user_id = v_user) >= 20 then raise exception 'too many groups' using errcode = '54000'; end if;
  insert into public.group_members (group_id, user_id) values (g.id, v_user);
  update public.groups set updated_at = now() where id = g.id;
  return g.id;
end $$;


-- editors: players per day (active = answered at least one question that day) and totals
create function public.admin_overview(p_days int default 14) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return jsonb_build_object(
    'days', (select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'active', d.active, 'new', d.new) order by d.day), '[]'::jsonb) from (
      select g.day::date as day,
        (select count(distinct a.user_id) from public.daily_activity a where a.activity_date = g.day::date) as active,
        (select count(*) from public.profiles p where p.onboarded and p.created_at::date = g.day::date) as new
      from generate_series(current_date - (least(greatest(p_days, 1), 90) - 1), current_date, interval '1 day') as g(day)) d),
    'players', (select count(*) from public.profiles where onboarded),
    'active7', (select count(distinct user_id) from public.daily_activity where activity_date > current_date - 7),
    'active30', (select count(distinct user_id) from public.daily_activity where activity_date > current_date - 30),
    'answers30', (select coalesce(sum(answered_count), 0) from public.daily_activity where activity_date > current_date - 30),
    'duels30', (select count(*) from public.duels where created_at > now() - interval '30 days'),
    'groups', (select count(*) from public.groups),
    'openHints', (select count(*) from public.content_hints where resolved_at is null),
    'openChatReports', (select count(distinct message_id) from public.chat_reports where resolved_at is null),
    'dbSize', pg_size_pretty(pg_database_size(current_database())));
end $$;

revoke execute on function private.flag(text), private.groups_on() from public, anon, authenticated;
revoke execute on function public.admin_set_flag(text, boolean), public.admin_overview(int) from public, anon;
grant execute on function public.app_flags() to anon, authenticated;
grant execute on function public.admin_set_flag(text, boolean), public.admin_overview(int) to authenticated;
