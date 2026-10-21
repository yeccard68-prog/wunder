-- Feature switches: chat and groups are off at launch, enforced on the server; only editors switch them.
-- Everything is rolled back.
do $$
declare a uuid; out text[] := '{}'; f jsonb;
begin
  select id into a from public.profiles where age_band = '16+' order by created_at desc limit 1;
  update private.app_flags set on_ = false; -- the launch state, whatever is set live
  set local role authenticated;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  f := public.app_flags();
  out := array_append(out, case when f = '{"chat": false, "groups": false}'::jsonb then 'ok' else 'FAIL ' || f::text end || ' 1 both switches readable, both off');
  begin perform public.group_create('Testgruppe'); out := array_append(out, 'FAIL 2'); exception when others then out := array_append(out, 'ok 2 no new groups while off'); end;
  begin perform public.group_join('ABCDEF'); out := array_append(out, 'FAIL 3'); exception when others then out := array_append(out, 'ok 3 no joining while off'); end;
  begin perform public.admin_set_flag('chat', true); out := array_append(out, 'FAIL 4'); exception when others then out := array_append(out, 'ok 4 only editors switch'); end;
  begin perform public.admin_overview(14); out := array_append(out, 'FAIL 5'); exception when others then out := array_append(out, 'ok 5 overview for editors only'); end;
  reset role;
  update private.app_flags set on_ = true where key = 'groups';
  set local role authenticated;
  out := array_append(out, case when (public.group_create('Testgruppe') ->> 'id') is not null then 'ok' else 'FAIL' end || ' 6 groups work again when switched on');
  raise exception '%', array_to_string(out, E'\n');
end $$;
