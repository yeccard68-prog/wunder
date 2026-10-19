-- Fix (19.10.2026, live 07:24–14:11 UTC broken): the name trigger runs with the rights of the signed-in user,
-- who may not use schema private – calling private.name_allowed() from it failed every profile save
-- ("permission denied for schema private"), so new players could not finish the onboarding. The check is now
-- inlined (same lists as private.name_allowed and lib/names.ts); no extra rights are granted.
-- Why the SQL tests missed it: they create the test user as postgres first, which runs the trigger once and
-- caches its plan; later calls as `authenticated` reused it. supabase/tests/profile_save.sql now switches the
-- role before the trigger ever runs in the transaction.
create or replace function private.clean_display_name() returns trigger language plpgsql set search_path = '' as $$
declare
  v_plain text := translate(lower(coalesce(new.display_name, '')), '013457@$€', 'oieastase');
  v_words text[] := array(select w from regexp_split_to_table(v_plain, '[^a-zäöüß]+') as w where w <> '');
  v_joined text := array_to_string(v_words, '');
begin
  if exists (select 1 from unnest(array['arschloch', 'fotze', 'wichser', 'hurensohn', 'schlampe', 'missgeburt', 'schwuchtel', 'kanake', 'judensau', 'nigger', 'nigga', 'neger', 'zigeuner', 'hitler', 'heilhitler', 'siegheil', 'fuck', 'bitch', 'cunt', 'whore', 'faggot', 'retard', 'motherf']) b where v_joined like '%' || b || '%')
     or v_words && array['arsch', 'fick', 'ficken', 'nutte', 'hure', 'spast', 'spasti', 'shit', 'dick', 'cock', 'slut', 'rape', 'porn', 'porno', 'sex', 'nazi', 'nazis'] then
    new.display_name := 'Neugierig';
  end if;
  return new;
end $$;
