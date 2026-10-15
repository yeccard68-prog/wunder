-- Duels and age: children under 13 (age bands 6-9 and 10-12) cannot duel other people – the app only
-- offers them the practice duel on the device. Players under 16 never show their name to the opponent,
-- and duels only use questions that suit everyone from 13 up (no 16+ questions, no children-only versions).

create function private.duel_allowed(p_user uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.age_band is null or p.age_band not in ('6-9', '10-12') from public.profiles p where p.id = p_user), false)
$$;

-- the name the opponent sees: none for private profiles and for players under 16
create function private.duel_name(p_user uuid) returns text language sql stable security definer set search_path = '' as $$
  select case when p.is_private or p.age_band in ('6-9', '10-12', '13-15') then null else p.display_name end from public.profiles p where p.id = p_user
$$;

create or replace function private.duel_pool(p_duel uuid) returns table (id text, category_id text) language sql stable security definer set search_path = '' as $$
  select q.id, q.category_id from public.questions q
  where q.status = 'published' and q.kind = 'question' and q.show_in_feed and q.hints is null
    and q.min_age <= 13 and q.max_age is null
    and jsonb_array_length(q.options) between 2 and 4
    and exists (select 1 from public.question_answers a where a.question_id = q.id)
    and not exists (select 1 from public.duel_rounds r where r.duel_id = p_duel and q.id = any (r.question_ids))
$$;

create or replace function public.duel_create(p_kind text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  d public.duels%rowtype;
  v_id uuid;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if p_kind not in ('invite', 'random') then raise exception 'invalid kind'; end if;
  if not private.duel_allowed(v_user) then raise exception 'duels are not available for this age' using errcode = '42501'; end if;
  perform private.duel_expire(v_user);
  if (select count(*) from public.duels where (player_a = v_user or player_b = v_user) and status in ('open', 'active')) >= 20 then
    raise exception 'too many open duels' using errcode = '54000';
  end if;
  if p_kind = 'random' then
    select * into d from public.duels x
    where x.kind = 'random' and x.status = 'open' and x.player_b is null and x.player_a <> v_user and x.created_at > now() - interval '3 days'
      and not private.duel_blocked(v_user, x.player_a)
      and not exists (select 1 from public.duels y where y.status in ('open', 'active') and ((y.player_a = v_user and y.player_b = x.player_a) or (y.player_a = x.player_a and y.player_b = v_user)))
    order by x.created_at limit 1 for update skip locked;
    if found then
      update public.duels set player_b = v_user, status = 'active', updated_at = now() where id = d.id;
      return jsonb_build_object('id', d.id, 'code', d.code, 'joined', true);
    end if;
    -- at most one waiting random duel per player
    select * into d from public.duels where player_a = v_user and kind = 'random' and status = 'open' and player_b is null limit 1;
    if found then return jsonb_build_object('id', d.id, 'code', d.code, 'joined', false); end if;
  end if;
  v_id := private.duel_new(p_kind, v_user, null);
  return jsonb_build_object('id', v_id, 'code', (select code from public.duels where id = v_id), 'joined', false);
end $$;

create or replace function public.duel_join(p_code text) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  d public.duels%rowtype;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if not private.duel_allowed(v_user) then raise exception 'duels are not available for this age' using errcode = '42501'; end if;
  select * into d from public.duels where code = upper(btrim(p_code)) for update;
  if not found then raise exception 'duel not found' using errcode = 'P0002'; end if;
  if d.player_a = v_user or d.player_b = v_user then return d.id; end if;
  if d.status <> 'open' or d.player_b is not null or d.updated_at < now() - interval '7 days' or private.duel_blocked(v_user, d.player_a) then
    raise exception 'duel closed' using errcode = '42501';
  end if;
  update public.duels set player_b = v_user, status = 'active', updated_at = now() where id = d.id;
  return d.id;
end $$;

create or replace function public.duel_rematch(p_duel uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  d public.duels%rowtype := private.duel_mine(p_duel);
  v_opp uuid := case when d.player_a = (select auth.uid()) then d.player_b else d.player_a end;
begin
  if not private.duel_allowed(v_user) then raise exception 'duels are not available for this age' using errcode = '42501'; end if;
  if v_opp is null or d.status not in ('finished', 'expired', 'declined') then raise exception 'no rematch possible' using errcode = '42501'; end if;
  if private.duel_blocked(v_user, v_opp) or not private.duel_allowed(v_opp) then raise exception 'duel closed' using errcode = '42501'; end if;
  if (select count(*) from public.duels where (player_a = v_user or player_b = v_user) and status in ('open', 'active')) >= 20 then
    raise exception 'too many open duels' using errcode = '54000';
  end if;
  return private.duel_new('invite', v_user, v_opp);
end $$;

create or replace function public.duel_state(p_duel uuid, p_locale text default 'de') returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  d public.duels%rowtype;
  v_role text;
  v_opp uuid;
  v_next jsonb;
  v_closed boolean;
  v_row public.duel_rounds%rowtype;
  v_rounds jsonb := '[]';
  v_mine jsonb;
  v_theirs jsonb;
  v_qs jsonb;
  v_mine_count int;
  v_my_turn_here boolean;
  v_seen_theirs int := 0;
  v_mine_total int;
  v_theirs_total int;
  v_result text;
  v_name text;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  perform private.duel_expire(v_user);
  select * into d from public.duels where id = p_duel;
  if not found or (d.player_a <> v_user and d.player_b is distinct from v_user) then raise exception 'duel not found' using errcode = 'P0002'; end if;
  v_role := case when d.player_a = v_user then 'a' else 'b' end;
  v_opp := case when v_role = 'a' then d.player_b else d.player_a end;
  v_next := private.duel_next(p_duel);
  v_closed := d.status in ('finished', 'expired', 'declined');
  for r in 1..3 loop
    v_row := null;
    select * into v_row from public.duel_rounds where duel_id = p_duel and round = r;
    select count(*) into v_mine_count from public.duel_answers where duel_id = p_duel and round = r and player = v_user;
    v_my_turn_here := not v_closed and v_next ->> 'role' = v_role and (v_next ->> 'round')::int = r;
    select coalesce(jsonb_agg(jsonb_build_object('idx', idx, 'selected', selected, 'correct', correct) order by idx), '[]') into v_mine
      from public.duel_answers where duel_id = p_duel and round = r and player = v_user;
    if v_mine_count = 3 or v_closed then
      select coalesce(jsonb_agg(jsonb_build_object('idx', idx, 'selected', selected, 'correct', correct) order by idx), '[]') into v_theirs
        from public.duel_answers where duel_id = p_duel and round = r and player = v_opp;
      v_seen_theirs := v_seen_theirs + (select count(*) from public.duel_answers where duel_id = p_duel and round = r and player = v_opp and correct);
    else
      v_theirs := null;
    end if;
    if v_row.question_ids is not null and (v_mine_count > 0 or v_closed or (v_my_turn_here and v_next ->> 'action' = 'answer')) then
      select jsonb_agg(jsonb_build_object('id', q.id, 'question', coalesce(q.translations -> p_locale ->> 'question', q.question),
          'options', coalesce(q.translations -> p_locale -> 'options', q.options)) order by u.n)
        into v_qs from unnest(v_row.question_ids) with ordinality as u (id, n) join public.questions q on q.id = u.id;
    else
      v_qs := null;
    end if;
    v_rounds := v_rounds || jsonb_build_object('round', r, 'category', v_row.category_id,
      'offered', case when v_my_turn_here and v_next ->> 'action' = 'pick' then to_jsonb(v_row.offered) end,
      'questions', v_qs, 'mine', v_mine, 'theirs', v_theirs,
      'theirsDone', v_opp is not null and (select count(*) from public.duel_answers where duel_id = p_duel and round = r and player = v_opp) = 3);
  end loop;
  select count(*) into v_mine_total from public.duel_answers where duel_id = p_duel and player = v_user and correct;
  select count(*) into v_theirs_total from public.duel_answers where duel_id = p_duel and player = v_opp and correct;
  if d.status = 'finished' then
    v_result := case when d.forfeit_by = v_user then 'loss' when d.forfeit_by = v_opp then 'win'
      when v_mine_total > v_theirs_total then 'win' when v_mine_total < v_theirs_total then 'loss' else 'draw' end;
  end if;
  v_name := private.duel_name(v_opp);
  return jsonb_build_object('id', d.id, 'code', d.code, 'kind', d.kind, 'status', d.status, 'role', v_role,
    'opponent', jsonb_build_object('name', v_name, 'joined', v_opp is not null),
    'next', v_next || jsonb_build_object('mine', not v_closed and v_next ->> 'role' = v_role and v_next ->> 'action' in ('pick', 'answer')),
    'rounds', v_rounds, 'score', jsonb_build_object('mine', v_mine_total, 'theirs', case when v_closed then v_theirs_total else v_seen_theirs end),
    'result', v_result, 'forfeit', case when d.forfeit_by is null then null when d.forfeit_by = v_user then 'me' else 'them' end,
    'updatedAt', d.updated_at);
end $$;

create or replace function public.my_duels() returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  perform private.duel_expire(v_user);
  return coalesce((
    select jsonb_agg(row order by updated desc) from (
      select d.updated_at as updated, jsonb_build_object(
        'id', d.id, 'code', d.code, 'kind', d.kind, 'status', d.status,
        'opponent', jsonb_build_object('name', private.duel_name(o.id), 'joined', o.id is not null),
        'next', private.duel_next(d.id) || jsonb_build_object('mine', d.status in ('open', 'active')
            and private.duel_next(d.id) ->> 'role' = case when d.player_a = v_user then 'a' else 'b' end
            and private.duel_next(d.id) ->> 'action' in ('pick', 'answer')),
        'score', jsonb_build_object(
          'mine', (select count(*) from public.duel_answers x where x.duel_id = d.id and x.player = v_user and x.correct),
          'theirs', (select count(*) from public.duel_answers x where x.duel_id = d.id and x.player = o.id and x.correct
            and (d.status in ('finished', 'expired', 'declined') or (select count(*) from public.duel_answers y where y.duel_id = d.id and y.player = v_user and y.round = x.round) = 3))),
        'result', case when d.status <> 'finished' then null when d.forfeit_by = v_user then 'loss' when d.forfeit_by = o.id then 'win'
          else (select case when m > t then 'win' when m < t then 'loss' else 'draw' end from (select
            (select count(*) from public.duel_answers x where x.duel_id = d.id and x.player = v_user and x.correct) as m,
            (select count(*) from public.duel_answers x where x.duel_id = d.id and x.player = o.id and x.correct) as t) s) end,
        'updatedAt', d.updated_at) as row
      from public.duels d
      left join lateral (select case when d.player_a = v_user then d.player_b else d.player_a end as id) o on true
      where d.player_a = v_user or d.player_b = v_user
      order by d.updated_at desc limit 50
    ) t), '[]'::jsonb);
end $$;

revoke execute on function private.duel_allowed(uuid), private.duel_name(uuid) from public, anon, authenticated;
