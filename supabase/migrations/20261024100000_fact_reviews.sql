-- "Did you know" facts ship with the app like books, animations and visualisations: editors can now approve
-- them (with the fingerprint of the reviewed version) in the review screen.
alter table public.content_reviews drop constraint content_reviews_kind_check;
alter table public.content_reviews add constraint content_reviews_kind_check check (kind in ('question', 'video', 'book', 'animation', 'visual', 'fact'));

create or replace function public.review_content(p_kind text, p_id text, p_decision text, p_note text default null, p_hash text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce((select public.is_admin()), false) then raise exception 'admin only' using errcode = '42501'; end if;
  if p_kind not in ('question', 'video', 'book', 'animation', 'visual', 'fact') or p_decision not in ('approved', 'change') then raise exception 'invalid arguments'; end if;
  if p_decision = 'change' and coalesce(btrim(p_note), '') = '' then raise exception 'a change request needs a note'; end if;
  if p_kind in ('book', 'animation', 'visual', 'fact') and p_decision = 'approved' and (p_hash is null or p_hash !~ '^[0-9a-f]{8}$') then raise exception 'an approval of bundled content needs the fingerprint of the reviewed version'; end if;
  insert into public.content_reviews (kind, id, decision, note, content_hash, reviewed_by, reviewed_at)
  values (p_kind, p_id, p_decision, nullif(btrim(p_note), ''), p_hash, (select auth.uid()), now())
  on conflict (kind, id) do update set decision = excluded.decision, note = excluded.note, content_hash = excluded.content_hash, reviewed_by = excluded.reviewed_by, reviewed_at = excluded.reviewed_at;
end $$;
