-- Computer duels, groups, group rounds and chat, run against the real database. Everything is rolled back:
-- the block always ends with an exception whose message lists the checks ("ok …" or "FAIL …").
do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid(); y uuid := gen_random_uuid(); k uuid := gen_random_uuid();
  out text[] := '{}';
  s jsonb; r jsonb; g uuid; v_round uuid; v_duel uuid; v_code text; v_msg bigint; n int; i int; v_plain boolean;
begin
  insert into auth.users (id, aud, role, email) values
    (a, 'authenticated', 'authenticated', 'a-' || a || '@test.invalid'),
    (b, 'authenticated', 'authenticated', 'b-' || b || '@test.invalid'),
    (c, 'authenticated', 'authenticated', 'c-' || c || '@test.invalid'),
    (y, 'authenticated', 'authenticated', 'y-' || y || '@test.invalid'),
    (k, 'authenticated', 'authenticated', 'k-' || k || '@test.invalid');
  update public.profiles set display_name = 'Anna', age_band = '16+' where id = a;
  update public.profiles set display_name = 'Ben', age_band = '16+' where id = b;
  update public.profiles set display_name = 'Cleo', age_band = '16+' where id = c;
  update public.profiles set display_name = 'Yus', age_band = '13-15' where id = y;
  update public.profiles set display_name = 'Kim', age_band = '10-12' where id = k;
  v_plain := private.chat_text_allowed('eine gerade Linie, 2024 waren es 15 Fragen');
  update private.app_flags set on_ = true; -- chat and groups are off at launch; this test needs them on (rolled back)
  set local role authenticated;

  -- computer duel
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  r := public.duel_create_bot(2); v_duel := (r->>'id')::uuid;
  s := public.duel_state(v_duel, 'de');
  out := array_append(out, case when s->>'kind' = 'bot' and (s->>'level')::int = 2 and (s->'opponent'->>'joined')::boolean and s->'next'->>'action' = 'pick' then 'ok' else 'FAIL ' || s::text end || ' 01 computer duel starts with my pick');
  for i in 1..3 loop
    s := public.duel_state(v_duel, 'de');
    if s->'next'->>'action' = 'pick' then perform public.duel_pick(v_duel, s->'rounds'->(i - 1)->'offered'->>0); end if;
    for n in 0..2 loop perform public.duel_question(v_duel, i, n, 'de'); perform public.duel_answer(v_duel, i, n, 0); end loop;
  end loop;
  s := public.duel_state(v_duel, 'de');
  out := array_append(out, case when s->>'status' = 'finished' and s->>'result' in ('win', 'loss', 'draw') and (select sum(jsonb_array_length(x->'theirs')) from jsonb_array_elements(s->'rounds') x) = 9 then 'ok' else 'FAIL ' || s::text end || ' 02 the computer plays all its answers and the duel ends with a result');
  begin perform public.duel_create_bot(4); out := array_append(out, 'FAIL 03'); exception when others then out := array_append(out, 'ok 03 only levels 1 to 3'); end;
  begin perform public.chat_send(v_duel, null, 'Hallo Computer'); out := array_append(out, 'FAIL 04'); exception when others then out := array_append(out, 'ok 04 no chat with the computer'); end;

  -- groups
  begin perform public.group_create('Arschloch-Runde'); out := array_append(out, 'FAIL 05'); exception when others then out := array_append(out, 'ok 05 offensive group names are refused'); end;
  r := public.group_create('  Quizfreunde '); g := (r->>'id')::uuid; v_code := r->>'code';
  s := public.group_state(g);
  out := array_append(out, case when s->>'name' = 'Quizfreunde' and (s->>'owner')::boolean and jsonb_array_length(s->'members') = 1 then 'ok' else 'FAIL ' || s::text end || ' 06 a new group has its owner as the only member');
  perform set_config('request.jwt.claims', jsonb_build_object('sub', k, 'role', 'authenticated')::text, true);
  begin perform public.group_join(v_code); out := array_append(out, 'FAIL 07'); exception when others then out := array_append(out, 'ok 07 children under 13 cannot join groups'); end;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', c, 'role', 'authenticated')::text, true);
  begin perform public.group_state(g); out := array_append(out, 'FAIL 08'); exception when others then out := array_append(out, 'ok 08 non-members see nothing'); end;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  out := array_append(out, case when public.group_join(lower(v_code)) = g and public.group_join(v_code) = g then 'ok' else 'FAIL' end || ' 09 joining with the code works (twice is harmless)');
  perform set_config('request.jwt.claims', jsonb_build_object('sub', y, 'role', 'authenticated')::text, true);
  perform public.group_join(v_code);
  s := public.group_state(g);
  out := array_append(out, case when jsonb_array_length(s->'members') = 3 and (select count(*) from jsonb_array_elements(s->'members') m where m->>'name' = 'Yus') = 0 then 'ok' else 'FAIL ' || (s->'members')::text end || ' 10 three members; a 13-15 player never shows a name');

  -- group round
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  v_round := public.group_round_start(g);
  begin perform public.group_round_start(g); out := array_append(out, 'FAIL 11'); exception when others then out := array_append(out, 'ok 11 only one running round per group'); end;
  perform public.group_round_answer(v_round, 0, 0);
  reset role; n := (select count(*) from public.group_answers where round_id = v_round and player = a and idx = 0 and selected is null); set local role authenticated;
  out := array_append(out, case when n = 1 then 'ok' else 'FAIL' end || ' 12 an answer to a question never opened counts as no answer');
  r := public.group_round_question(v_round, 1, 'en');
  out := array_append(out, case when not (r->'question' ? 'correctIndex') and (r->>'secondsLeft')::numeric > 19 then 'ok' else 'FAIL ' || r::text end || ' 13 questions come without the answer key, with 20 seconds');
  begin perform public.group_round_question(v_round, 3, 'de'); out := array_append(out, 'FAIL 14'); exception when others then out := array_append(out, 'ok 14 questions in order only'); end;
  s := public.group_state(g);
  out := array_append(out, case when s->'rounds'->0->'ranking' = 'null'::jsonb then 'ok' else 'FAIL' end || ' 15 no ranking before I have played');
  for n in 1..5 loop if n > 1 then perform public.group_round_question(v_round, n, 'de'); end if; perform public.group_round_answer(v_round, n, 0); end loop;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  for n in 0..5 loop perform public.group_round_question(v_round, n, 'de'); perform public.group_round_answer(v_round, n, 1); end loop;
  s := public.group_state(g);
  out := array_append(out, case when jsonb_array_length(s->'rounds'->0->'ranking') = 2 and (s->'rounds'->0->>'played')::int = 6 and (s->'rounds'->0->>'players')::int = 2 then 'ok' else 'FAIL ' || (s->'rounds')::text end || ' 16 after playing: ranking of everyone who played');
  out := array_append(out, case when (public.my_groups()->0->>'openRound')::boolean = false and (public.my_groups()->0->>'members')::int = 3 then 'ok' else 'FAIL' end || ' 17 my groups: nothing left to play for me');

  -- chat
  perform set_config('request.jwt.claims', jsonb_build_object('sub', y, 'role', 'authenticated')::text, true);
  out := array_append(out, case when (public.chat_list(null, g)->>'allowed')::boolean = false then 'ok' else 'FAIL' end || ' 18 players under 16 do not get the group chat');
  begin perform public.chat_send(null, g, 'Hi'); out := array_append(out, 'FAIL 19'); exception when others then out := array_append(out, 'ok 19 and cannot write in it'); end;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  r := public.chat_send(null, g, '  Wer hat   gewonnen?  '); v_msg := (r->>'id')::bigint;
  out := array_append(out, case when r->>'body' = 'Wer hat gewonnen?' then 'ok' else 'FAIL ' || r::text end || ' 20 a message is sent and tidied');
  begin perform public.chat_send(null, g, 'du arschloch'); out := array_append(out, 'FAIL 21'); exception when others then out := array_append(out, 'ok 21 insults are refused'); end;
  begin perform public.chat_send(null, g, 'schau auf beispiel.com'); out := array_append(out, 'FAIL 22'); exception when others then out := array_append(out, 'ok 22 links are refused'); end;
  begin perform public.chat_send(null, g, 'ruf an: 0171 234 5678'); out := array_append(out, 'FAIL 23'); exception when others then out := array_append(out, 'ok 23 phone numbers are refused'); end;
  begin perform public.chat_send(null, g, 'mail an x@y.de'); out := array_append(out, 'FAIL 24'); exception when others then out := array_append(out, 'ok 24 e-mail addresses are refused'); end;
  out := array_append(out, case when v_plain then 'ok' else 'FAIL' end || ' 25 normal sentences pass (no matches across word borders)');
  begin perform public.chat_send(null, g, repeat('a', 501)); out := array_append(out, 'FAIL 26'); exception when others then out := array_append(out, 'ok 26 at most 500 characters'); end;
  for n in 1..4 loop perform public.chat_send(null, g, 'Nachricht ' || n); end loop;
  begin perform public.chat_send(null, g, 'eine zu viel'); out := array_append(out, 'FAIL 27'); exception when others then out := array_append(out, 'ok 27 at most 5 messages in 30 seconds'); end;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  s := public.chat_list(null, g, 0);
  out := array_append(out, case when jsonb_array_length(s->'messages') = 5 and s->'messages'->0->>'name' = 'Anna' and not (s->'messages'->0->>'mine')::boolean and not (s->'messages'->0 ? 'author') then 'ok' else 'FAIL ' || s::text end || ' 28 members see the messages with name, never the account id');
  out := array_append(out, case when jsonb_array_length(public.chat_list(null, g, v_msg)->'messages') = 4 then 'ok' else 'FAIL' end || ' 29 polling returns only newer messages');
  perform public.chat_report(v_msg, 'insult');
  out := array_append(out, case when jsonb_array_length(public.chat_list(null, g, 0)->'messages') = 4 then 'ok' else 'FAIL' end || ' 30 a reported message disappears for the reporter');
  perform public.chat_report(v_msg + 1, 'spam', true);
  out := array_append(out, case when jsonb_array_length(public.chat_list(null, g, 0)->'messages') = 0 then 'ok' else 'FAIL' end || ' 31 blocking hides all messages of that author');
  perform set_config('request.jwt.claims', jsonb_build_object('sub', c, 'role', 'authenticated')::text, true);
  begin perform public.chat_report(v_msg, 'insult'); out := array_append(out, 'FAIL 32'); exception when others then out := array_append(out, 'ok 32 non-members cannot report'); end;
  out := array_append(out, case when (public.chat_list(null, g)->>'allowed')::boolean = false then 'ok' else 'FAIL' end || ' 33 non-members do not get the chat');
  begin perform public.admin_chat_reports(); out := array_append(out, 'FAIL 34'); exception when others then out := array_append(out, 'ok 34 the report list is for editors only'); end;

  -- duel chat between people, and leaving
  perform set_config('request.jwt.claims', jsonb_build_object('sub', c, 'role', 'authenticated')::text, true);
  r := public.duel_create('invite'); v_duel := (r->>'id')::uuid;
  begin perform public.chat_send(v_duel, null, 'Hallo?'); out := array_append(out, 'FAIL 35'); exception when others then out := array_append(out, 'ok 35 no chat before the opponent joined'); end;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.duel_join(r->>'code');
  perform public.chat_send(v_duel, null, 'Viel Glück!');
  perform set_config('request.jwt.claims', jsonb_build_object('sub', c, 'role', 'authenticated')::text, true);
  out := array_append(out, case when public.chat_list(v_duel, null)->'messages'->0->>'body' = 'Viel Glück!' then 'ok' else 'FAIL' end || ' 36 duel chat between two players aged 16+');
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.group_leave(g);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  s := public.group_state(g);
  out := array_append(out, case when (s->>'owner')::boolean and jsonb_array_length(s->'members') = 2 then 'ok' else 'FAIL ' || s::text end || ' 37 when the owner leaves, the oldest member takes over');
  perform public.group_remove_member(g, y);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', y, 'role', 'authenticated')::text, true);
  begin perform public.group_state(g); out := array_append(out, 'FAIL 38'); exception when others then out := array_append(out, 'ok 38 the owner can remove a member'); end;

  raise exception '%', array_to_string(out, E'\n');
end $$;
