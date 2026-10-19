-- "Hinweis an die Redaktion": send, filter, once per card and reason, daily limit, editors only.
-- Role switched before anything else runs as postgres in this transaction; everything is rolled back.
do $$
declare a uuid; out text[] := '{}'; n int;
begin
  select id into a from public.profiles order by created_at desc limit 1;
  set local role authenticated;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.content_hint_send('fact', 'f-lego-name', 'error', 'Die Jahreszahl stimmt nicht', 'de');
  perform public.content_hint_send('fact', 'f-lego-name', 'error', null, 'de');
  reset role; n := (select count(*) from public.content_hints where author = a and content_id = 'f-lego-name'); set local role authenticated;
  out := array_append(out, case when n = 1 then 'ok' else 'FAIL ' || n end || ' 1 a hint is stored once per card and reason (sending again does not duplicate or erase the note)');
  begin perform public.content_hint_send('fact', 'f-lego-name', 'source', 'schau auf beispiel.com', 'de'); out := array_append(out, 'FAIL 2'); exception when others then out := array_append(out, 'ok 2 notes with links are refused'); end;
  begin perform public.content_hint_send('fact', 'f-lego-name', 'nonsense', null, 'de'); out := array_append(out, 'FAIL 3'); exception when others then out := array_append(out, 'ok 3 only known reasons'); end;
  begin perform public.content_hint_send('chat', 'x', 'error', null, 'de'); out := array_append(out, 'FAIL 4'); exception when others then out := array_append(out, 'ok 4 only known content kinds'); end;
  for n in 1..19 loop perform public.content_hint_send('question', 'q' || n, 'idea', null, 'de'); end loop;
  begin perform public.content_hint_send('question', 'q99', 'idea', null, 'de'); out := array_append(out, 'FAIL 5'); exception when others then out := array_append(out, 'ok 5 at most 20 hints a day'); end;
  begin perform public.admin_content_hints(); out := array_append(out, 'FAIL 6'); exception when others then out := array_append(out, 'ok 6 hints are for editors only'); end;
  begin perform 1 from public.content_hints limit 1; out := array_append(out, case when (select count(*) from public.content_hints) = 0 then 'ok 7 players cannot read the table' else 'FAIL 7' end); exception when others then out := array_append(out, 'ok 7 players cannot read the table'); end;
  raise exception '%', array_to_string(out, E'\n');
end $$;
