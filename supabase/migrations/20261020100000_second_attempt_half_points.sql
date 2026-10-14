-- Clip questions allow one second attempt (see check_first_attempt). A question that is answered
-- correctly only on the second attempt now earns half the points. Otherwise identical to the
-- version in 20261016120000_question_formats.sql.
create or replace function public.submit_answer(p_question_id text, p_selected integer, p_context text default 'feed', p_local_date date default null, p_locale text default null)
returns jsonb language plpgsql security definer set search_path to '' as $function$
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
  if v_q.kind not in ('question', 'fact') and coalesce(current_setting('wunder.via_response', true), '') <> '1' then
    raise exception 'this question is answered through submit_response' using errcode = '42501';
  end if;
  if p_selected is null or p_selected < 0 or p_selected >= jsonb_array_length(v_q.options) then raise exception 'invalid option'; end if;
  select * into v_a from public.question_answers a where a.question_id = p_question_id;
  if not found then raise exception 'question has no answer key' using errcode = 'P0002'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':' || p_question_id, 0));

  v_correct := p_selected = v_a.correct_index;
  select * into v_p from public.question_progress p where p.user_id = v_user and p.question_id = p_question_id;

  if not found then
    v_type := 'first';
    v_xp := case when not v_correct then 0 when v_q.kind = 'fact' then 5 else 10 * v_q.difficulty end;
    if v_correct and exists (select 1 from public.clip_quiz_attempts c where c.user_id = v_user and c.question_id = p_question_id and not c.first_correct) then
      v_xp := v_xp / 2; -- right only on the second attempt
    end if;
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
end $function$;
