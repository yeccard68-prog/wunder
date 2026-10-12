-- Usage events for product decisions. Deliberately small: who (the signed-in account), what
-- (one of a fixed list of event names), on which content, when. No free text, no device data,
-- no location. Written only when the learner has switched "Nutzungsstatistik" on, and never for
-- accounts in a children's age band. Clients can insert their own rows and read nothing.
create table public.events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name in ('session_start', 'feed_view', 'clip_start', 'clip_complete', 'animation_start', 'animation_complete', 'insight_complete', 'book_open', 'content_save', 'search')),
  content_id text check (content_id is null or char_length(content_id) <= 64),
  content_kind text check (content_kind is null or content_kind in ('item', 'clip', 'animation', 'insight', 'book')),
  created_at timestamptz not null default now()
);
create index events_name_created_at on public.events (name, created_at);
create index events_user_id on public.events (user_id);
alter table public.events enable row level security;

create policy "own events can be added, never for children" on public.events for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.age_band in ('6-9', '10-12'))
  );
revoke all on public.events from anon, authenticated;
grant insert (name, content_id, content_kind) on public.events to authenticated;
