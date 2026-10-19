-- "Hinweis an die Redaktion": players can tell the editors that something on a card is wrong, a source is
-- missing or better, a text is unclear – or suggest an idea. Not public: only editors read the hints.
-- Optional note (≤ 500 characters) goes through the chat filter (no insults, links or contact data).
-- At most 20 hints a day per player; the same card can be pointed out once per player and reason.
-- Hints are deleted 180 days after an editor closed them.

create table public.content_hints (
  id          bigint generated always as identity primary key,
  author      uuid references public.profiles (id) on delete set null,
  kind        text not null check (kind in ('question', 'fact', 'video', 'animation', 'book', 'visual')),
  content_id  text not null check (char_length(content_id) between 1 and 100),
  reason      text not null check (reason in ('error', 'source', 'unclear', 'idea', 'other')),
  note        text check (char_length(note) <= 500),
  locale      text not null default 'de' check (locale in ('de', 'en')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolution  text check (resolution in ('fixed', 'kept'))
);
create unique index content_hints_once on public.content_hints (author, kind, content_id, reason) where resolved_at is null;
create index content_hints_open on public.content_hints (created_at) where resolved_at is null;
alter table public.content_hints enable row level security;

create function public.content_hint_send(p_kind text, p_id text, p_reason text, p_note text default null, p_locale text default 'de') returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_note text := nullif(btrim(regexp_replace(coalesce(p_note, ''), '\s+', ' ', 'g')), '');
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if v_note is not null and (char_length(v_note) > 500 or not private.chat_text_allowed(v_note)) then raise exception 'note not allowed' using errcode = '22023'; end if;
  if (select count(*) from public.content_hints where author = v_user and created_at > now() - interval '1 day') >= 20 then
    raise exception 'slow down' using errcode = '54000';
  end if;
  delete from public.content_hints where resolved_at < now() - interval '180 days';
  insert into public.content_hints (author, kind, content_id, reason, note, locale)
    values (v_user, p_kind, p_id, p_reason, v_note, case when p_locale = 'en' then 'en' else 'de' end)
    on conflict (author, kind, content_id, reason) where resolved_at is null do update set note = coalesce(excluded.note, public.content_hints.note), created_at = now();
end $$;

-- editors: open hints grouped by card, most hints first
create function public.admin_content_hints() returns table (kind text, content_id text, hints bigint, reasons text[], notes text[], last_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select h.kind, h.content_id, count(*), array_agg(distinct h.reason), array_remove(array_agg(h.note order by h.created_at desc), null), max(h.created_at)
    from public.content_hints h where h.resolved_at is null
    group by h.kind, h.content_id order by count(*) desc, max(h.created_at) desc;
end $$;

-- editors: close all open hints of a card – corrected ('fixed') or left as it is ('kept')
create function public.admin_resolve_hints(p_kind text, p_id text, p_resolution text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_resolution not in ('fixed', 'kept') then raise exception 'invalid resolution'; end if;
  update public.content_hints set resolved_at = now(), resolution = p_resolution where kind = p_kind and content_id = p_id and resolved_at is null;
end $$;

revoke execute on function public.content_hint_send(text, text, text, text, text), public.admin_content_hints(), public.admin_resolve_hints(text, text, text) from public, anon;
grant execute on function public.content_hint_send(text, text, text, text, text), public.admin_content_hints(), public.admin_resolve_hints(text, text, text) to authenticated;
