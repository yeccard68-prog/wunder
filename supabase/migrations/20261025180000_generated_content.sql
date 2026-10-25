-- Generated content (e.g. questions built from Wikidata) next to the hand-made cards.
--  - questions.origin: 'editorial' (hand-made, loaded in full at app start) or 'generated' (thousands – the app
--    fetches them in portions with sample_generated, so the start stays fast);
--  - questions.countries: ISO 3166 codes of the countries a card is about – the feed prefers the learner's own;
--  - import_generated(url): the database loads a prepared file from the app's own site and inserts it (new rows
--    only, never overwrites) – so thousands of rows need no hand-pasted SQL. Only the database owner may call it.

alter table public.questions add column if not exists origin text not null default 'editorial' check (origin in ('editorial', 'generated'));
alter table public.questions add column if not exists countries text[];
create index if not exists questions_origin_idx on public.questions (origin, status);

create extension if not exists http with schema extensions;

-- A random portion of generated cards for the feed: published only (RLS applies – security invoker), for the
-- learner's age, the chosen topics first and cards about their country more often, without the ids already on the device.
create or replace function public.sample_generated(p_categories text[], p_region text, p_age int, p_exclude text[], p_limit int default 60)
returns setof public.questions
language sql stable security invoker set search_path = public as $$
  select q.* from public.questions q
  where q.origin = 'generated' and q.status = 'published' and q.show_in_feed
    and q.min_age <= coalesce(p_age, 16) and (q.max_age is null or q.max_age >= coalesce(p_age, 16))
    and not (q.id = any (coalesce(p_exclude, '{}')))
  order by random() * (case when p_region is not null and p_region = any (coalesce(q.countries, '{}')) then 0.4 else 1 end)
                    * (case when q.category_id = any (coalesce(p_categories, '{}')) then 0.6 else 1 end)
  limit least(greatest(coalesce(p_limit, 60), 1), 200);
$$;
grant execute on function public.sample_generated(text[], text, int, text[], int) to anon, authenticated;

-- Imports a prepared file: [{ id, category_id, question, options, correct_index, explanation, difficulty, tags,
-- source_name, source_url, min_age, countries, translations: { en: { question, options, explanation } } }, …]
-- Only files from the app's own site; existing ids are left untouched.
create or replace function public.import_generated(p_url text)
returns int
language plpgsql security definer set search_path = public, extensions as $$
declare
  res extensions.http_response;
  rows jsonb;
  added int;
begin
  if p_url !~ '^https://wunder-one\.vercel\.app/gen/[a-z0-9-]+\.json$' then
    raise exception 'only files from the app site';
  end if;
  res := extensions.http_get(p_url);
  if res.status <> 200 then raise exception 'download failed: %', res.status; end if;
  rows := res.content::jsonb;
  with ins as (
    insert into public.questions (id, kind, category_id, question, options, difficulty, tags, source_name, source_url, verification_status, status, show_in_feed, min_age, translations, origin, countries)
    select r->>'id', 'question', r->>'category_id', r->>'question', r->'options', (r->>'difficulty')::int,
           array(select jsonb_array_elements_text(coalesce(r->'tags', '[]'))), r->>'source_name', r->>'source_url', 'ai_checked', 'published', true,
           coalesce((r->>'min_age')::int, 10),
           jsonb_build_object('en', jsonb_build_object('question', r#>>'{translations,en,question}', 'options', r#>'{translations,en,options}')),
           'generated', array(select jsonb_array_elements_text(coalesce(r->'countries', '[]')))
    from jsonb_array_elements(rows) r
    on conflict (id) do nothing
    returning id
  )
  select count(*) into added from ins;
  insert into public.question_answers (question_id, correct_index, explanation, translations)
  select r->>'id', (r->>'correct_index')::int, r->>'explanation', jsonb_build_object('en', jsonb_build_object('explanation', r#>>'{translations,en,explanation}'))
  from jsonb_array_elements(rows) r
  where exists (select 1 from public.questions q where q.id = r->>'id' and q.origin = 'generated')
  on conflict (question_id) do nothing;
  return added;
end;
$$;
revoke execute on function public.import_generated(text) from public, anon, authenticated;
