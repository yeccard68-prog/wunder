-- Languages, age levels and video segments. Purely additive: no existing data is changed or removed.
--
-- Translations: the base row stays the original language (German). Every other language lives in a
-- JSON object keyed by locale, e.g. questions.translations = {"en": {"question": "...", "options": ["..."]}}.
-- Missing translations fall back to the base text, so a new language can be rolled out gradually.
-- Translated explanations stay in the private answer table.

alter table public.categories
  add column translations jsonb not null default '{}' check (jsonb_typeof(translations) = 'object');

-- Age levels: 6 (children), 10, 13, 16 (everything). max_age marks content written only for children.
alter table public.questions
  add column min_age smallint not null default 10 check (min_age in (6, 10, 13, 16)),
  add column max_age smallint check (max_age is null or max_age >= min_age),
  add column translations jsonb not null default '{}' check (jsonb_typeof(translations) = 'object');

alter table public.question_answers
  add column translations jsonb not null default '{}' check (jsonb_typeof(translations) = 'object');   -- {"en": {"explanation": "..."}}

-- Videos may be a segment of a longer, externally hosted file (start/end in seconds) and carry a licence note.
alter table public.videos
  add column min_age smallint not null default 10 check (min_age in (6, 10, 13, 16)),
  add column translations jsonb not null default '{}' check (jsonb_typeof(translations) = 'object'),
  add column start_seconds numeric(7, 2) check (start_seconds >= 0),
  add column end_seconds numeric(7, 2),
  add column license text,
  add constraint videos_segment_check check (end_seconds is null or end_seconds > coalesce(start_seconds, 0));

-- Only an age band is stored – never a birth date.
alter table public.profiles
  add column locale text not null default 'de' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  add column age_band text check (age_band in ('6-9', '10-12', '13-15', '16+'));
grant update (locale, age_band) on public.profiles to authenticated;

-- submit_answer / get_my_state return the explanation in the requested language (fallback: original).
drop function public.submit_answer(text, int, text, date);
create function public.submit_answer(p_question_id text, p_selected int, p_context text default 'feed', p_local_date date default null, p_locale text default null)
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
    'explanation', coalesce(v_a.translations -> p_locale ->> 'explanation', v_a.explanation),
    'xp_earned', v_xp,
    'attempt_type', v_type,
    'last_correct', case when v_type = 'practice' and v_correct then v_p.last_correct else v_correct end,
    'review_box', v_box,
    'review_due', v_due,
    'successful_reviews', v_reviews,
    'stats', private.stats(v_user, v_date)
  );
end $$;

drop function public.get_my_state(date);
create function public.get_my_state(p_local_date date default null, p_locale text default null)
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
        'correct_index', a.correct_index, 'explanation', coalesce(a.translations -> p_locale ->> 'explanation', a.explanation)))
      from public.question_progress p
      join public.questions q on q.id = p.question_id
      join public.question_answers a on a.question_id = p.question_id
      where p.user_id = v_user), '[]'::jsonb),
    'question_reactions', coalesce((select jsonb_agg(to_jsonb(r) - 'user_id') from public.question_reactions r where r.user_id = v_user), '[]'::jsonb),
    'video_progress', coalesce((select jsonb_agg(to_jsonb(v) - 'user_id') from public.video_progress v where v.user_id = v_user), '[]'::jsonb)
  );
end $$;

revoke execute on function public.submit_answer(text, int, text, date, text) from public, anon;
revoke execute on function public.get_my_state(date, text) from public, anon;
grant execute on function public.submit_answer(text, int, text, date, text) to authenticated;
grant execute on function public.get_my_state(date, text) to authenticated;
