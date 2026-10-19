-- Offensive display names: others see them in duels. The same lists as lib/names.ts (a test keeps them equal).
-- Such a name is replaced by "Neugierig" instead of refusing the save – a refused save would also lose the
-- rest of the profile. Reports can now be resolved by editors: reset the name or keep it; the reports close.

create function private.name_allowed(p_name text) returns boolean language sql immutable set search_path = '' as $$
  with plain as (select translate(lower(coalesce(p_name, '')), '013457@$€', 'oieastase') as t),
  words as (select w from plain, regexp_split_to_table(plain.t, '[^a-zäöüß]+') as w where w <> '')
  select not exists (
      select 1 from unnest(array['arschloch', 'fotze', 'wichser', 'hurensohn', 'schlampe', 'missgeburt', 'schwuchtel', 'kanake', 'judensau', 'nigger', 'nigga', 'neger', 'zigeuner', 'hitler', 'heilhitler', 'siegheil', 'fuck', 'bitch', 'cunt', 'whore', 'faggot', 'retard', 'motherf']) b
      where coalesce((select string_agg(w, '') from words), '') like '%' || b || '%')
    and not exists (select 1 from words where w = any (array['arsch', 'fick', 'ficken', 'nutte', 'hure', 'spast', 'spasti', 'shit', 'dick', 'cock', 'slut', 'rape', 'porn', 'porno', 'sex', 'nazi', 'nazis']))
$$;

create function private.clean_display_name() returns trigger language plpgsql set search_path = '' as $$
begin
  if not private.name_allowed(new.display_name) then new.display_name := 'Neugierig'; end if;
  return new;
end $$;
create trigger profiles_clean_display_name before insert or update of display_name on public.profiles
  for each row execute function private.clean_display_name();

alter table public.duel_reports add column resolved_at timestamptz;

create or replace function public.admin_duel_reports() returns table (reported uuid, display_name text, reports bigint, reasons text[], last_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select r.reported, p.display_name, count(*), array_agg(distinct r.reason), max(r.created_at)
    from public.duel_reports r left join public.profiles p on p.id = r.reported
    where r.reported is not null and r.resolved_at is null
    group by r.reported, p.display_name order by count(*) desc, max(r.created_at) desc;
end $$;

-- editors: reset a reported name to "Neugierig" (p_reset) or keep it; either way that player's open reports close
create function public.admin_resolve_reports(p_user uuid, p_reset boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_reset then update public.profiles set display_name = 'Neugierig' where id = p_user; end if;
  update public.duel_reports set resolved_at = now() where reported = p_user and resolved_at is null;
end $$;

revoke execute on function private.name_allowed(text), private.clean_display_name() from public, anon, authenticated;
revoke execute on function public.admin_resolve_reports(uuid, boolean) from public, anon;
grant execute on function public.admin_resolve_reports(uuid, boolean) to authenticated;
