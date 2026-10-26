-- Pictures on cards: a thumbnail on the app's own site (image_url), its credit (author · licence) and the page of the
-- original file (image_source). import_generated now also fills these – for generated cards that already exist it
-- updates only these three columns, never the question itself.

alter table public.questions add column if not exists image_url text;
alter table public.questions add column if not exists image_credit text;
alter table public.questions add column if not exists image_source text;

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
    insert into public.questions (id, kind, category_id, question, options, difficulty, tags, source_name, source_url, verification_status, status, show_in_feed, min_age, translations, origin, countries, image_url, image_credit, image_source)
    select r->>'id', 'question', r->>'category_id', r->>'question', r->'options', (r->>'difficulty')::int,
           array(select jsonb_array_elements_text(coalesce(r->'tags', '[]'))), r->>'source_name', r->>'source_url', 'ai_checked', 'published', true,
           coalesce((r->>'min_age')::int, 10),
           jsonb_build_object('en', jsonb_build_object('question', r#>>'{translations,en,question}', 'options', r#>'{translations,en,options}')),
           'generated', array(select jsonb_array_elements_text(coalesce(r->'countries', '[]'))),
           r->>'image_url', r->>'image_credit', r->>'image_source'
    from jsonb_array_elements(rows) r
    on conflict (id) do update set image_url = excluded.image_url, image_credit = excluded.image_credit, image_source = excluded.image_source
      where questions.origin = 'generated'
    returning id, (xmax = 0) as inserted
  )
  select count(*) filter (where inserted) into added from ins;
  insert into public.question_answers (question_id, correct_index, explanation, translations)
  select r->>'id', (r->>'correct_index')::int, r->>'explanation', jsonb_build_object('en', jsonb_build_object('explanation', r#>>'{translations,en,explanation}'))
  from jsonb_array_elements(rows) r
  where exists (select 1 from public.questions q where q.id = r->>'id' and q.origin = 'generated')
  on conflict (question_id) do nothing;
  return added;
end;
$$;
revoke execute on function public.import_generated(text) from public, anon, authenticated;
