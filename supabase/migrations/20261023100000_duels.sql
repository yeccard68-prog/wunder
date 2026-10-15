-- Duels: two players answer the same questions in three rounds of three and take turns, like Quizduell.
--   Round 1: A picks one of three topics and answers, then B answers.
--   Round 2: B picks and answers, then A answers.
--   Round 3: A picks and answers, then B answers – done.
-- The tables are not readable by clients (RLS on, no policies). Everything goes through the security-definer
-- functions below: they check whose turn it is, keep the answer key on the server and show the other
-- player's answers of a round only once you have played it yourself.
-- A player who does not move for 7 days loses; a random duel nobody joins expires after 3 days.

create table public.duels (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  kind        text not null check (kind in ('invite', 'random')),
  player_a    uuid not null references public.profiles (id) on delete cascade,
  player_b    uuid references public.profiles (id) on delete cascade,
  status      text not null default 'open' check (status in ('open', 'active', 'finished', 'expired', 'declined')),
  forfeit_by  uuid references public.profiles (id) on delete set null,   -- gave up or let the time run out
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  finished_at timestamptz,
  check (player_b is null or player_b <> player_a)
);
create index duels_player_a on public.duels (player_a);
create index duels_player_b on public.duels (player_b);
create index duels_waiting on public.duels (created_at) where kind = 'random' and status = 'open' and player_b is null;

create table public.duel_rounds (
  duel_id      uuid not null references public.duels (id) on delete cascade,
  round        smallint not null check (round between 1 and 3),
  offered      text[] not null check (cardinality(offered) between 1 and 3),
  category_id  text references public.categories (id),
  question_ids text[] check (question_ids is null or cardinality(question_ids) = 3),
  primary key (duel_id, round)
);

create table public.duel_answers (
  duel_id     uuid not null references public.duels (id) on delete cascade,
  round       smallint not null check (round between 1 and 3),
  player      uuid not null references public.profiles (id) on delete cascade,
  idx         smallint not null check (idx between 0 and 2),
  selected    smallint,                 -- null: the time ran out
  correct     boolean not null,
  answered_at timestamptz not null default now(),
  primary key (duel_id, round, player, idx)
);

-- not matched again in random duels, and invites from them are refused
create table public.duel_blocks (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  blocked    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked)
);

create table public.duel_reports (
  id         bigint generated always as identity primary key,
  duel_id    uuid references public.duels (id) on delete set null,
  reporter   uuid references public.profiles (id) on delete set null,
  reported   uuid references public.profiles (id) on delete set null,
  reason     text not null check (reason in ('name', 'cheating', 'other')),
  created_at timestamptz not null default now()
);

alter table public.duels enable row level security;
alter table public.duel_rounds enable row level security;
alter table public.duel_answers enable row level security;
alter table public.duel_blocks enable row level security;
alter table public.duel_reports enable row level security;

-- ---------- helpers (private schema: not callable by clients) ----------

-- questions that can appear: published multiple choice from the feed, no riddles, not yet used in this duel
create function private.duel_pool(p_duel uuid) returns table (id text, category_id text) language sql stable security definer set search_path = '' as $$
  select q.id, q.category_id from public.questions q
  where q.status = 'published' and q.kind = 'question' and q.show_in_feed and q.hints is null
    and jsonb_array_length(q.options) between 2 and 4
    and exists (select 1 from public.question_answers a where a.question_id = q.id)
    and not exists (select 1 from public.duel_rounds r where r.duel_id = p_duel and q.id = any (r.question_ids))
$$;

-- three topics to choose from for a round (once; offering again would allow rerolling)
create function private.duel_offer(p_duel uuid, p_round int) returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.duel_rounds where duel_id = p_duel and round = p_round) then return; end if;
  insert into public.duel_rounds (duel_id, round, offered)
  select p_duel, p_round, array_agg(c.category_id) from (
    select p.category_id from private.duel_pool(p_duel) p join public.categories k on k.id = p.category_id and k.is_active
    group by p.category_id having count(*) >= 3 order by random() limit 3
  ) c;
end $$;

-- whose move is next: {round, role: 'a'|'b', action: 'pick'|'answer'|'join'|'done'}
create function private.duel_next(p_duel uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  d public.duels%rowtype;
  steps constant text[] := array['1a pick', '1a answer', '1b answer', '2b pick', '2b answer', '2a answer', '3a pick', '3a answer', '3b answer'];
  s text;
  r int;
  who text;
  act text;
  v_player uuid;
  v_done boolean;
begin
  select * into d from public.duels where id = p_duel;
  foreach s in array steps loop
    r := substr(s, 1, 1)::int;
    who := substr(s, 2, 1);
    act := split_part(s, ' ', 2);
    v_player := case who when 'a' then d.player_a else d.player_b end;
    if act = 'pick' then
      v_done := exists (select 1 from public.duel_rounds x where x.duel_id = p_duel and x.round = r and x.category_id is not null);
    else
      v_done := v_player is not null and (select count(*) from public.duel_answers x where x.duel_id = p_duel and x.round = r and x.player = v_player) = 3;
    end if;
    if not v_done then
      return jsonb_build_object('round', r, 'role', who, 'action', case when v_player is null then 'join' else act end);
    end if;
  end loop;
  return jsonb_build_object('round', null, 'role', null, 'action', 'done');
end $$;

-- stale duels: nobody joined a random duel within 3 days → expired; nobody moved for 7 days → the player to move loses
create function private.duel_expire(p_user uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.duels d set status = 'expired', finished_at = now(), updated_at = now()
  where d.status = 'open' and d.player_b is null and (d.player_a = p_user or p_user is null)
    and ((d.kind = 'random' and d.created_at < now() - interval '3 days') or d.updated_at < now() - interval '7 days');
  update public.duels d set status = 'finished', finished_at = now(), updated_at = now(),
    forfeit_by = case when private.duel_next(d.id) ->> 'role' = 'a' then d.player_a else d.player_b end
  where d.status in ('open', 'active') and d.player_b is not null and (d.player_a = p_user or d.player_b = p_user or p_user is null)
    and d.updated_at < now() - interval '7 days';
end $$;

create function private.duel_code() returns text language plpgsql volatile set search_path = '' as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v text := '';
begin
  for i in 1..6 loop v := v || substr(chars, 1 + floor(random() * length(chars))::int, 1); end loop;
  return v;
end $$;

create function private.duel_new(p_kind text, p_a uuid, p_b uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  loop
    begin
      insert into public.duels (code, kind, player_a, player_b, status) values (private.duel_code(), p_kind, p_a, p_b, case when p_b is null then 'open' else 'active' end) returning id into v_id;
      exit;
    exception when unique_violation then null;  -- code already taken: draw another
    end;
  end loop;
  perform private.duel_offer(v_id, 1);
  return v_id;
end $$;

create function private.duel_blocked(p_x uuid, p_y uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.duel_blocks b where (b.user_id = p_x and b.blocked = p_y) or (b.user_id = p_y and b.blocked = p_x))
$$;

-- the duel row for the signed-in player, locked; raises if it is not theirs
create function private.duel_mine(p_duel uuid) returns public.duels language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  d public.duels%rowtype;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select * into d from public.duels where id = p_duel for update;
  if not found or (d.player_a <> v_user and d.player_b is distinct from v_user) then raise exception 'duel not found' using errcode = 'P0002'; end if;
  return d;
end $$;

-- ---------- functions for the app ----------

-- new duel. 'invite': a code to share. 'random': joins someone who is waiting, otherwise waits itself –
-- either way the first round can be played straight away.
create function public.duel_create(p_kind text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  d public.duels%rowtype;
  v_id uuid;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if p_kind not in ('invite', 'random') then raise exception 'invalid kind'; end if;
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

-- join an invitation by its code
create function public.duel_join(p_code text) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  d public.duels%rowtype;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select * into d from public.duels where code = upper(btrim(p_code)) for update;
  if not found then raise exception 'duel not found' using errcode = 'P0002'; end if;
  if d.player_a = v_user or d.player_b = v_user then return d.id; end if;
  if d.status <> 'open' or d.player_b is not null or d.updated_at < now() - interval '7 days' or private.duel_blocked(v_user, d.player_a) then
    raise exception 'duel closed' using errcode = '42501';
  end if;
  update public.duels set player_b = v_user, status = 'active', updated_at = now() where id = d.id;
  return d.id;
end $$;

-- the topic for the current round; draws three questions from it
create function public.duel_pick(p_duel uuid, p_category text) returns void language plpgsql security definer set search_path = '' as $$
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

-- one answer (in order; null = time ran out). Returns whether it was right, the right option and the explanation.
create function public.duel_answer(p_duel uuid, p_round int, p_idx int, p_selected int, p_locale text default 'de') returns jsonb language plpgsql security definer set search_path = '' as $$
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
begin
  if d.status not in ('open', 'active') then raise exception 'duel closed' using errcode = '42501'; end if;
  v_next := private.duel_next(p_duel);
  if v_next ->> 'action' <> 'answer' or v_next ->> 'role' <> v_role or (v_next ->> 'round')::int <> p_round then
    raise exception 'not your turn' using errcode = '42501';
  end if;
  if p_idx <> (select count(*) from public.duel_answers where duel_id = p_duel and round = p_round and player = v_user) then
    raise exception 'answer the questions in order' using errcode = '22023';
  end if;
  select question_ids[p_idx + 1] into v_qid from public.duel_rounds where duel_id = p_duel and round = p_round;
  select options into v_options from public.questions where id = v_qid;
  select * into v_a from public.question_answers where question_id = v_qid;
  if p_selected is not null and (p_selected < 0 or p_selected >= jsonb_array_length(v_options)) then raise exception 'invalid option'; end if;
  v_correct := p_selected is not null and p_selected = v_a.correct_index;
  insert into public.duel_answers (duel_id, round, player, idx, selected, correct) values (p_duel, p_round, v_user, p_idx, p_selected, v_correct);
  v_after := private.duel_next(p_duel);
  if v_after ->> 'action' = 'done' then
    update public.duels set status = 'finished', finished_at = now(), updated_at = now() where id = p_duel;
  else
    if v_after ->> 'action' = 'pick' then perform private.duel_offer(p_duel, (v_after ->> 'round')::int); end if;
    update public.duels set updated_at = now() where id = p_duel;
  end if;
  return jsonb_build_object('correct', v_correct, 'correctIndex', v_a.correct_index,
    'explanation', coalesce(v_a.translations -> p_locale ->> 'explanation', v_a.explanation));
end $$;

-- everything the signed-in player may see of a duel
create function public.duel_state(p_duel uuid, p_locale text default 'de') returns jsonb language plpgsql security definer set search_path = '' as $$
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
  select case when p.is_private then null else p.display_name end into v_name from public.profiles p where p.id = v_opp;
  return jsonb_build_object('id', d.id, 'code', d.code, 'kind', d.kind, 'status', d.status, 'role', v_role,
    'opponent', jsonb_build_object('name', v_name, 'joined', v_opp is not null),
    'next', v_next || jsonb_build_object('mine', not v_closed and v_next ->> 'role' = v_role and v_next ->> 'action' in ('pick', 'answer')),
    'rounds', v_rounds, 'score', jsonb_build_object('mine', v_mine_total, 'theirs', case when v_closed then v_theirs_total else v_seen_theirs end),
    'result', v_result, 'forfeit', case when d.forfeit_by is null then null when d.forfeit_by = v_user then 'me' else 'them' end,
    'updatedAt', d.updated_at);
end $$;

-- the signed-in player's duels, newest first
create function public.my_duels() returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  perform private.duel_expire(v_user);
  return coalesce((
    select jsonb_agg(row order by updated desc) from (
      select d.updated_at as updated, jsonb_build_object(
        'id', d.id, 'code', d.code, 'kind', d.kind, 'status', d.status,
        'opponent', jsonb_build_object('name', case when p.is_private then null else p.display_name end, 'joined', o.id is not null),
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
      left join public.profiles p on p.id = o.id
      where d.player_a = v_user or d.player_b = v_user
      order by d.updated_at desc limit 50
    ) t), '[]'::jsonb);
end $$;

-- a new duel against the same opponent (they can decline it)
create function public.duel_rematch(p_duel uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  d public.duels%rowtype := private.duel_mine(p_duel);
  v_opp uuid := case when d.player_a = (select auth.uid()) then d.player_b else d.player_a end;
begin
  if v_opp is null or d.status not in ('finished', 'expired', 'declined') then raise exception 'no rematch possible' using errcode = '42501'; end if;
  if private.duel_blocked(v_user, v_opp) then raise exception 'duel closed' using errcode = '42501'; end if;
  if (select count(*) from public.duels where (player_a = v_user or player_b = v_user) and status in ('open', 'active')) >= 20 then
    raise exception 'too many open duels' using errcode = '54000';
  end if;
  return private.duel_new('invite', v_user, v_opp);
end $$;

-- the invited player can decline before answering anything
create function public.duel_decline(p_duel uuid) returns void language plpgsql security definer set search_path = '' as $$
declare d public.duels%rowtype := private.duel_mine(p_duel);
begin
  if d.player_b is distinct from (select auth.uid()) or d.status <> 'active'
     or exists (select 1 from public.duel_answers where duel_id = p_duel and player = d.player_b) then
    raise exception 'cannot decline' using errcode = '42501';
  end if;
  update public.duels set status = 'declined', finished_at = now(), updated_at = now() where id = p_duel;
end $$;

-- give up: counts as a loss
create function public.duel_resign(p_duel uuid) returns void language plpgsql security definer set search_path = '' as $$
declare d public.duels%rowtype := private.duel_mine(p_duel);
begin
  if d.status not in ('open', 'active') then raise exception 'duel closed' using errcode = '42501'; end if;
  if d.player_b is null then
    delete from public.duels where id = p_duel;  -- nobody to lose against: just remove it
  else
    update public.duels set status = 'finished', forfeit_by = (select auth.uid()), finished_at = now(), updated_at = now() where id = p_duel;
  end if;
end $$;

-- report the opponent (e.g. an offensive name); they are not matched with you again
create function public.duel_report(p_duel uuid, p_reason text) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  d public.duels%rowtype := private.duel_mine(p_duel);
  v_opp uuid := case when d.player_a = (select auth.uid()) then d.player_b else d.player_a end;
begin
  if v_opp is null then raise exception 'nobody to report' using errcode = '42501'; end if;
  if p_reason not in ('name', 'cheating', 'other') then raise exception 'invalid reason'; end if;
  insert into public.duel_reports (duel_id, reporter, reported, reason) values (p_duel, v_user, v_opp, p_reason);
  insert into public.duel_blocks (user_id, blocked) values (v_user, v_opp) on conflict do nothing;
end $$;

-- editors: reported players, most reports first
create function public.admin_duel_reports() returns table (reported uuid, display_name text, reports bigint, reasons text[], last_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select r.reported, p.display_name, count(*), array_agg(distinct r.reason), max(r.created_at)
    from public.duel_reports r left join public.profiles p on p.id = r.reported
    where r.reported is not null group by r.reported, p.display_name order by count(*) desc, max(r.created_at) desc;
end $$;

revoke execute on all functions in schema private from public, anon, authenticated;
revoke execute on function public.duel_create(text), public.duel_join(text), public.duel_pick(uuid, text), public.duel_answer(uuid, int, int, int, text),
  public.duel_state(uuid, text), public.my_duels(), public.duel_rematch(uuid), public.duel_decline(uuid), public.duel_resign(uuid),
  public.duel_report(uuid, text), public.admin_duel_reports() from public, anon;
grant execute on function public.duel_create(text), public.duel_join(text), public.duel_pick(uuid, text), public.duel_answer(uuid, int, int, int, text),
  public.duel_state(uuid, text), public.my_duels(), public.duel_rematch(uuid), public.duel_decline(uuid), public.duel_resign(uuid),
  public.duel_report(uuid, text), public.admin_duel_reports() to authenticated;
