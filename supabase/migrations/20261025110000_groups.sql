-- Groups: create one, invite with a code, see the members. In a group, anyone can start a group round:
-- everyone plays the same six questions (one topic, 20 seconds each, kept by the server) within three days,
-- and a ranking shows who knew most. Results of a round are visible to a member once they have played it
-- (or once the round has closed). Tables are not readable by clients; everything goes through functions.

create table public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 1 and 40),
  code       text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  owner      uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user on public.group_members (user_id);
create table public.group_rounds (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups (id) on delete cascade,
  created_by   uuid references public.profiles (id) on delete set null,
  category_id  text not null references public.categories (id),
  question_ids text[] not null check (cardinality(question_ids) = 6),
  created_at   timestamptz not null default now(),
  closes_at    timestamptz not null default now() + interval '3 days'
);
create index group_rounds_group on public.group_rounds (group_id, created_at desc);
create table public.group_answers (
  round_id    uuid not null references public.group_rounds (id) on delete cascade,
  player      uuid not null references public.profiles (id) on delete cascade,
  idx         smallint not null check (idx between 0 and 5),
  selected    smallint,
  correct     boolean not null,
  answered_at timestamptz not null default now(),
  primary key (round_id, player, idx)
);
create table public.group_shown (
  round_id uuid not null references public.group_rounds (id) on delete cascade,
  player   uuid not null references public.profiles (id) on delete cascade,
  idx      smallint not null check (idx between 0 and 5),
  shown_at timestamptz not null default now(),
  primary key (round_id, player, idx)
);
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_rounds enable row level security;
alter table public.group_answers enable row level security;
alter table public.group_shown enable row level security;

create function private.group_member(p_group uuid, p_user uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_members m where m.group_id = p_group and m.user_id = p_user)
$$;

-- the group of a round, checked for membership of the signed-in player
create function private.group_round_mine(p_round uuid) returns public.group_rounds language plpgsql security definer set search_path = '' as $$
declare r public.group_rounds%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select * into r from public.group_rounds where id = p_round;
  if not found or not private.group_member(r.group_id, (select auth.uid())) then raise exception 'round not found' using errcode = 'P0002'; end if;
  return r;
end $$;

create function public.group_create(p_name text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_id uuid;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
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

create function public.group_join(p_code text) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  g public.groups%rowtype;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
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

-- leaving: the oldest remaining member takes over; an empty group is removed
create function public.group_leave(p_group uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  delete from public.group_members where group_id = p_group and user_id = v_user;
  if not exists (select 1 from public.group_members where group_id = p_group) then
    delete from public.groups where id = p_group;
  elsif (select owner from public.groups where id = p_group) is not distinct from v_user then
    update public.groups set owner = (select user_id from public.group_members where group_id = p_group order by joined_at limit 1) where id = p_group;
  end if;
end $$;

-- the owner can remove a member (e.g. someone who misbehaves in the chat)
create function public.group_remove_member(p_group uuid, p_user uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select owner from public.groups where id = p_group) is distinct from (select auth.uid()) then raise exception 'only the owner can remove members' using errcode = '42501'; end if;
  if p_user = (select auth.uid()) then raise exception 'use group_leave' using errcode = '22023'; end if;
  delete from public.group_members where group_id = p_group and user_id = p_user;
end $$;

-- a new round with six questions from one topic (chosen or random); one open round per group at a time
create function public.group_round_start(p_group uuid, p_category text default null) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_cat text := p_category;
  v_ids text[];
  v_id uuid;
begin
  if not private.group_member(p_group, v_user) then raise exception 'group not found' using errcode = 'P0002'; end if;
  if exists (select 1 from public.group_rounds where group_id = p_group and closes_at > now()) then raise exception 'a round is already running' using errcode = '42501'; end if;
  if v_cat is null then
    select q.category_id into v_cat from private.duel_pool(null) q join public.categories k on k.id = q.category_id and k.is_active
      group by q.category_id having count(*) >= 6 order by random() limit 1;
  end if;
  select array_agg(x.id) into v_ids from (select p.id from private.duel_pool(null) p where p.category_id = v_cat order by random() limit 6) x;
  if coalesce(cardinality(v_ids), 0) < 6 then raise exception 'not enough questions' using errcode = 'P0002'; end if;
  insert into public.group_rounds (group_id, created_by, category_id, question_ids) values (p_group, v_user, v_cat, v_ids) returning id into v_id;
  update public.groups set updated_at = now() where id = p_group;
  return v_id;
end $$;

create function public.group_round_question(p_round uuid, p_idx int, p_locale text default 'de') returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  r public.group_rounds%rowtype := private.group_round_mine(p_round);
  v_shown timestamptz;
  q public.questions%rowtype;
begin
  if r.closes_at <= now() then raise exception 'round closed' using errcode = '42501'; end if;
  if p_idx <> (select count(*) from public.group_answers where round_id = p_round and player = v_user) then
    raise exception 'answer the questions in order' using errcode = '22023';
  end if;
  insert into public.group_shown (round_id, player, idx) values (p_round, v_user, p_idx) on conflict do nothing;
  select shown_at into v_shown from public.group_shown where round_id = p_round and player = v_user and idx = p_idx;
  select * into q from public.questions where id = r.question_ids[p_idx + 1];
  return jsonb_build_object(
    'question', jsonb_build_object('id', q.id, 'question', coalesce(q.translations -> p_locale ->> 'question', q.question), 'options', coalesce(q.translations -> p_locale -> 'options', q.options)),
    'secondsLeft', greatest(0, 20 - extract(epoch from now() - v_shown)));
end $$;

create function public.group_round_answer(p_round uuid, p_idx int, p_selected int, p_locale text default 'de') returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  r public.group_rounds%rowtype := private.group_round_mine(p_round);
  v_shown timestamptz;
  v_selected int := p_selected;
  v_options jsonb;
  v_a public.question_answers%rowtype;
  v_correct boolean;
begin
  if r.closes_at <= now() then raise exception 'round closed' using errcode = '42501'; end if;
  if p_idx <> (select count(*) from public.group_answers where round_id = p_round and player = v_user) then
    raise exception 'answer the questions in order' using errcode = '22023';
  end if;
  select shown_at into v_shown from public.group_shown where round_id = p_round and player = v_user and idx = p_idx;
  if v_shown is null or now() - v_shown > interval '23 seconds' then v_selected := null; end if; -- must be opened first, and in time
  select options into v_options from public.questions where id = r.question_ids[p_idx + 1];
  select * into v_a from public.question_answers where question_id = r.question_ids[p_idx + 1];
  if v_selected is not null and (v_selected < 0 or v_selected >= jsonb_array_length(v_options)) then raise exception 'invalid option'; end if;
  v_correct := v_selected is not null and v_selected = v_a.correct_index;
  insert into public.group_answers (round_id, player, idx, selected, correct) values (p_round, v_user, p_idx, v_selected, v_correct);
  return jsonb_build_object('correct', v_correct, 'correctIndex', v_a.correct_index,
    'explanation', coalesce(v_a.translations -> p_locale ->> 'explanation', v_a.explanation), 'late', v_selected is null and p_selected is not null);
end $$;

-- everything a member may see of a group: members, the last rounds, and rankings of rounds they have played
create function public.group_state(p_group uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  g public.groups%rowtype;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select * into g from public.groups where id = p_group;
  if not found or not private.group_member(p_group, v_user) then raise exception 'group not found' using errcode = 'P0002'; end if;
  return jsonb_build_object(
    'id', g.id, 'name', g.name, 'code', g.code, 'owner', coalesce(g.owner = v_user, false),
    'members', (select jsonb_agg(jsonb_build_object('id', m.user_id, 'name', private.duel_name(m.user_id), 'me', m.user_id = v_user, 'owner', coalesce(m.user_id = g.owner, false)) order by m.joined_at)
                from public.group_members m where m.group_id = p_group),
    'rounds', coalesce((select jsonb_agg(x order by x ->> 'createdAt' desc) from (
      select jsonb_build_object(
        'id', r.id, 'category', r.category_id, 'createdAt', r.created_at, 'closesAt', r.closes_at, 'open', r.closes_at > now(),
        'played', (select count(*) from public.group_answers a where a.round_id = r.id and a.player = v_user),
        'players', (select count(distinct a.player) from public.group_answers a where a.round_id = r.id),
        'ranking', case when r.closes_at <= now() or (select count(*) from public.group_answers a where a.round_id = r.id and a.player = v_user) = 6 then
          (select jsonb_agg(jsonb_build_object('name', private.duel_name(s.player), 'me', s.player = v_user, 'score', s.score, 'done', s.n = 6) order by s.score desc, s.last)
             from (select a.player, count(*) filter (where a.correct) as score, count(*) as n, max(a.answered_at) as last from public.group_answers a where a.round_id = r.id group by a.player) s)
          end) as x
      from public.group_rounds r where r.group_id = p_group order by r.created_at desc limit 10) t), '[]'::jsonb));
end $$;

create function public.my_groups() returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', g.id, 'name', g.name, 'code', g.code,
      'members', (select count(*) from public.group_members m where m.group_id = g.id),
      'openRound', exists (select 1 from public.group_rounds r where r.group_id = g.id and r.closes_at > now()
                           and (select count(*) from public.group_answers a where a.round_id = r.id and a.player = v_user) < 6),
      'updatedAt', g.updated_at) order by g.updated_at desc)
    from public.groups g join public.group_members me on me.group_id = g.id and me.user_id = v_user), '[]'::jsonb);
end $$;

-- duel_pool takes a duel id only to leave out questions already used in that duel; a group round passes null
revoke execute on function private.group_member(uuid, uuid), private.group_round_mine(uuid) from public, anon, authenticated;
revoke execute on function public.group_create(text), public.group_join(text), public.group_leave(uuid), public.group_remove_member(uuid, uuid),
  public.group_round_start(uuid, text), public.group_round_question(uuid, int, text), public.group_round_answer(uuid, int, int, text),
  public.group_state(uuid), public.my_groups() from public, anon;
grant execute on function public.group_create(text), public.group_join(text), public.group_leave(uuid), public.group_remove_member(uuid, uuid),
  public.group_round_start(uuid, text), public.group_round_question(uuid, int, text), public.group_round_answer(uuid, int, int, text),
  public.group_state(uuid), public.my_groups() to authenticated;
