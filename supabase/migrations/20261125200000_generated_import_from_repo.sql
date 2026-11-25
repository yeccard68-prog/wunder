-- Generated question files no longer ship with the app: public/gen/*.json could be downloaded by anyone, answers
-- (correct_index, explanation) included. The files now live in content/gen (repository only, not part of the site),
-- and the database loads them from GitHub at a fixed commit. import_generated_rows takes the rows directly – for small
-- sets passed through execute_sql. Both stay callable only by the database owner, and both accept generated ids only.
-- Importing a file again no longer rewrites the existing rows: the image columns are only written when they change.

create or replace function public.import_generated_rows(p_rows jsonb)
returns int
language plpgsql security definer set search_path = public as $$
declare
  added int;
begin
  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'expected a JSON array of generated cards';
  end if;
  if exists (select 1 from jsonb_array_elements(p_rows) r where coalesce(r->>'id', '') !~ '^wd-[a-z0-9]+-Q[0-9]+(-[rf])?$') then
    raise exception 'only generated ids (wd-<template>-Q…)';
  end if;
  with ins as (
    insert into public.questions (id, kind, category_id, question, options, difficulty, tags, source_name, source_url, verification_status, status, show_in_feed, min_age, translations, origin, countries, image_url, image_credit, image_source)
    select r->>'id', coalesce(r->>'kind', 'question'), r->>'category_id', r->>'question', r->'options', (r->>'difficulty')::int,
           array(select jsonb_array_elements_text(coalesce(r->'tags', '[]'))), r->>'source_name', r->>'source_url', 'ai_checked', 'published', true,
           coalesce((r->>'min_age')::int, 10),
           jsonb_build_object('en', jsonb_build_object('question', r#>>'{translations,en,question}', 'options', r#>'{translations,en,options}')),
           'generated', array(select jsonb_array_elements_text(coalesce(r->'countries', '[]'))),
           r->>'image_url', r->>'image_credit', r->>'image_source'
    from jsonb_array_elements(p_rows) r
    on conflict (id) do update set image_url = excluded.image_url, image_credit = excluded.image_credit, image_source = excluded.image_source
      where questions.origin = 'generated'
        and (questions.image_url, questions.image_credit, questions.image_source)
            is distinct from (excluded.image_url, excluded.image_credit, excluded.image_source)
    returning id, (xmax = 0) as inserted
  )
  select count(*) filter (where inserted) into added from ins;
  insert into public.question_answers (question_id, correct_index, explanation, translations)
  select r->>'id', (r->>'correct_index')::int, r->>'explanation', jsonb_build_object('en', jsonb_build_object('explanation', r#>>'{translations,en,explanation}'))
  from jsonb_array_elements(p_rows) r
  where exists (select 1 from public.questions q where q.id = r->>'id' and q.origin = 'generated')
  on conflict (question_id) do nothing;
  return added;
end;
$$;

create or replace function public.import_generated(p_url text)
returns int
language plpgsql security definer set search_path = public, extensions as $$
declare
  res extensions.http_response;
begin
  if p_url !~ '^https://raw\.githubusercontent\.com/yeccard68-prog/wunder/[0-9a-f]{40}/content/gen/[a-z0-9-]+\.json$' then
    raise exception 'only content/gen files of the app repository at a fixed commit';
  end if;
  res := extensions.http_get(p_url);
  if res.status <> 200 then raise exception 'download failed: %', res.status; end if;
  return public.import_generated_rows(res.content::jsonb);
end;
$$;

revoke execute on function public.import_generated(text) from public, anon, authenticated;
revoke execute on function public.import_generated_rows(jsonb) from public, anon, authenticated;
