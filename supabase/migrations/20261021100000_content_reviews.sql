-- Human review of everything in the app, including the content that ships inside the app itself
-- (books, animations, interactive visualisations live in content/*.json, not in the database).
--
-- One row per reviewed piece: approved, or a change requested with a note. For bundled content the
-- row also stores a fingerprint of the exact text that was reviewed; the app shows it as "checked by
-- an editor" only while the text is unchanged. If the content is edited later, the approval lapses
-- and the piece is back in the queue – an approval never covers text nobody has read.
-- Questions and clips keep using admin_review() for approving and withdrawing (it sets their status
-- in their own tables); change requests and notes for them are kept here as well.
create table public.content_reviews (
  kind text not null check (kind in ('question', 'video', 'book', 'animation', 'visual')),
  id text not null check (char_length(id) <= 64),
  decision text not null check (decision in ('approved', 'change')),
  note text check (note is null or char_length(note) <= 2000),
  content_hash text check (content_hash is null or content_hash ~ '^[0-9a-f]{8}$'),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz not null default now(),
  primary key (kind, id)
);
alter table public.content_reviews enable row level security;

-- Everyone may see which bundled pieces are approved (and for which version) – that is what the app
-- shows as "checked by an editor". Notes and change requests are for the editors only.
create policy "approvals are public" on public.content_reviews for select to anon, authenticated using (decision = 'approved');
revoke all on public.content_reviews from anon, authenticated;
grant select (kind, id, decision, content_hash) on public.content_reviews to anon, authenticated;

-- An editor records a decision.
create function public.review_content(p_kind text, p_id text, p_decision text, p_note text default null, p_hash text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce((select public.is_admin()), false) then raise exception 'admin only' using errcode = '42501'; end if;
  if p_kind not in ('question', 'video', 'book', 'animation', 'visual') or p_decision not in ('approved', 'change') then raise exception 'invalid arguments'; end if;
  if p_decision = 'change' and coalesce(btrim(p_note), '') = '' then raise exception 'a change request needs a note'; end if;
  if p_kind in ('book', 'animation', 'visual') and p_decision = 'approved' and (p_hash is null or p_hash !~ '^[0-9a-f]{8}$') then raise exception 'an approval of bundled content needs the fingerprint of the reviewed version'; end if;
  insert into public.content_reviews (kind, id, decision, note, content_hash, reviewed_by, reviewed_at)
  values (p_kind, p_id, p_decision, nullif(btrim(p_note), ''), p_hash, (select auth.uid()), now())
  on conflict (kind, id) do update set decision = excluded.decision, note = excluded.note, content_hash = excluded.content_hash, reviewed_by = excluded.reviewed_by, reviewed_at = excluded.reviewed_at;
end $$;

-- An editor reads all decisions, including notes and change requests.
create function public.admin_content_reviews()
returns table (kind text, id text, decision text, note text, content_hash text, reviewed_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not coalesce((select public.is_admin()), false) then raise exception 'admin only' using errcode = '42501'; end if;
  return query select r.kind, r.id, r.decision, r.note, r.content_hash, r.reviewed_at from public.content_reviews r order by r.reviewed_at desc;
end $$;

revoke execute on function public.review_content(text, text, text, text, text) from public, anon;
grant execute on function public.review_content(text, text, text, text, text) to authenticated;
revoke execute on function public.admin_content_reviews() from public, anon;
grant execute on function public.admin_content_reviews() to authenticated;
