-- "Wie hast du von uns gehört?": players set only this column, only values from the list; totals for editors.
-- The role is switched before any profile trigger runs (see profile_save.sql). Everything is rolled back.
do $$
declare a uuid; out text[] := '{}'; h text;
begin
  select id into a from public.profiles order by created_at desc limit 1;
  set local role authenticated;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  update public.profiles set heard_from = 'tiktok', display_name = 'Anna' where id = a;
  select heard_from into h from public.profiles where id = a;
  out := array_append(out, case when h = 'tiktok' then 'ok' else 'FAIL' end || ' 1 a player can save where they heard of the app');
  begin update public.profiles set heard_from = 'meine Adresse ist ...' where id = a; out := array_append(out, 'FAIL 2'); exception when others then out := array_append(out, 'ok 2 only answers from the list'); end;
  begin perform public.admin_heard_from(); out := array_append(out, 'FAIL 3'); exception when others then out := array_append(out, 'ok 3 totals for editors only'); end;
  begin update public.profiles set is_admin = true where id = a; out := array_append(out, 'FAIL 4 is_admin writable!'); exception when others then out := array_append(out, 'ok 4 other columns stay locked'); end;
  raise exception '%', array_to_string(out, E'\n');
end $$;
