-- Wunder – initial schema
-- Principles:
--   * Content (categories, questions, videos) is world-readable only when published.
--   * Correct answers and explanations live in a private table and are only revealed
--     by submit_answer() after the user has answered.
--   * Everything that carries score (XP, streak, attempts, review schedule, daily activity)
--     is written exclusively by security-definer functions – never directly by clients.
--   * XP has ONE source of truth: daily_activity.xp_earned (totals are sums of it).

create schema if not exists private;
revoke all on schema private from anon, authenticated;

-- ---------------------------------------------------------------- content
create table public.categories (
  id             text primary key,
  slug           text not null unique,
  name           text not null,
  description    text,
  display_order  int  not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.questions (
  id                   text primary key default gen_random_uuid()::text,
  kind                 text not null default 'question' check (kind in ('question', 'fact')),  -- fact = true/false claim
  category_id          text not null references public.categories (id),
  question             text not null check (char_length(btrim(question)) > 0),
  options              jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  difficulty           smallint not null default 1 check (difficulty between 1 and 3),
  tags                 text[] not null default '{}',
  source_name          text,
  source_url           text,
  source_published_at  timestamptz,
  verification_status  text not null default 'unverified' check (verification_status in ('unverified', 'ai_checked', 'verified')),
  status               text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  show_in_feed         boolean not null default true,  -- false for quiz questions that belong to a video
  like_count           int not null default 0 check (like_count >= 0),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index questions_status_created_idx on public.questions (status, created_at desc);
create index questions_category_idx on public.questions (category_id);

-- Private answer key: no client policy exists for this table.
create table public.question_answers (
  question_id    text primary key references public.questions (id) on delete cascade,
  correct_index  smallint not null check (correct_index >= 0),
  explanation    text not null check (char_length(btrim(explanation)) > 0),
  updated_at     timestamptz not null default now()
);

create table public.videos (
  id                   text primary key default gen_random_uuid()::text,
  category_id          text not null references public.categories (id),
  title                text not null check (char_length(btrim(title)) > 0),
  hook                 text not null,                   -- the one takeaway
  description          text,
  video_url            text not null,                   -- absolute URL, storage path or app-bundled path (/clips/...)
  thumbnail_url        text,
  duration_seconds     numeric(5, 2) not null check (duration_seconds > 0 and duration_seconds <= 60),
  has_audio            boolean not null default false,
  captions             jsonb not null default '[]' check (jsonb_typeof(captions) = 'array'),
  creator_name         text,
  format               text,
  sources              jsonb not null default '[]' check (jsonb_typeof(sources) = 'array'),  -- [{name, url}]
  published_at         timestamptz,
  tags                 text[] not null default '{}',
  quiz_question_id     text references public.questions (id) on delete set null,
  verification_status  text not null default 'unverified' check (verification_status in ('unverified', 'ai_checked', 'verified')),
  status               text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  like_count           int not null default 0 check (like_count >= 0),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index videos_status_published_idx on public.videos (status, published_at desc);
create index videos_category_idx on public.videos (category_id);
create index videos_quiz_question_idx on public.videos (quiz_question_id);

-- ---------------------------------------------------------------- users
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null default 'Neugierig' check (char_length(btrim(display_name)) between 1 and 30),
  avatar_url    text,
  interests     text[] not null default '{}',
  onboarded     boolean not null default false,
  goal_minutes  smallint not null default 5 check (goal_minutes in (3, 5, 10)),
  motivation    text check (motivation in ('discover', 'improve', 'compete')),
  is_private    boolean not null default false,
  is_admin      boolean not null default false,   -- server-owned
  is_premium    boolean not null default false,   -- server-owned, reserved (no billing yet)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Streak state (server-owned). XP is not stored here – it is summed from daily_activity.
create table public.user_stats (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  streak_current    int not null default 0,
  streak_best       int not null default 0,
  streak_last_date  date,
  updated_at        timestamptz not null default now()
);

-- One row per user and learning day. The only place XP is stored.
create table public.daily_activity (
  user_id          uuid not null references public.profiles (id) on delete cascade,
  activity_date    date not null,
  answered_count   int not null default 0 check (answered_count >= 0),   -- first answers + due reviews
  xp_earned        int not null default 0 check (xp_earned >= 0),
  challenge_score  smallint check (challenge_score between 0 and 5),     -- daily challenge, set once
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (user_id, activity_date)
);

-- Append-only history of every answer.
create table public.question_attempts (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  question_id     text not null references public.questions (id) on delete cascade,
  selected_index  smallint not null,
  is_correct      boolean not null,
  attempt_type    text not null check (attempt_type in ('first', 'review', 'practice')),
  context         text not null default 'feed' check (context in ('feed', 'quiz', 'daily', 'review', 'challenge', 'video')),
  xp_earned       int not null default 0,
  activity_date   date not null,
  created_at      timestamptz not null default now()
);
create index question_attempts_user_question_idx on public.question_attempts (user_id, question_id);
create index question_attempts_user_date_idx on public.question_attempts (user_id, activity_date);
create index question_attempts_question_idx on public.question_attempts (question_id);

-- Current learning state per user and question (spaced repetition). History = question_attempts.
create table public.question_progress (
  user_id             uuid not null references public.profiles (id) on delete cascade,
  question_id         text not null references public.questions (id) on delete cascade,
  last_correct        boolean not null,
  review_box          smallint check (review_box between 0 and 4),
  review_due          timestamptz,
  successful_reviews  int not null default 0,
  first_answered_at   timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  primary key (user_id, question_id)
);
create index question_progress_question_idx on public.question_progress (question_id);

-- Likes, saves, "not interested" and reports. No score involved → written by the client under RLS.
create table public.question_reactions (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  question_id  text not null references public.questions (id) on delete cascade,
  liked        boolean not null default false,
  saved        boolean not null default false,
  hidden       boolean not null default false,
  reported     boolean not null default false,
  updated_at   timestamptz not null default now(),
  primary key (user_id, question_id)
);
create index question_reactions_question_idx on public.question_reactions (question_id);

create table public.video_progress (
  user_id                uuid not null references public.profiles (id) on delete cascade,
  video_id               text not null references public.videos (id) on delete cascade,
  plays                  int not null default 0 check (plays >= 0),
  completions            int not null default 0 check (completions >= 0),
  last_position_seconds  numeric(5, 2),
  liked                  boolean not null default false,
  saved                  boolean not null default false,
  hidden                 boolean not null default false,
  reported               boolean not null default false,
  updated_at             timestamptz not null default now(),
  primary key (user_id, video_id)
);
create index video_progress_video_idx on public.video_progress (video_id);

-- ---------------------------------------------------------------- housekeeping triggers
create function private.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger touch before update on public.categories         for each row execute function private.touch_updated_at();
create trigger touch before update on public.questions          for each row execute function private.touch_updated_at();
create trigger touch before update on public.question_answers   for each row execute function private.touch_updated_at();
create trigger touch before update on public.videos             for each row execute function private.touch_updated_at();
create trigger touch before update on public.profiles           for each row execute function private.touch_updated_at();
create trigger touch before update on public.question_reactions for each row execute function private.touch_updated_at();
create trigger touch before update on public.video_progress     for each row execute function private.touch_updated_at();

-- The correct answer must point at an existing option.
create function private.check_answer_index() returns trigger language plpgsql set search_path = '' as $$
declare n int;
begin
  select jsonb_array_length(q.options) into n from public.questions q where q.id = new.question_id;
  if new.correct_index >= n then
    raise exception 'correct_index % is out of range for question % (% options)', new.correct_index, new.question_id, n;
  end if;
  return new;
end $$;
create trigger check_index before insert or update on public.question_answers for each row execute function private.check_answer_index();

-- Every auth user (guest or registered) gets a profile and a stats row.
create function private.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.user_stats (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

-- Public like counters
create function private.sync_question_likes() returns trigger language plpgsql security definer set search_path = '' as $$
declare delta int := (case when tg_op <> 'DELETE' and new.liked then 1 else 0 end) - (case when tg_op <> 'INSERT' and old.liked then 1 else 0 end);
begin
  if delta <> 0 then
    update public.questions set like_count = greatest(like_count + delta, 0) where id = coalesce(new.question_id, old.question_id);
  end if;
  return null;
end $$;
create trigger sync_likes after insert or update of liked or delete on public.question_reactions for each row execute function private.sync_question_likes();

create function private.sync_video_likes() returns trigger language plpgsql security definer set search_path = '' as $$
declare delta int := (case when tg_op <> 'DELETE' and new.liked then 1 else 0 end) - (case when tg_op <> 'INSERT' and old.liked then 1 else 0 end);
begin
  if delta <> 0 then
    update public.videos set like_count = greatest(like_count + delta, 0) where id = coalesce(new.video_id, old.video_id);
  end if;
  return null;
end $$;
create trigger sync_likes after insert or update of liked or delete on public.video_progress for each row execute function private.sync_video_likes();

-- ---------------------------------------------------------------- scoring (server-side only)
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false);
$$;

-- The client sends its local calendar date so streaks follow the user's day, but it may
-- only differ from the server's UTC date by one day (time zones) – no back- or forward-dating.
create function private.local_date(p_date date) returns date language sql stable set search_path = '' as $$
  select case when p_date is null or abs(p_date - (now() at time zone 'utc')::date) > 1 then (now() at time zone 'utc')::date else p_date end;
$$;

-- Single write path for XP, daily counters and streak.
create function private.record_activity(p_user uuid, p_date date, p_xp int, p_answered int) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.daily_activity (user_id, activity_date, answered_count, xp_earned)
  values (p_user, p_date, p_answered, p_xp)
  on conflict (user_id, activity_date) do update
    set answered_count = public.daily_activity.answered_count + excluded.answered_count,
        xp_earned = public.daily_activity.xp_earned + excluded.xp_earned,
        updated_at = now();

  update public.user_stats s set
    streak_current = case when s.streak_last_date = p_date - 1 then s.streak_current + 1 else 1 end,
    streak_best = greatest(s.streak_best, case when s.streak_last_date = p_date - 1 then s.streak_current + 1 else 1 end),
    streak_last_date = p_date,
    updated_at = now()
  where s.user_id = p_user and (s.streak_last_date is null or s.streak_last_date < p_date);
end $$;

create function private.stats(p_user uuid, p_date date) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'xp', coalesce((select sum(d.xp_earned) from public.daily_activity d where d.user_id = p_user), 0),
    'week_xp', coalesce((select sum(d.xp_earned) from public.daily_activity d where d.user_id = p_user and d.activity_date >= date_trunc('week', p_date::timestamp)::date), 0),
    'week_start', date_trunc('week', p_date::timestamp)::date,
    'streak_current', s.streak_current,
    'streak_best', s.streak_best,
    'streak_last_date', s.streak_last_date,
    'today', p_date,
    'today_answered', coalesce((select d.answered_count from public.daily_activity d where d.user_id = p_user and d.activity_date = p_date), 0),
    'challenge_date', (select max(d.activity_date) from public.daily_activity d where d.user_id = p_user and d.challenge_score is not null),
    'challenge_score', (select d.challenge_score from public.daily_activity d where d.user_id = p_user and d.challenge_score is not null order by d.activity_date desc limit 1)
  )
  from public.user_stats s where s.user_id = p_user;
$$;

-- Answer a question. Returns correctness, the correct option, the explanation and fresh stats.
--   first answer : 10 XP x difficulty (true/false cards: 5 XP), wrong = 0 and a review is scheduled
--   due review   : 5 XP when correct, box moves up (10 min, 1, 3, 7, 21 days)
--   practice     : no XP, does not count for goal or streak; a miss schedules a review
create function public.submit_answer(p_question_id text, p_selected int, p_context text default 'feed', p_local_date date default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_date date := private.local_date(p_local_date);
  v_q public.questions%rowtype;
  v_a public.question_answers%rowtype;
  v_p public.question_progress%rowtype;
  v_correct boolean;
  v_type text;
  v_xp int := 0;
  v_box smallint;
  v_due timestamptz;
  v_reviews int := 0;
  c_steps constant interval[] := array['10 minutes', '1 day', '3 days', '7 days', '21 days']::interval[];
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if p_context not in ('feed', 'quiz', 'daily', 'review', 'challenge', 'video') then raise exception 'invalid context'; end if;

  select * into v_q from public.questions q where q.id = p_question_id and q.status = 'published';
  if not found then raise exception 'question not found' using errcode = 'P0002'; end if;
  if p_selected is null or p_selected < 0 or p_selected >= jsonb_array_length(v_q.options) then raise exception 'invalid option'; end if;
  select * into v_a from public.question_answers a where a.question_id = p_question_id;
  if not found then raise exception 'question has no answer key' using errcode = 'P0002'; end if;

  -- serialise concurrent submissions of the same user for the same question (no double XP)
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':' || p_question_id, 0));

  v_correct := p_selected = v_a.correct_index;
  select * into v_p from public.question_progress p where p.user_id = v_user and p.question_id = p_question_id;

  if not found then
    v_type := 'first';
    v_xp := case when not v_correct then 0 when v_q.kind = 'fact' then 5 else 10 * v_q.difficulty end;
    if not v_correct then v_box := 0; v_due := now() + c_steps[1]; end if;
    insert into public.question_progress (user_id, question_id, last_correct, review_box, review_due)
    values (v_user, p_question_id, v_correct, v_box, v_due);
  elsif v_p.review_due is not null and v_p.review_due <= now() then
    v_type := 'review';
    v_reviews := v_p.successful_reviews;
    if v_correct then
      v_xp := 5;
      v_reviews := v_reviews + 1;
      v_box := coalesce(v_p.review_box, 0) + 1;
      if v_box > 4 then v_box := null; v_due := null; else v_due := now() + c_steps[v_box + 1]; end if;
    else
      v_box := 0; v_due := now() + c_steps[1];
    end if;
    update public.question_progress set last_correct = v_correct, review_box = v_box, review_due = v_due, successful_reviews = v_reviews, updated_at = now()
    where user_id = v_user and question_id = p_question_id;
  else
    v_type := 'practice';
    v_box := v_p.review_box; v_due := v_p.review_due; v_reviews := v_p.successful_reviews;
    if not v_correct then
      v_box := 0; v_due := now() + c_steps[1];
      update public.question_progress set last_correct = false, review_box = v_box, review_due = v_due, updated_at = now()
      where user_id = v_user and question_id = p_question_id;
    end if;
  end if;

  insert into public.question_attempts (user_id, question_id, selected_index, is_correct, attempt_type, context, xp_earned, activity_date)
  values (v_user, p_question_id, p_selected, v_correct, v_type, p_context, v_xp, v_date);

  if v_type <> 'practice' then
    perform private.record_activity(v_user, v_date, v_xp, 1);
  end if;

  return jsonb_build_object(
    'correct', v_correct,
    'correct_index', v_a.correct_index,
    'explanation', v_a.explanation,
    'xp_earned', v_xp,
    'attempt_type', v_type,
    'last_correct', case when v_type = 'practice' and v_correct then v_p.last_correct else v_correct end,
    'review_box', v_box,
    'review_due', v_due,
    'successful_reviews', v_reviews,
    'stats', private.stats(v_user, v_date)
  );
end $$;

-- Daily challenge bonus: 4 XP per correct answer among the day's first five "daily" answers, +10 for 5/5. Once per day.
create function public.complete_daily_challenge(p_local_date date default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_date date := private.local_date(p_local_date);
  v_total int;
  v_score int;
  v_bonus int := 0;
  v_existing smallint;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':daily:' || v_date::text, 0));

  select d.challenge_score into v_existing from public.daily_activity d where d.user_id = v_user and d.activity_date = v_date;
  if v_existing is null then
    select count(*), count(*) filter (where t.is_correct) into v_total, v_score
    from (select a.is_correct from public.question_attempts a
          where a.user_id = v_user and a.activity_date = v_date and a.context = 'daily' order by a.id limit 5) t;
    if v_total < 5 then raise exception 'daily challenge not finished (% of 5 answers)', v_total; end if;
    v_bonus := 4 * v_score + case when v_score = 5 then 10 else 0 end;
    perform private.record_activity(v_user, v_date, v_bonus, 0);
    update public.daily_activity set challenge_score = v_score where user_id = v_user and activity_date = v_date;
  else
    v_score := v_existing;
  end if;

  return jsonb_build_object('score', v_score, 'bonus_xp', v_bonus, 'stats', private.stats(v_user, v_date));
end $$;

-- Everything the app needs to restore a user's state on any device.
-- Answers/explanations are included only for questions this user has already answered.
create function public.get_my_state(p_local_date date default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_date date := private.local_date(p_local_date);
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  return jsonb_build_object(
    'profile', (select to_jsonb(p) - 'is_admin' from public.profiles p where p.id = v_user),
    'stats', private.stats(v_user, v_date),
    'progress', coalesce((
      select jsonb_agg(jsonb_build_object(
        'question_id', p.question_id, 'last_correct', p.last_correct, 'review_box', p.review_box, 'review_due', p.review_due,
        'successful_reviews', p.successful_reviews, 'updated_at', p.updated_at,
        'category_id', q.category_id, 'difficulty', q.difficulty,
        'correct_index', a.correct_index, 'explanation', a.explanation))
      from public.question_progress p
      join public.questions q on q.id = p.question_id
      join public.question_answers a on a.question_id = p.question_id
      where p.user_id = v_user), '[]'::jsonb),
    'question_reactions', coalesce((select jsonb_agg(to_jsonb(r) - 'user_id') from public.question_reactions r where r.user_id = v_user), '[]'::jsonb),
    'video_progress', coalesce((select jsonb_agg(to_jsonb(v) - 'user_id') from public.video_progress v where v.user_id = v_user), '[]'::jsonb)
  );
end $$;

-- Account deletion (required by Apple and Google). Cascades to all user rows.
create function public.delete_my_account() returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  delete from auth.users where id = v_user;
end $$;

-- Functions are callable by signed-in users (guests included) only.
revoke execute on function public.submit_answer(text, int, text, date) from public, anon;
revoke execute on function public.complete_daily_challenge(date) from public, anon;
revoke execute on function public.get_my_state(date) from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.submit_answer(text, int, text, date) to authenticated;
grant execute on function public.complete_daily_challenge(date) to authenticated;
grant execute on function public.get_my_state(date) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

-- ---------------------------------------------------------------- row level security
alter table public.categories         enable row level security;
alter table public.questions          enable row level security;
alter table public.question_answers   enable row level security;
alter table public.videos             enable row level security;
alter table public.profiles           enable row level security;
alter table public.user_stats         enable row level security;
alter table public.daily_activity     enable row level security;
alter table public.question_attempts  enable row level security;
alter table public.question_progress  enable row level security;
alter table public.question_reactions enable row level security;
alter table public.video_progress     enable row level security;

-- Table privileges: start from nothing, grant exactly what each role needs.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.categories, public.questions, public.videos to anon, authenticated;
grant insert, update, delete on public.categories, public.questions, public.videos to authenticated;              -- narrowed to admins by RLS
grant select, insert, update, delete on public.question_answers to authenticated;                                  -- admins only by RLS
grant select on public.profiles, public.user_stats, public.daily_activity, public.question_attempts, public.question_progress to authenticated;
grant update (display_name, avatar_url, interests, onboarded, goal_minutes, motivation, is_private) on public.profiles to authenticated;
grant select, insert, update, delete on public.question_reactions, public.video_progress to authenticated;

-- Published content is public
create policy "published categories are public" on public.categories for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "published questions are public"  on public.questions  for select to anon, authenticated using (status = 'published' or (select public.is_admin()));
create policy "published videos are public"     on public.videos     for select to anon, authenticated using (status = 'published' or (select public.is_admin()));

-- Content administration (profiles.is_admin, set manually in the dashboard)
create policy "admins insert categories" on public.categories for insert to authenticated with check ((select public.is_admin()));
create policy "admins update categories" on public.categories for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins delete categories" on public.categories for delete to authenticated using ((select public.is_admin()));
create policy "admins insert questions"  on public.questions  for insert to authenticated with check ((select public.is_admin()));
create policy "admins update questions"  on public.questions  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins delete questions"  on public.questions  for delete to authenticated using ((select public.is_admin()));
create policy "admins insert videos"     on public.videos     for insert to authenticated with check ((select public.is_admin()));
create policy "admins update videos"     on public.videos     for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins delete videos"     on public.videos     for delete to authenticated using ((select public.is_admin()));
create policy "admins manage answer key" on public.question_answers for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Private user data: own rows only
create policy "read own profile"    on public.profiles          for select to authenticated using (id = (select auth.uid()));
create policy "update own profile"  on public.profiles          for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "read own stats"      on public.user_stats        for select to authenticated using (user_id = (select auth.uid()));
create policy "read own activity"   on public.daily_activity    for select to authenticated using (user_id = (select auth.uid()));
create policy "read own attempts"   on public.question_attempts for select to authenticated using (user_id = (select auth.uid()));
create policy "read own progress"   on public.question_progress for select to authenticated using (user_id = (select auth.uid()));

create policy "read own reactions"   on public.question_reactions for select to authenticated using (user_id = (select auth.uid()));
create policy "insert own reactions" on public.question_reactions for insert to authenticated with check (user_id = (select auth.uid()));
create policy "update own reactions" on public.question_reactions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "delete own reactions" on public.question_reactions for delete to authenticated using (user_id = (select auth.uid()));

create policy "read own video progress"   on public.video_progress for select to authenticated using (user_id = (select auth.uid()));
create policy "insert own video progress" on public.video_progress for insert to authenticated with check (user_id = (select auth.uid()));
create policy "update own video progress" on public.video_progress for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "delete own video progress" on public.video_progress for delete to authenticated using (user_id = (select auth.uid()));
