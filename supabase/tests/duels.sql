-- Duel rules, run against the real database. Everything is rolled back: the block always ends with an
-- exception whose message lists the checks ("ok …" or "FAIL …").
do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid(); k uuid := gen_random_uuid();
  out text[] := '{}';
  s jsonb; r jsonb; v_id uuid; v_id2 uuid; v_code text; v_cat text; n int;
begin
  insert into auth.users (id, aud, role, email) values
    (a, 'authenticated', 'authenticated', 'a-' || a || '@test.invalid'),
    (b, 'authenticated', 'authenticated', 'b-' || b || '@test.invalid'),
    (c, 'authenticated', 'authenticated', 'c-' || c || '@test.invalid'),
    (k, 'authenticated', 'authenticated', 'k-' || k || '@test.invalid');
  update public.profiles set display_name = 'Anna' where id = a;
  update public.profiles set display_name = 'Ben', age_band = '13-15' where id = b;
  update public.profiles set display_name = 'Cleo', is_private = true where id = c;
  update public.profiles set display_name = 'Kim', age_band = '10-12' where id = k;
  set local role authenticated;

  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  r := public.duel_create('random'); v_id := (r->>'id')::uuid;
  out := array_append(out, case when (r->>'joined')::boolean = false then 'ok' else 'FAIL' end || ' 01 first random duel waits');
  s := public.duel_state(v_id, 'de');
  out := array_append(out, case when s->'next'->>'action' = 'pick' and (s->'next'->>'mine')::boolean and jsonb_array_length(s->'rounds'->0->'offered') = 3 and s->'rounds'->0->'questions' = 'null'::jsonb then 'ok' else 'FAIL ' || (s->'next')::text end || ' 02 A picks first from three topics, no questions yet');
  begin perform public.duel_answer(v_id, 1, 0, 0); out := array_append(out, 'FAIL 03'); exception when others then out := array_append(out, 'ok 03 answering before picking is refused'); end;
  v_cat := s->'rounds'->0->'offered'->>0;
  begin perform public.duel_pick(v_id, 'nonexistent'); out := array_append(out, 'FAIL 04'); exception when others then out := array_append(out, 'ok 04 a topic that was not offered is refused'); end;
  perform public.duel_pick(v_id, v_cat);
  s := public.duel_state(v_id, 'en');
  out := array_append(out, case when jsonb_array_length(s->'rounds'->0->'questions') = 3 and s->'next'->>'action' = 'answer' and not (s->'rounds'->0->'questions'->0 ? 'correctIndex') then 'ok' else 'FAIL' end || ' 05 three questions, without the answer key');
  begin perform public.duel_answer(v_id, 1, 2, 0); out := array_append(out, 'FAIL 06'); exception when others then out := array_append(out, 'ok 06 questions must be answered in order'); end;
  r := public.duel_answer(v_id, 1, 0, 0); perform public.duel_answer(v_id, 1, 1, null); perform public.duel_answer(v_id, 1, 2, 1);
  out := array_append(out, case when r ? 'correctIndex' and r ? 'explanation' then 'ok' else 'FAIL' end || ' 07 an answer reveals the solution');
  s := public.duel_state(v_id, 'de');
  out := array_append(out, case when s->'next'->>'action' = 'join' and not (s->'next'->>'mine')::boolean then 'ok' else 'FAIL ' || (s->'next')::text end || ' 08 then A waits for an opponent');

  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  r := public.duel_create('random');
  out := array_append(out, case when (r->>'id')::uuid = v_id and (r->>'joined')::boolean then 'ok' else 'FAIL' end || ' 09 second random player joins the waiting duel');
  s := public.duel_state(v_id, 'de');
  out := array_append(out, case when s->'rounds'->0->'theirs' = 'null'::jsonb and (s->'score'->>'theirs')::int = 0 and s->'opponent'->>'name' = 'Anna' and jsonb_array_length(s->'rounds'->0->'questions') = 3 then 'ok' else 'FAIL ' || s::text end || ' 10 B sees the questions but not yet A''s answers');
  perform public.duel_answer(v_id, 1, 0, 1); perform public.duel_answer(v_id, 1, 1, 1); perform public.duel_answer(v_id, 1, 2, 1);
  s := public.duel_state(v_id, 'de');
  out := array_append(out, case when jsonb_array_length(s->'rounds'->0->'theirs') = 3 and s->'next'->>'action' = 'pick' and (s->'next'->>'round')::int = 2 and s->'rounds'->1->'offered' <> 'null'::jsonb then 'ok' else 'FAIL ' || (s->'next')::text end || ' 11 after the round B sees A''s answers and picks round 2');
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  begin perform public.duel_pick(v_id, v_cat); out := array_append(out, 'FAIL 12'); exception when others then out := array_append(out, 'ok 12 A cannot pick for B'); end;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  s := public.duel_state(v_id, 'de');
  perform public.duel_pick(v_id, s->'rounds'->1->'offered'->>0);
  perform public.duel_answer(v_id, 2, 0, 0); perform public.duel_answer(v_id, 2, 1, 0); perform public.duel_answer(v_id, 2, 2, 0);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  s := public.duel_state(v_id, 'de');
  out := array_append(out, case when s->'rounds'->1->'theirs' = 'null'::jsonb and s->'next'->>'action' = 'answer' and (s->'next'->>'round')::int = 2 and (s->'next'->>'mine')::boolean then 'ok' else 'FAIL ' || (s->'next')::text end || ' 13 A answers round 2 without seeing B''s answers first');
  perform public.duel_answer(v_id, 2, 0, 2); perform public.duel_answer(v_id, 2, 1, 2); perform public.duel_answer(v_id, 2, 2, 2);
  s := public.duel_state(v_id, 'de');
  perform public.duel_pick(v_id, s->'rounds'->2->'offered'->>0);
  perform public.duel_answer(v_id, 3, 0, 0); perform public.duel_answer(v_id, 3, 1, 1); perform public.duel_answer(v_id, 3, 2, 2);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.duel_answer(v_id, 3, 0, 3); perform public.duel_answer(v_id, 3, 1, 0); perform public.duel_answer(v_id, 3, 2, 1);
  s := public.duel_state(v_id, 'de');
  out := array_append(out, case when s->>'status' = 'finished' and s->>'result' in ('win', 'loss', 'draw') and s->'next'->>'action' = 'done' then 'ok' else 'FAIL ' || s::text end || ' 14 after nine questions each the duel is finished');
  select count(distinct x->'questions'->0->>'id') into n from jsonb_array_elements(s->'rounds') x;
  out := array_append(out, case when n = 3 then 'ok' else 'FAIL' end || ' 15 three rounds with different questions');
  r := public.my_duels();
  out := array_append(out, case when jsonb_array_length(r) = 1 and r->0->>'result' = s->>'result' then 'ok' else 'FAIL ' || r::text end || ' 16 the duel list shows the result');

  perform set_config('request.jwt.claims', jsonb_build_object('sub', c, 'role', 'authenticated')::text, true);
  begin perform public.duel_state(v_id, 'de'); out := array_append(out, 'FAIL 17'); exception when others then out := array_append(out, 'ok 17 an outsider cannot see the duel'); end;
  select count(*) into n from public.duels;
  out := array_append(out, case when n = 0 then 'ok' else 'FAIL (' || n || ')' end || ' 18 the tables cannot be read directly');

  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  r := public.duel_create('invite'); v_id2 := (r->>'id')::uuid; v_code := r->>'code';
  perform set_config('request.jwt.claims', jsonb_build_object('sub', c, 'role', 'authenticated')::text, true);
  out := array_append(out, case when public.duel_join(lower(v_code)) = v_id2 then 'ok' else 'FAIL' end || ' 19 joining by code (any case)');
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  s := public.duel_state(v_id2, 'de');
  out := array_append(out, case when s->'opponent'->>'name' is null and (s->'opponent'->>'joined')::boolean then 'ok' else 'FAIL' end || ' 20 a private profile shows no name');
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  begin perform public.duel_join(v_code); out := array_append(out, 'FAIL 21'); exception when others then out := array_append(out, 'ok 21 a full duel cannot be joined'); end;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', c, 'role', 'authenticated')::text, true);
  perform public.duel_decline(v_id2);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  s := public.duel_state(v_id2, 'de');
  out := array_append(out, case when s->>'status' = 'declined' and s->'result' = 'null'::jsonb then 'ok' else 'FAIL' end || ' 22 declined: no winner');

  v_id2 := public.duel_rematch(v_id);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.duel_resign(v_id2);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  s := public.duel_state(v_id2, 'de');
  out := array_append(out, case when s->>'result' = 'win' and s->>'forfeit' = 'them' then 'ok' else 'FAIL ' || s::text end || ' 23 rematch; giving up counts as a loss');

  perform public.duel_report(v_id, 'name');
  r := public.duel_create('random'); v_id2 := (r->>'id')::uuid;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  r := public.duel_create('random');
  out := array_append(out, case when (r->>'id')::uuid <> v_id2 and not (r->>'joined')::boolean then 'ok' else 'FAIL' end || ' 24 a reported player is not matched again');

  reset role;
  update public.duels set created_at = now() - interval '4 days' where id = (r->>'id')::uuid;
  update public.duels set player_b = c, status = 'active', updated_at = now() - interval '8 days' where id = v_id2;
  set local role authenticated;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', c, 'role', 'authenticated')::text, true);
  s := public.duel_state(v_id2, 'de');
  out := array_append(out, case when s->>'status' = 'finished' and s->>'result' = 'win' then 'ok' else 'FAIL ' || (s->>'status') || '/' || coalesce(s->>'result', '-') end || ' 25 seven days without a move: the player to move loses');
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  r := public.my_duels();
  select count(*) into n from jsonb_array_elements(r) x where x->>'status' = 'expired';
  out := array_append(out, case when n = 1 then 'ok' else 'FAIL (' || n || ')' end || ' 26 a random duel nobody joined expires after three days');

  -- age rules (20261023110000_duels_age.sql)
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  s := public.duel_state(v_id, 'de');
  out := array_append(out, case when s->'opponent'->>'name' is null then 'ok' else 'FAIL' end || ' 27 a player under 16 shows no name');
  r := public.duel_create('invite'); v_code := r->>'code';
  perform set_config('request.jwt.claims', jsonb_build_object('sub', k, 'role', 'authenticated')::text, true);
  begin perform public.duel_create('invite'); out := array_append(out, 'FAIL 28'); exception when others then out := array_append(out, 'ok 28 a child under 13 cannot start a duel'); end;
  begin perform public.duel_join(v_code); out := array_append(out, 'FAIL 29'); exception when others then out := array_append(out, 'ok 29 nor join one by code'); end;
  reset role;
  select count(*) into n from public.duel_rounds x cross join unnest(x.question_ids) as u (id) join public.questions q on q.id = u.id
    where x.duel_id = v_id and (q.min_age > 13 or q.max_age is not null);
  out := array_append(out, case when n = 0 then 'ok' else 'FAIL (' || n || ')' end || ' 30 duel questions suit everyone from 13 up');

  raise exception E'DUEL TESTS (rolled back):\n%', array_to_string(out, E'\n');
end $$;
