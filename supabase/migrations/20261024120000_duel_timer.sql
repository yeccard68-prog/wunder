-- Duels: the 20 seconds per question are now kept by the server. duel_question hands out one question at a
-- time and notes when it was first shown; an answer that arrives later than 20 s (+ 3 s for the connection)
-- counts as "time ran out" – reloading the page no longer gives a question its full time again. duel_state
-- no longer reveals the questions of a round still to be answered before they are opened.

create table public.duel_shown (
  duel_id  uuid not null references public.duels (id) on delete cascade,
  round    smallint not null check (round between 1 and 3),
  player   uuid not null references public.profiles (id) on delete cascade,
  idx      smallint not null check (idx between 0 and 2),
  shown_at timestamptz not null default now(),
  primary key (duel_id, round, player, idx)
);
alter table public.duel_shown enable row level security;

create function public.duel_question(p_duel uuid, p_round int, p_idx int, p_locale text default 'de') returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  d public.duels%rowtype := private.duel_mine(p_duel);
  v_role text := case when d.player_a = (select auth.uid()) then 'a' else 'b' end;
  v_next jsonb;
  v_qid text;
  v_shown timestamptz;
  q public.questions%rowtype;
begin
  if d.status not in ('open', 'active') then raise exception 'duel closed' using errcode = '42501'; end if;
  v_next := private.duel_next(p_duel);
  if v_next ->> 'action' <> 'answer' or v_next ->> 'role' <> v_role or (v_next ->> 'round')::int <> p_round then
    raise exception 'not your turn' using errcode = '42501';
  end if;
  if p_idx <> (select count(*) from public.duel_answers where duel_id = p_duel and round = p_round and player = v_user) then
    raise exception 'answer the questions in order' using errcode = '22023';
  end if;
  insert into public.duel_shown (duel_id, round, player, idx) values (p_duel, p_round, v_user, p_idx) on conflict do nothing;
  select shown_at into v_shown from public.duel_shown where duel_id = p_duel and round = p_round and player = v_user and idx = p_idx;
  select question_ids[p_idx + 1] into v_qid from public.duel_rounds where duel_id = p_duel and round = p_round;
  select * into q from public.questions where id = v_qid;
  return jsonb_build_object(
    'question', jsonb_build_object('id', q.id, 'question', coalesce(q.translations -> p_locale ->> 'question', q.question), 'options', coalesce(q.translations -> p_locale -> 'options', q.options)),
    'secondsLeft', greatest(0, 20 - extract(epoch from now() - v_shown)));
end $$;

-- the answer: as before, but too late (or never opened while the server counts) means "time ran out"
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
  end if;
  return jsonb_build_object('correct', v_correct, 'correctIndex', v_a.correct_index,
    'explanation', coalesce(v_a.translations -> p_locale ->> 'explanation', v_a.explanation), 'late', v_selected is null and p_selected is not null);
end $$;

revoke execute on function public.duel_question(uuid, int, int, text) from public, anon;
grant execute on function public.duel_question(uuid, int, int, text) to authenticated;

-- duel state: as before, but the questions of the round you are playing come one by one through duel_question
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
        into v_qs from unnest(v_row.question_ids) with ordinality as u (id, n) join public.questions q on q.id = u.id
        where not v_my_turn_here or u.n <= v_mine_count; -- the round still being played: only the questions already answered
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
