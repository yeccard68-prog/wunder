-- Security + scoring tests. Run in the Supabase SQL editor (or any admin connection).
-- The whole block ends with RAISE EXCEPTION on purpose: that rolls back every change
-- (test users, answers, reactions) and prints the results in the error message.
-- Expected: every line starts with "ok".
do $$
declare
  a uuid := gen_random_uuid();   -- user A
  b uuid := gen_random_uuid();   -- user B
  today date := (now() at time zone 'utc')::date;
  out text[] := '{}';
  r jsonb;
  n int;
begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'a-' || a || '@test.invalid'), (b, 'authenticated', 'authenticated', 'b-' || b || '@test.invalid');
  insert into public.questions (id, category_id, question, options, status) values ('test-draft', 'science', 'Entwurf', '["a","b"]', 'draft');
  select count(*) into n from public.profiles where id in (a, b);
  out := out || (case when n = 2 then 'ok' else 'FAIL' end || ' 01 profile is created for every new auth user');

  -- ---------- anonymous visitors ----------
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true); set local role anon;
    select count(*) into n from public.questions;
    out := out || (case when n = 546 then 'ok' else 'FAIL (' || n || ')' end || ' 02 anon reads exactly the published questions, no drafts');
    select (select count(*) from public.categories) + (select count(*) from public.videos) into n;
    out := out || (case when n = 40 then 'ok' else 'FAIL (' || n || ')' end || ' 03 anon reads categories and published videos');
  end;
  reset role;
  begin
    set local role anon; perform 1 from public.question_answers limit 1;
    out := out || 'FAIL 04 anon could read the answer key'::text;
  exception when insufficient_privilege then out := out || 'ok 04 anon cannot read the answer key'::text; end;
  reset role;
  begin
    set local role anon; perform public.submit_answer('s1', 2);
    out := out || 'FAIL 05 anon could submit an answer'::text;
  exception when insufficient_privilege then out := out || 'ok 05 anon cannot call submit_answer'::text; end;
  reset role;
  begin
    set local role anon; insert into public.questions (id, category_id, question, options, status) values ('hack', 'science', 'x', '["a","b"]', 'published');
    out := out || 'FAIL 06 anon could insert a question'::text;
  exception when insufficient_privilege then out := out || 'ok 06 anon cannot insert content'::text; end;
  reset role;

  -- ---------- user A: answering and XP ----------
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  begin
    set local role authenticated;
    select count(*) into n from public.question_answers;
    out := out || (case when n = 0 then 'ok' else 'FAIL (' || n || ' rows)' end || ' 07 signed-in user sees no rows of the answer key');

    r := public.submit_answer('s1', 2);
    out := out || (case when (r->>'correct')::boolean and (r->>'xp_earned')::int = 10 and r->>'explanation' is not null and (r->'stats'->>'xp')::int = 10 and (r->'stats'->>'streak_current')::int = 1 and (r->'stats'->>'today_answered')::int = 1
      then 'ok' else 'FAIL ' || r::text end || ' 08 correct first answer: 10 XP, explanation returned, streak 1');

    r := public.submit_answer('s1', 2);
    out := out || (case when r->>'attempt_type' = 'practice' and (r->>'xp_earned')::int = 0 and (r->'stats'->>'xp')::int = 10 and (r->'stats'->>'today_answered')::int = 1
      then 'ok' else 'FAIL ' || r::text end || ' 09 answering the same question again gives no XP (no farming)');

    r := public.submit_answer('s2', 0);
    out := out || (case when not (r->>'correct')::boolean and (r->>'xp_earned')::int = 0 and (r->>'review_box')::int = 0 and r->>'review_due' is not null and (r->>'correct_index')::int = 1
      then 'ok' else 'FAIL ' || r::text end || ' 10 wrong answer: 0 XP, review scheduled, correct option revealed');

    r := public.submit_answer('sm1', 1);
    out := out || (case when (r->>'xp_earned')::int = 5 then 'ok' else 'FAIL ' || r::text end || ' 11 true/false card: 5 XP');
    r := public.submit_answer('s7', 1);
    out := out || (case when (r->>'xp_earned')::int = 30 and (r->'stats'->>'xp')::int = 45 then 'ok' else 'FAIL ' || r::text end || ' 12 difficulty 3: 30 XP, total 45');

    r := public.submit_answer('s8', 1, 'feed', today + 30);
    out := out || (case when r->'stats'->>'today' = today::text then 'ok' else 'FAIL ' || r::text end || ' 13 a forward-dated client date is ignored');
  end;
  reset role;

  begin set local role authenticated; perform public.submit_answer('s3', 9); out := out || 'FAIL 14 invalid option accepted'::text;
  exception when others then out := out || 'ok 14 invalid option index is rejected'::text; end;
  reset role;
  begin set local role authenticated; perform public.submit_answer('test-draft', 0); out := out || 'FAIL 15 draft question answerable'::text;
  exception when others then out := out || 'ok 15 unpublished questions cannot be answered'::text; end;
  reset role;

  -- ---------- user A: cannot write score or content directly ----------
  begin set local role authenticated; update public.user_stats set streak_current = 999 where user_id = a; out := out || 'FAIL 16 user changed own streak'::text;
  exception when insufficient_privilege then out := out || 'ok 16 user cannot update user_stats'::text; end;
  reset role;
  begin set local role authenticated; insert into public.daily_activity (user_id, activity_date, xp_earned) values (a, today, 99999); out := out || 'FAIL 17 user inserted XP'::text;
  exception when insufficient_privilege then out := out || 'ok 17 user cannot insert XP into daily_activity'::text; end;
  reset role;
  begin set local role authenticated; update public.daily_activity set xp_earned = 99999 where user_id = a; out := out || 'FAIL 18 user updated XP'::text;
  exception when insufficient_privilege then out := out || 'ok 18 user cannot update XP'::text; end;
  reset role;
  begin set local role authenticated; insert into public.question_attempts (user_id, question_id, selected_index, is_correct, attempt_type, xp_earned, activity_date) values (a, 's3', 2, true, 'first', 10, today); out := out || 'FAIL 19 user inserted an attempt'::text;
  exception when insufficient_privilege then out := out || 'ok 19 user cannot insert attempts directly'::text; end;
  reset role;
  begin set local role authenticated; update public.profiles set is_admin = true where id = a; out := out || 'FAIL 20 user made themselves admin'::text;
  exception when insufficient_privilege then out := out || 'ok 20 user cannot set is_admin'::text; end;
  reset role;
  begin set local role authenticated; update public.profiles set is_premium = true where id = a; out := out || 'FAIL 21 user set premium'::text;
  exception when insufficient_privilege then out := out || 'ok 21 user cannot set is_premium'::text; end;
  reset role;
  begin
    set local role authenticated;
    update public.profiles set display_name = 'Alex', interests = '{science,history}', onboarded = true where id = a; get diagnostics n = row_count;
    out := out || (case when n = 1 then 'ok' else 'FAIL' end || ' 22 user can update own name, interests and onboarding');
    update public.questions set question = 'gehackt' where id = 's1'; get diagnostics n = row_count;
    out := out || (case when n = 0 then 'ok' else 'FAIL' end || ' 23 user cannot modify questions');
    update public.videos set verification_status = 'verified' where id = 'v-sonne'; get diagnostics n = row_count;
    out := out || (case when n = 0 then 'ok' else 'FAIL' end || ' 24 user cannot change video verification status');
    update public.question_answers set correct_index = 0; get diagnostics n = row_count;
    out := out || (case when n = 0 then 'ok' else 'FAIL' end || ' 25 user cannot modify the answer key');
  end;
  reset role;

  -- ---------- reviews, daily challenge, streak ----------
  update public.question_progress set review_due = now() - interval '1 minute' where user_id = a and question_id = 's2';
  begin
    set local role authenticated;
    r := public.submit_answer('s2', 1, 'review');
    out := out || (case when r->>'attempt_type' = 'review' and (r->>'xp_earned')::int = 5 and (r->>'review_box')::int = 1 and (r->>'successful_reviews')::int = 1
      then 'ok' else 'FAIL ' || r::text end || ' 26 due review answered correctly: 5 XP, moves to box 1');
  end;
  reset role;
  begin set local role authenticated; perform public.complete_daily_challenge(); out := out || 'FAIL 27 daily bonus without playing'::text;
  exception when others then out := out || 'ok 27 daily bonus is refused before five answers'::text; end;
  reset role;
  begin
    set local role authenticated;
    perform public.submit_answer('t1', 0, 'daily'); perform public.submit_answer('t2', 1, 'daily'); perform public.submit_answer('t3', 1, 'daily');
    perform public.submit_answer('h1', 1, 'daily'); perform public.submit_answer('h5', 2, 'daily');
    r := public.complete_daily_challenge();
    out := out || (case when (r->>'score')::int = 5 and (r->>'bonus_xp')::int = 30 and (r->'stats'->>'xp')::int = 160 then 'ok' else 'FAIL ' || r::text end || ' 28 daily challenge 5/5: +30 bonus, total 160 XP');
    r := public.complete_daily_challenge();
    out := out || (case when (r->>'bonus_xp')::int = 0 and (r->'stats'->>'xp')::int = 160 then 'ok' else 'FAIL ' || r::text end || ' 29 daily bonus is paid only once per day');
  end;
  reset role;
  select coalesce(sum(xp_earned), 0) into n from public.question_attempts where user_id = a;
  out := out || (case when n + 30 = (select sum(xp_earned) from public.daily_activity where user_id = a) then 'ok' else 'FAIL' end || ' 30 XP in daily_activity equals the sum of attempts plus bonus');

  update public.user_stats set streak_last_date = today - 1 where user_id = a;
  update public.daily_activity set activity_date = today - 1 where user_id = a;
  begin
    set local role authenticated;
    r := public.submit_answer('h9', 2);
    out := out || (case when (r->'stats'->>'streak_current')::int = 2 and (r->'stats'->>'today_answered')::int = 1 then 'ok' else 'FAIL ' || r::text end || ' 31 learning on the next day extends the streak to 2');
  end;
  reset role;
  update public.user_stats set streak_last_date = today - 3 where user_id = a;
  begin
    set local role authenticated;
    r := public.submit_answer('h2', 1, 'feed', today);
    out := out || (case when (r->'stats'->>'streak_current')::int = 1 and (r->'stats'->>'streak_best')::int = 2 then 'ok' else 'FAIL ' || r::text end || ' 32 a missed day resets the streak to 1, best stays 2');
  end;
  reset role;

  -- ---------- user B: isolation ----------
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  begin
    set local role authenticated;
    r := public.get_my_state();
    out := out || (case when (r->'stats'->>'xp')::int = 0 and jsonb_array_length(r->'progress') = 0 and r->'profile'->>'id' = b::text then 'ok' else 'FAIL ' || r::text end || ' 33 user B starts empty and gets only their own state');
    select (select count(*) from public.question_attempts) + (select count(*) from public.question_progress) + (select count(*) from public.daily_activity) + (select count(*) from public.user_stats where user_id = a) + (select count(*) from public.profiles where id = a) into n;
    out := out || (case when n = 0 then 'ok' else 'FAIL (' || n || ' rows)' end || ' 34 user B cannot read A''s attempts, progress, activity, stats or profile');
    update public.profiles set display_name = 'Übernommen' where id = a; get diagnostics n = row_count;
    out := out || (case when n = 0 then 'ok' else 'FAIL' end || ' 35 user B cannot edit A''s profile');
    insert into public.question_reactions (user_id, question_id, liked) values (b, 's1', true);
    insert into public.video_progress (user_id, video_id, plays, completions, liked, saved) values (b, 'v-sonne', 1, 1, true, true);
  end;
  reset role;
  select (select like_count from public.questions where id = 's1') + (select like_count from public.videos where id = 'v-sonne') into n;
  out := out || (case when n = 2 then 'ok' else 'FAIL (' || n || ')' end || ' 36 own likes are stored and counted on question and video');
  begin
    set local role authenticated; update public.question_reactions set liked = false where user_id = b and question_id = 's1';
  end;
  reset role;
  select like_count into n from public.questions where id = 's1';
  out := out || (case when n = 0 then 'ok' else 'FAIL (' || n || ')' end || ' 37 removing a like lowers the counter');
  begin set local role authenticated; insert into public.question_reactions (user_id, question_id, liked) values (a, 's2', true); out := out || 'FAIL 38 B wrote a reaction for A'::text;
  exception when insufficient_privilege then out := out || 'ok 38 user B cannot write reactions in A''s name'::text; end;
  reset role;
  begin
    set local role authenticated;
    r := public.get_my_state();
    out := out || (case when jsonb_array_length(r->'video_progress') = 1 and (r->'video_progress'->0->>'saved')::boolean then 'ok' else 'FAIL ' || r::text end || ' 39 saved and watched videos are restored from the server');
  end;
  reset role;

  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  begin
    set local role authenticated;
    r := public.get_my_state();
    select count(*) into n from jsonb_array_elements(r->'progress') p where p->>'correct_index' is not null and p->>'explanation' is not null;
    out := out || (case when n = 12 and jsonb_array_length(r->'progress') = 12 and r->'profile'->>'display_name' = 'Alex' and not (r->'profile' ? 'is_admin')
      then 'ok' else 'FAIL (' || n || ')' end || ' 40 state restore: 12 answered questions with revealed answers, profile without admin flag');
  end;
  reset role;

  -- ---------- account deletion ----------
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  begin set local role authenticated; perform public.delete_my_account(); end;
  reset role;
  select (select count(*) from auth.users where id = b) + (select count(*) from public.profiles where id = b) + (select count(*) from public.video_progress where user_id = b) into n;
  out := out || (case when n = 0 then 'ok' else 'FAIL (' || n || ')' end || ' 41 delete_my_account removes the user and all their rows');
  select count(*) into n from auth.users where id = a;
  out := out || (case when n = 1 then 'ok' else 'FAIL' end || ' 42 deleting one account leaves other users untouched');

  -- ---------- languages ----------
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  begin
    set local role authenticated;
    r := public.submit_answer('c1', 2, 'feed', null, 'en');
    out := out || (case when r->>'explanation' like 'Leonardo painted%' then 'ok' else 'FAIL ' || r::text end || ' 46 explanation is returned in the requested language');
    r := public.submit_answer('c2', 1, 'feed', null, 'fr');
    out := out || (case when r->>'explanation' like 'Goethes%' then 'ok' else 'FAIL ' || r::text end || ' 47 unknown language falls back to the original text');
    r := public.get_my_state(null, 'en');
    select count(*) into n from jsonb_array_elements(r->'progress') p where p->>'question_id' = 's1' and p->>'explanation' like 'Au comes from%';
    out := out || (case when n = 1 then 'ok' else 'FAIL' end || ' 48 restored state uses the requested language');
    update public.profiles set locale = 'en', age_band = '10-12' where id = a; get diagnostics n = row_count;
    out := out || (case when n = 1 then 'ok' else 'FAIL' end || ' 49 user can set own language and age band');
  end;
  reset role;

  -- ---------- content administration ----------
  update public.profiles set is_admin = true where id = a;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  begin
    set local role authenticated;
    update public.questions set tags = '{geprueft}' where id = 's1'; get diagnostics n = row_count;
    out := out || (case when n = 1 and public.is_admin() then 'ok' else 'FAIL' end || ' 43 an admin can edit content');
    select count(*) into n from public.questions where id = 'test-draft';
    out := out || (case when n = 1 then 'ok' else 'FAIL' end || ' 44 an admin can see drafts');
    update public.question_answers set explanation = explanation where question_id = 's1'; get diagnostics n = row_count;
    out := out || (case when n = 1 then 'ok' else 'FAIL' end || ' 45 an admin can maintain the answer key');
  end;
  reset role;

  -- ---------- content review: reports and admin decisions ----------
  declare
    u uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
    s text;
  begin
    insert into auth.users (id, aud, role, email) select x, 'authenticated', 'authenticated', 'r-' || x || '@test.invalid' from unnest(u) x;
    -- three active learners (5 answered questions each), one throw-away account
    insert into public.daily_activity (user_id, activity_date, answered_count) select x, today, 5 from unnest(u[1:3]) x;
    insert into public.question_reactions (user_id, question_id, reported) values (u[4], 's5', true), (u[1], 's5', true), (u[2], 's5', true);
    select status into s from public.questions where id = 's5';
    out := out || (case when s = 'published' then 'ok' else 'FAIL (' || s || ')' end || ' 50 two valid reports (plus one from an inactive account) leave a question online');
    insert into public.question_reactions (user_id, question_id, reported) values (u[3], 's5', true);
    select status into s from public.questions where id = 's5';
    select report_count into n from public.questions where id = 's5';
    out := out || (case when s = 'review' and n = 3 then 'ok' else 'FAIL (' || s || ', ' || n || ')' end || ' 51 the third valid report moves the question to review');
    perform set_config('request.jwt.claims', '{"role":"anon"}', true); set local role anon;
    select count(*) into n from public.questions where id = 's5';
    reset role;
    out := out || (case when n = 0 then 'ok' else 'FAIL' end || ' 52 a question under review is no longer visible in the app');

    insert into public.video_progress (user_id, video_id, reported) select x, 'v-sonne', true from unnest(u[1:3]) x;
    select status into s from public.videos where id = 'v-sonne';
    out := out || (case when s = 'review' then 'ok' else 'FAIL (' || s || ')' end || ' 53 three valid reports move a clip to review');

    perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
    begin set local role authenticated; perform public.admin_review('question', 's5', 'approve'); out := out || 'FAIL 54 a normal user decided a review'::text;
    exception when insufficient_privilege then out := out || 'ok 54 only admins can decide a review'::text; end;
    reset role;

    perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
    set local role authenticated;
    perform public.admin_review('question', 's5', 'approve', 'geprüft');
    perform public.admin_review('video', 'v-sonne', 'withdraw', 'zurückgezogen');
    reset role;
    select status || '/' || verification_status || '/' || report_count into s from public.questions where id = 's5';
    out := out || (case when s = 'published/verified/0' then 'ok' else 'FAIL (' || s || ')' end || ' 55 approving puts the question back online as verified and clears the reports');
    select status into s from public.videos where id = 'v-sonne';
    out := out || (case when s = 'archived' then 'ok' else 'FAIL (' || s || ')' end || ' 56 withdrawing takes the clip offline for good');
    begin
      update public.questions set verification_status = 'unverified' where id = 's6';
      out := out || 'FAIL 57 unchecked content could stay published'::text;
    exception when check_violation then out := out || 'ok 57 published content can never be unchecked'::text; end;
  end;

  raise exception E'TEST RESULTS (everything rolled back)\n%', array_to_string(out, E'\n');
end $$;
