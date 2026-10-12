-- New question formats beyond multiple choice and true/false:
--   order    – put the options into the right sequence        answer: {"order": [2,0,3,1]}  (option indices in correct order)
--   estimate – estimate a number with a slider                answer: {"value": 71, "abs": 5} or {"value": 384400, "rel": 0.15}
--   blank    – type the missing word                          answer: {"accept": ["paris"], "show": "Paris"}
-- The answer key stays in the private table question_answers; clients send their response to
-- submit_response(), which decides right or wrong on the server and then uses the unchanged
-- scoring of submit_answer() (XP, reviews, streak). Purely additive: existing rows are untouched.

alter table public.questions drop constraint questions_kind_check;
alter table public.questions add constraint questions_kind_check check (kind in ('question', 'fact', 'order', 'estimate', 'blank'));
alter table public.question_answers add column answer jsonb check (answer is null or jsonb_typeof(answer) = 'object');

-- submit_answer: identical to the previous version plus one guard – questions of the new formats
-- cannot be answered by simply sending an option index (their correct_index is only a placeholder).
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

-- Decides a response of one of the new formats, then scores it exactly like any other answer.
create function public.submit_response(p_question_id text, p_response jsonb, p_context text default 'feed', p_local_date date default null, p_locale text default null)
returns jsonb language plpgsql security definer set search_path to '' as $function$
declare
  v_q public.questions%rowtype;
  v_a public.question_answers%rowtype;
  v_ok boolean;
  v_text text;
  v_res jsonb;
begin
  if (select auth.uid()) is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select * into v_q from public.questions q where q.id = p_question_id and q.status = 'published';
  if not found then raise exception 'question not found' using errcode = 'P0002'; end if;
  select * into v_a from public.question_answers a where a.question_id = p_question_id;
  if not found or v_a.answer is null then raise exception 'question has no answer key' using errcode = 'P0002'; end if;
  if p_response is null or jsonb_typeof(p_response) <> 'object' then raise exception 'invalid response'; end if;

  if v_q.kind = 'order' then
    if jsonb_typeof(p_response -> 'order') is distinct from 'array' or jsonb_array_length(p_response -> 'order') <> jsonb_array_length(v_q.options) then raise exception 'invalid response'; end if;
    v_ok := (p_response -> 'order') = (v_a.answer -> 'order');
  elsif v_q.kind = 'estimate' then
    if jsonb_typeof(p_response -> 'value') is distinct from 'number' then raise exception 'invalid response'; end if;
    v_ok := abs((p_response ->> 'value')::numeric - (v_a.answer ->> 'value')::numeric)
            <= coalesce((v_a.answer ->> 'abs')::numeric, abs((v_a.answer ->> 'value')::numeric) * (v_a.answer ->> 'rel')::numeric, 0);
  elsif v_q.kind = 'blank' then
    v_text := lower(btrim(regexp_replace(coalesce(p_response ->> 'text', ''), '\s+', ' ', 'g'), ' .!?'));
    if v_text = '' or char_length(v_text) > 80 then raise exception 'invalid response'; end if;
    v_ok := (v_a.answer -> 'accept') ? v_text;
  else
    raise exception 'this question is answered through submit_answer';
  end if;

  -- correct → the placeholder index, wrong → any other index; the flag lets submit_answer accept the new formats
  perform set_config('wunder.via_response', '1', true);
  v_res := public.submit_answer(p_question_id, case when v_ok then v_a.correct_index else (v_a.correct_index + 1) % jsonb_array_length(v_q.options) end, p_context, p_local_date, p_locale);
  perform set_config('wunder.via_response', '', true);
  return v_res || jsonb_build_object('answer', v_a.answer);
end $function$;

revoke execute on function public.submit_response(text, jsonb, text, date, text) from public, anon;
grant execute on function public.submit_response(text, jsonb, text, date, text) to authenticated;
