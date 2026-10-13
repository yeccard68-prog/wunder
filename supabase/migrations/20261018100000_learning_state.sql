-- Book learning state per account, so it follows the learner to another device:
-- which ideas were recalled, when each is due again, which are saved. One small JSON document per
-- account, readable and writable only by its owner. It contains ids of book ideas, counters and
-- dates – no free text. Deleted with the account (cascade).
create table public.book_states (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 60000),
  updated_at timestamptz not null default now()
);
alter table public.book_states enable row level security;

create policy "own book state can be read" on public.book_states for select to authenticated using (user_id = (select auth.uid()));
create policy "own book state can be created" on public.book_states for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own book state can be changed" on public.book_states for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.book_states from anon, authenticated;
grant select, insert (user_id, data, updated_at), update (user_id, data, updated_at) on public.book_states to authenticated;

-- New usage events (still consent-based, still never for children's accounts):
-- recalling a book idea, a second attempt at a clip question, a prediction inside an animation.
alter table public.events drop constraint events_name_check;
alter table public.events add constraint events_name_check check (name in (
  'session_start', 'feed_view', 'clip_start', 'clip_complete', 'animation_start', 'animation_complete', 'insight_complete', 'book_open', 'content_save', 'search',
  'recall_known', 'recall_again', 'clip_quiz_retry', 'animation_predict'
));

-- Questions about a clip: one hint and a second attempt.
-- The first try is judged here without revealing the solution. It is stored, so the answer cannot
-- be found out by trying every option: a further call is refused, and the app then treats the
-- next choice as the final answer. Only clip questions with at least three options qualify, and only before the question has
-- been answered. The final answer still goes through submit_answer(), which scores it.
create table public.clip_quiz_attempts (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id text not null references public.questions (id) on delete cascade,
  first_selected smallint not null,
  first_correct boolean not null,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);
alter table public.clip_quiz_attempts enable row level security;
revoke all on public.clip_quiz_attempts from anon, authenticated; -- written and read only through the function below

create function public.check_first_attempt(p_question_id text, p_selected integer)
returns boolean language plpgsql security definer set search_path to '' as $function$
declare
  v_user uuid := (select auth.uid());
  v_q public.questions%rowtype;
  v_correct boolean;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select * into v_q from public.questions q where q.id = p_question_id and q.status = 'published' and q.show_in_feed = false and q.kind = 'question';
  if not found or jsonb_array_length(v_q.options) < 3 then raise exception 'question not found' using errcode = 'P0002'; end if;
  if p_selected is null or p_selected < 0 or p_selected >= jsonb_array_length(v_q.options) then raise exception 'invalid option'; end if;
  if exists (select 1 from public.question_progress p where p.user_id = v_user and p.question_id = p_question_id) then
    raise exception 'already answered' using errcode = '42501';
  end if;

  if exists (select 1 from public.clip_quiz_attempts a where a.user_id = v_user and a.question_id = p_question_id) then
    raise exception 'first attempt already used' using errcode = '42501';
  end if;

  select a.correct_index = p_selected into v_correct from public.question_answers a where a.question_id = p_question_id;
  if v_correct is null then raise exception 'question has no answer key' using errcode = 'P0002'; end if;
  insert into public.clip_quiz_attempts (user_id, question_id, first_selected, first_correct) values (v_user, p_question_id, p_selected, v_correct);
  return v_correct;
end $function$;

revoke execute on function public.check_first_attempt(text, integer) from public, anon;
grant execute on function public.check_first_attempt(text, integer) to authenticated;
