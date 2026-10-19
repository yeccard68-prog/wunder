-- Name filter and resolving duel reports (20261024110000_name_filter.sql). Always rolled back; the message lists the checks.
do $$
declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); out text[] := '{}'; n text; c int;
begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'a-' || a || '@test.invalid'), (b, 'authenticated', 'authenticated', 'b-' || b || '@test.invalid');
  update public.profiles set display_name = 'Big D1ck' where id = a;
  select display_name into n from public.profiles where id = a;
  out := array_append(out, case when n = 'Neugierig' then 'ok' else 'FAIL ' || n end || ' 1 offensive name replaced');
  update public.profiles set display_name = 'Dickens', is_admin = false where id = a;
  select display_name into n from public.profiles where id = a;
  out := array_append(out, case when n = 'Dickens' then 'ok' else 'FAIL ' || n end || ' 2 harmless name kept');
  insert into public.duel_reports (reporter, reported, reason) values (b, a, 'name');
  update public.profiles set is_admin = true where id = b;
  set local role authenticated;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into c from public.admin_duel_reports() r where r.reported = a;
  out := array_append(out, case when c = 1 then 'ok' else 'FAIL' end || ' 3 report listed');
  perform public.admin_resolve_reports(a, true);
  select count(*) into c from public.admin_duel_reports() r where r.reported = a;
  out := array_append(out, case when c = 0 then 'ok' else 'FAIL' end || ' 4 resolved report gone');
  reset role;
  select display_name into n from public.profiles where id = a;
  out := array_append(out, case when n = 'Neugierig' then 'ok' else 'FAIL ' || n end || ' 5 name reset');
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin perform public.admin_resolve_reports(b, true); out := array_append(out, 'FAIL 6'); exception when others then out := array_append(out, 'ok 6 non-admin refused'); end;
  raise exception E'NAME TESTS (rolled back):\n%', array_to_string(out, E'\n');
end $$;
