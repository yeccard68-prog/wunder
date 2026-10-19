-- Chat in duels (between people) and in groups. Only for players aged 16+ – younger players never see it.
-- Protection on the server: word filter, no links, e-mail addresses or phone numbers (keeps contact data out),
-- at most 500 characters, a rate limit, reporting (hides the message for the reporter at once and for everyone
-- after three reports, until an editor decides), blocking the author without ever revealing who it is,
-- and messages are deleted after 90 days.

create table public.chat_messages (
  id         bigint generated always as identity primary key,
  duel_id    uuid references public.duels (id) on delete cascade,
  group_id   uuid references public.groups (id) on delete cascade,
  author     uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  hidden     boolean not null default false,
  created_at timestamptz not null default now(),
  check ((duel_id is null) <> (group_id is null))
);
create index chat_messages_duel on public.chat_messages (duel_id, id) where duel_id is not null;
create index chat_messages_group on public.chat_messages (group_id, id) where group_id is not null;
create index chat_messages_author on public.chat_messages (author, created_at);
create index chat_messages_age on public.chat_messages (created_at);
create table public.chat_reports (
  message_id  bigint not null references public.chat_messages (id) on delete cascade,
  reporter    uuid not null references public.profiles (id) on delete cascade,
  reason      text not null check (reason in ('insult', 'spam', 'personal', 'other')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  primary key (message_id, reporter)
);
alter table public.chat_messages enable row level security;
alter table public.chat_reports enable row level security;

create function private.chat_age_ok(p_user uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.age_band = '16+' from public.profiles p where p.id = p_user), false)
$$;

-- same word lists as private.name_allowed, but checked word by word (in a sentence, joining all words would
-- find insults across word borders), plus anything that looks like a link or contact data
create function private.chat_text_allowed(p_text text) returns boolean language sql immutable set search_path = '' as $$
  with plain as (select translate(lower(coalesce(p_text, '')), '013457@$€', 'oieastase') as t),
  words as (select w from plain, regexp_split_to_table(plain.t, '[^a-zäöüß]+') as w where w <> '')
  select not exists (
      select 1 from words, unnest(array['arschloch', 'fotze', 'wichser', 'hurensohn', 'schlampe', 'missgeburt', 'schwuchtel', 'kanake', 'judensau', 'nigger', 'nigga', 'neger', 'zigeuner', 'hitler', 'heilhitler', 'siegheil', 'fuck', 'bitch', 'cunt', 'whore', 'faggot', 'retard', 'motherf']) b
      where w like '%' || b || '%')
    and not exists (select 1 from words where w = any (array['arsch', 'fick', 'ficken', 'nutte', 'hure', 'spast', 'spasti', 'shit', 'dick', 'cock', 'slut', 'rape', 'porn', 'porno', 'sex', 'nazi', 'nazis']))
    and p_text !~* '(https?://|www\.|[a-z0-9-]+\.(com|de|net|org|io|me|at|ch|ly|gg|tv|app|info|eu|co|uk)\M)'
    and p_text !~ '[^\s@]+@[^\s@]+\.[^\s@]+'
    and regexp_replace(p_text, '[\s()/.-]', '', 'g') !~ '\+?[0-9]{7,}'
$$;

-- who may chat where: duels between two people (not the computer) that are still visible to both, and groups
create function private.chat_place_ok(p_user uuid, p_duel uuid, p_group uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select private.chat_age_ok(p_user) and case
    when p_duel is not null then exists (
      select 1 from public.duels d where d.id = p_duel and d.kind <> 'bot' and d.player_b is not null
        and (d.player_a = p_user or d.player_b = p_user)
        and private.chat_age_ok(case when d.player_a = p_user then d.player_b else d.player_a end)
        and not private.duel_blocked(d.player_a, d.player_b))
    when p_group is not null then private.group_member(p_group, p_user)
    else false end
$$;

create function public.chat_list(p_duel uuid default null, p_group uuid default null, p_after bigint default 0) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if not private.chat_place_ok(v_user, p_duel, p_group) then return jsonb_build_object('allowed', false, 'messages', '[]'::jsonb); end if;
  delete from public.chat_messages where created_at < now() - interval '90 days';
  return jsonb_build_object('allowed', true, 'messages', coalesce((select jsonb_agg(x order by (x ->> 'id')::bigint) from (
    select jsonb_build_object('id', m.id, 'mine', m.author = v_user, 'name', case when m.author = v_user then null else private.duel_name(m.author) end,
      'body', m.body, 'at', m.created_at) as x
    from public.chat_messages m
    where (m.duel_id = p_duel or m.group_id = p_group) and m.id > coalesce(p_after, 0)
      and (not m.hidden or m.author = v_user)
      and not private.duel_blocked(v_user, m.author)
      and not exists (select 1 from public.chat_reports r where r.message_id = m.id and r.reporter = v_user)
    order by m.id desc limit 100) t), '[]'::jsonb));
end $$;

create function public.chat_send(p_duel uuid default null, p_group uuid default null, p_body text default '') returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_body text := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g'));
  v_id bigint;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if not private.chat_place_ok(v_user, p_duel, p_group) then raise exception 'chat not available' using errcode = '42501'; end if;
  if char_length(v_body) not between 1 and 500 then raise exception 'message length' using errcode = '22023'; end if;
  if not private.chat_text_allowed(v_body) then raise exception 'message not allowed' using errcode = '22023'; end if;
  if (select count(*) from public.chat_messages where author = v_user and created_at > now() - interval '30 seconds') >= 5
     or (select count(*) from public.chat_messages where author = v_user and created_at > now() - interval '1 day') >= 300 then
    raise exception 'slow down' using errcode = '54000';
  end if;
  insert into public.chat_messages (duel_id, group_id, author, body) values (p_duel, p_group, v_user, v_body) returning id into v_id;
  return jsonb_build_object('id', v_id, 'mine', true, 'name', null, 'body', v_body, 'at', now());
end $$;

-- report a message: hidden for the reporter at once, for everyone after three reports; p_block also blocks the author
create function public.chat_report(p_message bigint, p_reason text, p_block boolean default false) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  m public.chat_messages%rowtype;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select * into m from public.chat_messages where id = p_message;
  if not found or m.author = v_user or not private.chat_place_ok(v_user, m.duel_id, m.group_id) then raise exception 'message not found' using errcode = 'P0002'; end if;
  insert into public.chat_reports (message_id, reporter, reason) values (p_message, v_user, p_reason) on conflict do nothing;
  if (select count(*) from public.chat_reports where message_id = p_message and resolved_at is null) >= 3 then
    update public.chat_messages set hidden = true where id = p_message;
  end if;
  if p_block then insert into public.duel_blocks (user_id, blocked) values (v_user, m.author) on conflict do nothing; end if;
end $$;

create function public.admin_chat_reports() returns table (message_id bigint, body text, author uuid, display_name text, reports bigint, reasons text[], hidden boolean, last_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select m.id, m.body, m.author, p.display_name, count(*), array_agg(distinct r.reason), m.hidden, max(r.created_at)
    from public.chat_reports r join public.chat_messages m on m.id = r.message_id left join public.profiles p on p.id = m.author
    where r.resolved_at is null
    group by m.id, m.body, m.author, p.display_name, m.hidden order by count(*) desc, max(r.created_at) desc;
end $$;

-- editors: remove the message (p_remove) or show it again; its reports close
create function public.admin_resolve_chat(p_message bigint, p_remove boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  update public.chat_reports set resolved_at = now() where message_id = p_message and resolved_at is null;
  if p_remove then delete from public.chat_messages where id = p_message;
  else update public.chat_messages set hidden = false where id = p_message; end if;
end $$;

revoke execute on function private.chat_age_ok(uuid), private.chat_text_allowed(text), private.chat_place_ok(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.chat_list(uuid, uuid, bigint), public.chat_send(uuid, uuid, text), public.chat_report(bigint, text, boolean),
  public.admin_chat_reports(), public.admin_resolve_chat(bigint, boolean) from public, anon;
grant execute on function public.chat_list(uuid, uuid, bigint), public.chat_send(uuid, uuid, text), public.chat_report(bigint, text, boolean),
  public.admin_chat_reports(), public.admin_resolve_chat(bigint, boolean) to authenticated;
