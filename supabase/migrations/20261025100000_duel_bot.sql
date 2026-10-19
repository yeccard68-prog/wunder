-- Duels against the computer, played on the server (the answer key never leaves it). Kind 'bot' with a level:
-- 1 easy (≈ 50 % right), 2 medium (≈ 67 %), 3 hard (≈ 80 %). The computer has no account: its answers are kept
-- in duel_bot_answers, and the duel functions read them where they would read player B's.

alter table public.duels drop constraint duels_kind_check;
alter table public.duels add constraint duels_kind_check check (kind in ('invite', 'random', 'bot'));
alter table public.duels add column bot_level smallint check (bot_level between 1 and 3);
alter table public.duels add constraint duels_bot_level check ((kind = 'bot') = (bot_level is not null));

create table public.duel_bot_answers (
  duel_id     uuid not null references public.duels (id) on delete cascade,
  round       smallint not null check (round between 1 and 3),
  idx         smallint not null check (idx between 0 and 2),
  selected    smallint not null,
  correct     boolean not null,
  answered_at timestamptz not null default now(),
  primary key (duel_id, round, idx)
);
alter table public.duel_bot_answers enable row level security;

-- how many answers player B (or the computer) has given in a round
create function private.duel_b_count(p_duel uuid, p_round int) returns int language sql stable security definer set search_path = '' as $$
  select case when d.kind = 'bot'
    then (select count(*)::int from public.duel_bot_answers x where x.duel_id = p_duel and x.round = p_round)
    else (select count(*)::int from public.duel_answers x where x.duel_id = p_duel and x.round = p_round and x.player = d.player_b) end
  from public.duels d where d.id = p_duel
$$;

create or replace function private.duel_next(p_duel uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  d public.duels%rowtype;
  steps constant text[] := array['1a pick', '1a answer', '1b answer', '2b pick', '2b answer', '2a answer', '3a pick', '3a answer', '3b answer'];
  s text;
  r int;
  who text;
  act text;
  v_player uuid;
  v_present boolean;
  v_done boolean;
begin
  select * into d from public.duels where id = p_duel;
  foreach s in array steps loop
    r := substr(s, 1, 1)::int;
    who := substr(s, 2, 1);
    act := split_part(s, ' ', 2);
    v_player := case who when 'a' then d.player_a else d.player_b end;
    v_present := v_player is not null or (who = 'b' and d.kind = 'bot');
    if act = 'pick' then
      v_done := exists (select 1 from public.duel_rounds x where x.duel_id = p_duel and x.round = r and x.category_id is not null);
    elsif who = 'b' then
      v_done := v_present and private.duel_b_count(p_duel, r) = 3;
    else
      v_done := (select count(*) from public.duel_answers x where x.duel_id = p_duel and x.round = r and x.player = v_player) = 3;
    end if;
    if not v_done then
      return jsonb_build_object('round', r, 'role', who, 'action', case when not v_present then 'join' else act end);
    end if;
  end loop;
  return jsonb_build_object('round', null, 'role', null, 'action', 'done');
end $$;

-- the computer makes all its moves until it is the player's turn again
create function private.duel_bot_play(p_duel uuid) returns void language plpgsql security definer set search_path = '' as $$
declare
  d public.duels%rowtype;
  v_next jsonb;
  v_round int;
  v_cat text;
  v_ids text[];
  v_qid text;
  v_n int;
  v_right int;
  v_sel int;
  v_hit numeric;
begin
  select * into d from public.duels where id = p_duel;
  if d.kind <> 'bot' or d.status not in ('open', 'active') then return; end if;
  v_hit := case d.bot_level when 1 then 0.5 when 2 then 0.67 else 0.8 end;
  for guard in 1..12 loop
    v_next := private.duel_next(p_duel);
    exit when v_next ->> 'role' is distinct from 'b';
    v_round := (v_next ->> 'round')::int;
    if v_next ->> 'action' = 'pick' then
      perform private.duel_offer(p_duel, v_round);
      select offered[1 + floor(random() * cardinality(offered))::int] into v_cat from public.duel_rounds where duel_id = p_duel and round = v_round;
      select array_agg(x.id) into v_ids from (select p.id from private.duel_pool(p_duel) p where p.category_id = v_cat order by random() limit 3) x;
      update public.duel_rounds set category_id = v_cat, question_ids = v_ids where duel_id = p_duel and round = v_round;
    else
      for i in private.duel_b_count(p_duel, v_round)..2 loop
        select question_ids[i + 1] into v_qid from public.duel_rounds where duel_id = p_duel and round = v_round;
        select jsonb_array_length(q.options), a.correct_index into v_n, v_right from public.questions q join public.question_answers a on a.question_id = q.id where q.id = v_qid;
        if random() < v_hit then v_sel := v_right;
        else v_sel := (v_right + 1 + floor(random() * (v_n - 1))::int) % v_n; -- one of the wrong options
        end if;
        insert into public.duel_bot_answers (duel_id, round, idx, selected, correct) values (p_duel, v_round, i, v_sel, v_sel = v_right);
      end loop;
    end if;
  end loop;
  v_next := private.duel_next(p_duel);
  if v_next ->> 'action' = 'done' then
    update public.duels set status = 'finished', finished_at = now(), updated_at = now() where id = p_duel;
  else
    if v_next ->> 'action' = 'pick' then perform private.duel_offer(p_duel, (v_next ->> 'round')::int); end if;
    update public.duels set updated_at = now() where id = p_duel;
  end if;
end $$;

-- a new duel against the computer; the player starts with round 1
create function public.duel_create_bot(p_level int) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_id uuid;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if p_level not between 1 and 3 then raise exception 'invalid level'; end if;
  if (select count(*) from public.duels where (player_a = v_user or player_b = v_user) and status in ('open', 'active')) >= 20 then
    raise exception 'too many open duels' using errcode = '54000';
  end if;
  loop
    begin
      insert into public.duels (code, kind, bot_level, player_a, status) values (private.duel_code(), 'bot', p_level, v_user, 'active') returning id into v_id;
      exit;
    exception when unique_violation then null;
    end;
  end loop;
  perform private.duel_offer(v_id, 1);
  return jsonb_build_object('id', v_id, 'code', (select code from public.duels where id = v_id), 'joined', true);
end $$;

-- picking and answering: as before, then the computer takes its turn
create or replace function public.duel_pick(p_duel uuid, p_category text) returns void language plpgsql security definer set search_path = '' as $$
declare
  d public.duels%rowtype := private.duel_mine(p_duel);
  v_role text := case when d.player_a = (select auth.uid()) then 'a' else 'b' end;
  v_next jsonb;
  v_round int;
  v_ids text[];
begin
  if d.status not in ('open', 'active') then raise exception 'duel closed' using errcode = '42501'; end if;
  v_next := private.duel_next(p_duel);
  if v_next ->> 'action' <> 'pick' or v_next ->> 'role' <> v_role then raise exception 'not your turn' using errcode = '42501'; end if;
  v_round := (v_next ->> 'round')::int;
  perform private.duel_offer(p_duel, v_round);
  if not exists (select 1 from public.duel_rounds where duel_id = p_duel and round = v_round and p_category = any (offered)) then
    raise exception 'topic not offered' using errcode = '22023';
  end if;
  select array_agg(x.id) into v_ids from (select p.id from private.duel_pool(p_duel) p where p.category_id = p_category order by random() limit 3) x;
  if coalesce(cardinality(v_ids), 0) < 3 then raise exception 'not enough questions' using errcode = 'P0002'; end if;
  update public.duel_rounds set category_id = p_category, question_ids = v_ids where duel_id = p_duel and round = v_round;
  update public.duels set updated_at = now() where id = p_duel;
end $$;

create or replace function public.duel_answer(p_duel uuid, p_round int, p_idx int, p_selected int, p_locale text default 'de') returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  d public.duels%rowtype := private.duel_mine(p_duel);
  v_role text := case when d.player_a = (select auth.uid()) then 'a' else 'b' end;
  v_next jsonb;
  v_after jsonb;
  v_qid text;
  v_options jsonb;
  v_a public.question_answers%rowtype;
  v_correct boolean;
  v_shown timestamptz;
  v_selected int := p_selected;
begin
  if d.status not in ('open', 'active') then raise exception 'duel closed' using errcode = '42501'; end if;
  v_next := private.duel_next(p_duel);
  if v_next ->> 'action' <> 'answer' or v_next ->> 'role' <> v_role or (v_next ->> 'round')::int <> p_round then
    raise exception 'not your turn' using errcode = '42501';
  end if;
  if p_idx <> (select count(*) from public.duel_answers where duel_id = p_duel and round = p_round and player = v_user) then
    raise exception 'answer the questions in order' using errcode = '22023';
  end if;
  select shown_at into v_shown from public.duel_shown where duel_id = p_duel and round = p_round and player = v_user and idx = p_idx;
  if v_shown is not null and now() - v_shown > interval '23 seconds' then v_selected := null; end if;
  select question_ids[p_idx + 1] into v_qid from public.duel_rounds where duel_id = p_duel and round = p_round;
  select options into v_options from public.questions where id = v_qid;
  select * into v_a from public.question_answers where question_id = v_qid;
  if v_selected is not null and (v_selected < 0 or v_selected >= jsonb_array_length(v_options)) then raise exception 'invalid option'; end if;
  v_correct := v_selected is not null and v_selected = v_a.correct_index;
  insert into public.duel_answers (duel_id, round, player, idx, selected, correct) values (p_duel, p_round, v_user, p_idx, v_selected, v_correct);
  v_after := private.duel_next(p_duel);
  if v_after ->> 'action' = 'done' then
    update public.duels set status = 'finished', finished_at = now(), updated_at = now() where id = p_duel;
  else
    if v_after ->> 'action' = 'pick' then perform private.duel_offer(p_duel, (v_after ->> 'round')::int); end if;
    update public.duels set updated_at = now() where id = p_duel;
    if d.kind = 'bot' then perform private.duel_bot_play(p_duel); end if; -- the computer's turn
  end if;
  return jsonb_build_object('correct', v_correct, 'correctIndex', v_a.correct_index,
    'explanation', coalesce(v_a.translations -> p_locale ->> 'explanation', v_a.explanation), 'late', v_selected is null and p_selected is not null);
end $$;

create or replace function public.duel_resign(p_duel uuid) returns void language plpgsql security definer set search_path = '' as $$
declare d public.duels%rowtype := private.duel_mine(p_duel);
begin
  if d.status not in ('open', 'active') then raise exception 'duel closed' using errcode = '42501'; end if;
  if d.player_b is null and d.kind <> 'bot' then
    delete from public.duels where id = p_duel;  -- nobody to lose against: just remove it
  else
    update public.duels set status = 'finished', forfeit_by = (select auth.uid()), finished_at = now(), updated_at = now() where id = p_duel;
  end if;
end $$;

-- a rematch against the computer starts a new computer duel on the same level
create or replace function public.duel_rematch(p_duel uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  d public.duels%rowtype := private.duel_mine(p_duel);
  v_opp uuid := case when d.player_a = (select auth.uid()) then d.player_b else d.player_a end;
begin
  if d.status not in ('finished', 'expired', 'declined') then raise exception 'no rematch possible' using errcode = '42501'; end if;
  if d.kind = 'bot' then return (public.duel_create_bot(d.bot_level) ->> 'id')::uuid; end if;
  if not private.duel_allowed(v_user) then raise exception 'duels are not available for this age' using errcode = '42501'; end if;
  if v_opp is null then raise exception 'no rematch possible' using errcode = '42501'; end if;
  if private.duel_blocked(v_user, v_opp) or not private.duel_allowed(v_opp) then raise exception 'duel closed' using errcode = '42501'; end if;
  if (select count(*) from public.duels where (player_a = v_user or player_b = v_user) and status in ('open', 'active')) >= 20 then
    raise exception 'too many open duels' using errcode = '54000';
  end if;
  return private.duel_new('invite', v_user, v_opp);
end $$;

revoke execute on function private.duel_b_count(uuid, int), private.duel_bot_play(uuid) from public, anon, authenticated;
revoke execute on function public.duel_create_bot(int) from public, anon;
grant execute on function public.duel_create_bot(int) to authenticated;

-- the answers of the other side of a round (player B or the computer) as JSON, and how many were right
create function private.duel_other(p_duel uuid, p_round int, p_other uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select case when d.kind = 'bot' then
      (select coalesce(jsonb_agg(jsonb_build_object('idx', idx, 'selected', selected, 'correct', correct) order by idx), '[]') from public.duel_bot_answers x where x.duel_id = p_duel and x.round = p_round)
    else
      (select coalesce(jsonb_agg(jsonb_build_object('idx', idx, 'selected', selected, 'correct', correct) order by idx), '[]') from public.duel_answers x where x.duel_id = p_duel and x.round = p_round and x.player = p_other) end
  from public.duels d where d.id = p_duel
$$;
create function private.duel_other_right(p_duel uuid, p_round int, p_other uuid) returns int language sql stable security definer set search_path = '' as $$
  select case when d.kind = 'bot' then
      (select count(*)::int from public.duel_bot_answers x where x.duel_id = p_duel and (p_round is null or x.round = p_round) and x.correct)
    else
      (select count(*)::int from public.duel_answers x where x.duel_id = p_duel and (p_round is null or x.round = p_round) and x.player = p_other and x.correct) end
  from public.duels d where d.id = p_duel
$$;

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
      v_theirs := private.duel_other(p_duel, r, v_opp);
      v_seen_theirs := v_seen_theirs + private.duel_other_right(p_duel, r, v_opp);
    else
      v_theirs := null;
    end if;
    if v_row.question_ids is not null and (v_mine_count > 0 or v_closed or (v_my_turn_here and v_next ->> 'action' = 'answer')) then
      select jsonb_agg(jsonb_build_object('id', q.id, 'question', coalesce(q.translations -> p_locale ->> 'question', q.question),
          'options', coalesce(q.translations -> p_locale -> 'options', q.options)) order by u.n)
        into v_qs from unnest(v_row.question_ids) with ordinality as u (id, n) join public.questions q on q.id = u.id
        where not v_my_turn_here or u.n <= v_mine_count;
    else
      v_qs := null;
    end if;
    v_rounds := v_rounds || jsonb_build_object('round', r, 'category', v_row.category_id,
      'offered', case when v_my_turn_here and v_next ->> 'action' = 'pick' then to_jsonb(v_row.offered) end,
      'questions', v_qs, 'mine', v_mine, 'theirs', v_theirs,
      'theirsDone', jsonb_array_length(private.duel_other(p_duel, r, v_opp)) = 3);
  end loop;
  select count(*) into v_mine_total from public.duel_answers where duel_id = p_duel and player = v_user and correct;
  v_theirs_total := private.duel_other_right(p_duel, null, v_opp);
  if d.status = 'finished' then
    v_result := case when d.forfeit_by = v_user then 'loss' when d.forfeit_by is not null then 'win'
      when v_mine_total > v_theirs_total then 'win' when v_mine_total < v_theirs_total then 'loss' else 'draw' end;
  end if;
  return jsonb_build_object('id', d.id, 'code', d.code, 'kind', d.kind, 'level', d.bot_level, 'status', d.status, 'role', v_role,
    'opponent', jsonb_build_object('name', case when d.kind = 'bot' then null else private.duel_name(v_opp) end, 'joined', v_opp is not null or d.kind = 'bot'),
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
        'id', d.id, 'code', d.code, 'kind', d.kind, 'level', d.bot_level, 'status', d.status,
        'opponent', jsonb_build_object('name', case when d.kind = 'bot' then null else private.duel_name(o.id) end, 'joined', o.id is not null or d.kind = 'bot'),
        'next', private.duel_next(d.id) || jsonb_build_object('mine', d.status in ('open', 'active')
            and private.duel_next(d.id) ->> 'role' = case when d.player_a = v_user then 'a' else 'b' end
            and private.duel_next(d.id) ->> 'action' in ('pick', 'answer')),
        'score', jsonb_build_object(
          'mine', (select count(*) from public.duel_answers x where x.duel_id = d.id and x.player = v_user and x.correct),
          'theirs', case when d.status in ('finished', 'expired', 'declined') then private.duel_other_right(d.id, null, o.id)
            else (select coalesce(sum(private.duel_other_right(d.id, r.round, o.id)), 0) from public.duel_rounds r
                  where r.duel_id = d.id and (select count(*) from public.duel_answers y where y.duel_id = d.id and y.player = v_user and y.round = r.round) = 3) end),
        'result', case when d.status <> 'finished' then null when d.forfeit_by = v_user then 'loss' when d.forfeit_by is not null then 'win'
          else (select case when m > t then 'win' when m < t then 'loss' else 'draw' end from (select
            (select count(*) from public.duel_answers x where x.duel_id = d.id and x.player = v_user and x.correct) as m,
            private.duel_other_right(d.id, null, o.id) as t) s) end,
        'updatedAt', d.updated_at) as row
      from public.duels d
      left join lateral (select case when d.player_a = v_user then d.player_b else d.player_a end as id) o on true
      where d.player_a = v_user or d.player_b = v_user
      order by d.updated_at desc limit 50
    ) t), '[]'::jsonb);
end $$;

revoke execute on function private.duel_other(uuid, int, uuid), private.duel_other_right(uuid, int, uuid) from public, anon, authenticated;
