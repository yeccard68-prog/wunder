-- Content review.
--   1. Nothing unchecked is public: a published question or video must be at least "ai_checked";
--      "verified" is set by a human reviewer (admin) in the app.
--   2. Reports from learners pull content automatically: after three reports by different users
--      it moves to status "review" and disappears from the app until an admin has decided.
--   3. Admins decide through admin_review(): approve (verified + published, reports cleared) or withdraw.

-- Existing content was written and checked by the AI assistant, not yet by a human.
update public.questions set verification_status = 'ai_checked' where verification_status = 'unverified';
update public.videos    set verification_status = 'ai_checked' where verification_status = 'unverified';

alter table public.questions
  add column report_count int not null default 0 check (report_count >= 0),
  add column review_note text,
  add column reviewed_at timestamptz,
  add constraint questions_published_checked check (status <> 'published' or verification_status <> 'unverified');

alter table public.videos
  add column report_count int not null default 0 check (report_count >= 0),
  add column review_note text,
  add column reviewed_at timestamptz,
  add constraint videos_published_checked check (status <> 'published' or verification_status <> 'unverified');

-- Reports only count from users who have actually learned (at least 5 answered questions),
-- so a handful of throw-away guest accounts cannot take content down.
create function private.counts_as_reporter(p_user uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select sum(d.answered_count) from public.daily_activity d where d.user_id = p_user), 0) >= 5;
$$;

create function private.on_question_report() returns trigger language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  select count(*) into n from public.question_reactions r where r.question_id = new.question_id and r.reported and private.counts_as_reporter(r.user_id);
  update public.questions q set
    report_count = n,
    review_note = case when n >= 3 and q.status = 'published' then 'Automatisch zurückgestellt: ' || n || ' Meldungen' else q.review_note end,
    status = case when n >= 3 and q.status = 'published' then 'review' else q.status end
  where q.id = new.question_id;
  return null;
end $$;
create trigger on_report after insert or update of reported on public.question_reactions for each row when (new.reported) execute function private.on_question_report();

create function private.on_video_report() returns trigger language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  select count(*) into n from public.video_progress r where r.video_id = new.video_id and r.reported and private.counts_as_reporter(r.user_id);
  update public.videos v set
    report_count = n,
    review_note = case when n >= 3 and v.status = 'published' then 'Automatisch zurückgestellt: ' || n || ' Meldungen' else v.review_note end,
    status = case when n >= 3 and v.status = 'published' then 'review' else v.status end
  where v.id = new.video_id;
  return null;
end $$;
create trigger on_report after insert or update of reported on public.video_progress for each row when (new.reported) execute function private.on_video_report();

-- Admin decision. p_kind: 'question' | 'video'. p_action: 'approve' | 'withdraw'.
create function public.admin_review(p_kind text, p_id text, p_action text, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false) then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if p_action not in ('approve', 'withdraw') or p_kind not in ('question', 'video') then raise exception 'invalid arguments'; end if;

  if p_kind = 'question' then
    if p_action = 'approve' then
      update public.question_reactions set reported = false where question_id = p_id and reported;
      update public.questions set status = 'published', verification_status = 'verified', report_count = 0, review_note = p_note, reviewed_at = now() where id = p_id;
    else
      update public.questions set status = 'archived', review_note = coalesce(p_note, review_note), reviewed_at = now() where id = p_id;
    end if;
  else
    if p_action = 'approve' then
      update public.video_progress set reported = false where video_id = p_id and reported;
      update public.videos set status = 'published', verification_status = 'verified', report_count = 0, review_note = p_note, reviewed_at = now() where id = p_id;
    else
      update public.videos set status = 'archived', review_note = coalesce(p_note, review_note), reviewed_at = now() where id = p_id;
    end if;
  end if;
  if not found then raise exception 'not found' using errcode = 'P0002'; end if;
end $$;
revoke execute on function public.admin_review(text, text, text, text) from public, anon;
grant execute on function public.admin_review(text, text, text, text) to authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;
