-- is_admin() no longer needs elevated rights and is no longer callable without signing in.
-- Anonymous visitors get their own read policies that never touch profiles.
create or replace function public.is_admin() returns boolean language sql stable security invoker set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false);
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy "published categories are public" on public.categories;
drop policy "published questions are public"  on public.questions;
drop policy "published videos are public"     on public.videos;

create policy "anon reads active categories"    on public.categories for select to anon using (is_active);
create policy "anon reads published questions"  on public.questions  for select to anon using (status = 'published');
create policy "anon reads published videos"     on public.videos     for select to anon using (status = 'published');

create policy "users read active categories"    on public.categories for select to authenticated using (is_active or (select public.is_admin()));
create policy "users read published questions"  on public.questions  for select to authenticated using (status = 'published' or (select public.is_admin()));
create policy "users read published videos"     on public.videos     for select to authenticated using (status = 'published' or (select public.is_admin()));
