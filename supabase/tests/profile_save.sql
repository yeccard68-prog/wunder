-- Saving the own profile as a signed-in user, with the role switched BEFORE any profile trigger has run in
-- this transaction (a trigger run as postgres first would cache its plan and hide missing rights – that hid
-- the broken name trigger on 19.10.2026). Uses an existing profile; everything is rolled back.
do $$
declare a uuid; out text[] := '{}'; n text; o boolean;
begin
  select id into a from public.profiles order by created_at desc limit 1;
  set local role authenticated;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a, 'role', 'authenticated')::text, true);
  update public.profiles set display_name = 'Anna', onboarded = true, age_band = '16+' where id = a;
  select display_name, onboarded into n, o from public.profiles where id = a;
  out := array_append(out, case when n = 'Anna' and o then 'ok' else 'FAIL' end || ' 1 a signed-in user can save their profile');
  update public.profiles set display_name = 'Arsch Loch' where id = a;
  select display_name into n from public.profiles where id = a;
  out := array_append(out, case when n = 'Neugierig' then 'ok' else 'FAIL ' || n end || ' 2 an offensive name is still replaced');
  update public.profiles set display_name = 'Dickens' where id = a;
  select display_name into n from public.profiles where id = a;
  out := array_append(out, case when n = 'Dickens' then 'ok' else 'FAIL ' || n end || ' 3 harmless names stay');
  raise exception '%', array_to_string(out, E'\n');
end $$;
